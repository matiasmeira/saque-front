"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { publico } from "@/lib/api/endpoints/publico";
import { keys } from "@/lib/api/keys";
import { partirFechaHora } from "@/lib/api/fechas";
import { abreviaturaDeporte, etiquetaDeporte } from "@/lib/deportes";
import { proximosDias } from "@/components/canche/selector-fecha";
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";
import type { DisponibilidadCanchaResponse } from "@/lib/api/tipos/disponibilidad";

/**
 * Grilla de turnos libres del complejo.
 *
 * Toda la matemática que antes vivía en src/lib/disponibilidad.ts —
 * segmentosDelDia, horariosLibres y el hack ocupadoConVariacion que desplazaba
 * la ocupación de "hoy" para fingir otros días — se fue. El backend devuelve
 * la grilla ya cruzada contra horarios de atención, días no laborables,
 * bloqueos y reservas, y excluye los slots que ya pasaron.
 *
 * Cada slot trae `inicio` y `fin`, que son exactamente los dos campos que pide
 * ReservaRequest: viajan tal cual al checkout. Recalcular el fin a partir de
 * una duración es la forma de terminar con un 400 por duración no permitida.
 */
const DIAS_VISIBLES = 7;

export function GrillaDisponibilidad({ complejo }: { complejo: ComplejoDetalleResponse }) {
  const dias = proximosDias(DIAS_VISIBLES);
  const [indiceDia, setIndiceDia] = useState(0);
  const [deporteFiltro, setDeporteFiltro] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);

  const fecha = dias[indiceDia].valor;

  const disponibilidad = useQuery({
    queryKey: keys.publico.disponibilidad(complejo.slug, fecha),
    queryFn: () => publico.disponibilidad(complejo.slug, fecha),
  });

  const dia = disponibilidad.data?.dias[0];
  const canchas = (dia?.canchas ?? []).filter(
    (cancha) => !deporteFiltro || cancha.deportes.includes(deporteFiltro as never),
  );

  // Las duraciones que ofrece este complejo, para el selector de arriba.
  const duraciones = [
    ...new Set(
      (dia?.canchas ?? []).flatMap((c) => c.opcionesDuracion.map((o) => o.duracionMinutos)),
    ),
  ].sort((a, b) => a - b);
  const duracionActiva = duracion ?? duraciones[0] ?? 60;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIndiceDia((i) => Math.max(0, i - 1))}
            disabled={indiceDia === 0}
            aria-label="Día anterior"
            className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white disabled:text-borde"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <span className="min-w-[9rem] text-center font-semibold text-tinta">
            {dias[indiceDia].etiqueta}
          </span>
          <button
            type="button"
            onClick={() => setIndiceDia((i) => Math.min(DIAS_VISIBLES - 1, i + 1))}
            disabled={indiceDia === DIAS_VISIBLES - 1}
            aria-label="Día siguiente"
            className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white disabled:text-borde"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {complejo.deportes.length > 1 &&
            complejo.deportes.map((deporte) => (
              <button
                key={deporte}
                type="button"
                onClick={() => setDeporteFiltro((d) => (d === deporte ? null : deporte))}
                className={`h-9 rounded-full border px-3 text-xs font-bold uppercase transition-colors ${
                  deporteFiltro === deporte
                    ? "border-azul bg-azul text-white"
                    : "border-borde bg-white text-grafito hover:border-azul hover:text-azul"
                }`}
              >
                {abreviaturaDeporte(deporte)}
              </button>
            ))}

          {duraciones.length > 1 &&
            duraciones.map((minutos) => (
              <button
                key={minutos}
                type="button"
                onClick={() => setDuracion(minutos)}
                className={`h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  duracionActiva === minutos
                    ? "border-azul bg-azul text-white"
                    : "border-borde bg-white text-grafito hover:border-azul hover:text-azul"
                }`}
              >
                {minutos} min
              </button>
            ))}
        </div>
      </div>

      {disponibilidad.isPending && (
        <p className="rounded-card bg-white p-6 text-sm text-grafito">Buscando turnos...</p>
      )}

      {disponibilidad.isError && (
        <p className="rounded-card bg-white p-6 text-sm text-grafito">
          No pudimos cargar los turnos. Probá de nuevo en un rato.
        </p>
      )}

      {dia && !dia.abierto && (
        <p className="rounded-card bg-white p-6 text-sm text-grafito">
          {dia.motivoCierre ?? "El complejo está cerrado este día."}
        </p>
      )}

      {dia?.abierto && canchas.length === 0 && (
        <p className="rounded-card bg-white p-6 text-sm text-grafito">
          No quedan turnos libres para este día.
        </p>
      )}

      <div className="space-y-4">
        {dia?.abierto &&
          canchas.map((cancha) => (
            <FilaCancha
              key={cancha.canchaId}
              cancha={cancha}
              slug={complejo.slug}
              duracion={duracionActiva}
            />
          ))}
      </div>
    </div>
  );
}

function FilaCancha({
  cancha,
  slug,
  duracion,
}: {
  cancha: DisponibilidadCanchaResponse;
  slug: string;
  duracion: number;
}) {
  const opcion = cancha.opcionesDuracion.find((o) => o.duracionMinutos === duracion);
  const slots = opcion?.slotsLibres ?? [];

  return (
    <div className="rounded-card bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-bold text-tinta">{cancha.canchaNombre}</h3>
        <span className="text-xs text-grafito">
          {cancha.deportes.map(etiquetaDeporte).join(" · ")}
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-grafito">
          Sin turnos de {duracion} min disponibles este día.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const { hora } = partirFechaHora(slot.inicio);
            // El slot viaja entero: inicio y fin son lo que pide ReservaRequest.
            const href = `/reservar/${slug}?cancha=${cancha.canchaId}&inicio=${slot.inicio}&fin=${slot.fin}&deporte=${cancha.deportes[0]}`;
            return (
              <Link
                key={slot.inicio}
                href={href}
                className="inline-flex h-11 min-w-[64px] items-center justify-center rounded-input border border-borde bg-white px-3 text-sm font-semibold text-tinta transition-colors hover:border-azul hover:bg-celeste-suave hover:text-azul"
              >
                {hora}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
