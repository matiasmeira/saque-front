"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { publico } from "@/lib/api/endpoints/publico";
import { reservas } from "@/lib/api/endpoints/reservas";
import { keys } from "@/lib/api/keys";
import { partirFechaHora } from "@/lib/api/fechas";
import { aMinutos } from "@/lib/disponibilidad";
import { rangoDeAgenda } from "@/lib/horarios";
import { familiasDeDeportes } from "@/lib/deportes";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { usePerfil } from "@/hooks/api/use-perfil";
import { proximosDias } from "@/components/canche/selector-fecha";
import { Selector } from "@/components/canche/selector";
import { GrillaHorarios } from "@/components/canche/grilla-horarios";
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";

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
 *
 * La grilla visual (horas en columnas, canchas en filas) vive en
 * GrillaHorarios; acá sólo se arman los filtros (día, familia de deporte,
 * duración) y los datos que esa grilla necesita: el rango horario del día
 * (rangoDeAgenda) y, para un jugador logueado, sus propias reservas del día
 * para pintar "Tu reserva" en verde.
 */
const DIAS_VISIBLES = 7;

export function GrillaDisponibilidad({ complejo }: { complejo: ComplejoDetalleResponse }) {
  const dias = proximosDias(DIAS_VISIBLES);
  const [indiceDia, setIndiceDia] = useState(0);
  const familias = familiasDeDeportes(complejo.deportes);
  const [familiaFiltro, setFamiliaFiltro] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);

  const fecha = dias[indiceDia].valor;
  const familiaActiva = familias.find((f) => f.valor === familiaFiltro) ?? familias[0] ?? null;

  const disponibilidad = useQuery({
    queryKey: keys.publico.disponibilidad(complejo.slug, fecha),
    queryFn: () => publico.disponibilidad(complejo.slug, fecha),
  });

  const haySesion = useHaySesion();
  const { data: perfil } = usePerfil();
  // Sólo PLAYER puede pegarle a /mis-reservas (un OWNER recibe 403), y esta
  // ficha la puede ver cualquier rol logueado — sin este chequeo, un dueño
  // mirando su propio complejo (o el de otro) dispararía un 403 en cada visita.
  const esJugador = haySesion && perfil?.rol === "PLAYER";

  const misReservas = useQuery({
    queryKey: keys.reservas.mias(),
    queryFn: () => reservas.mias({ size: 50 }),
    enabled: esJugador,
  });

  const dia = disponibilidad.data?.dias[0];
  const canchas = (dia?.canchas ?? []).filter(
    (cancha) => !familiaActiva || cancha.deportes.some((d) => familiaActiva.miembros.includes(d)),
  );

  // Las duraciones que ofrece este complejo (ya filtrado por familia), para el selector de arriba.
  const duraciones = [
    ...new Set(canchas.flatMap((c) => c.opcionesDuracion.map((o) => o.duracionMinutos))),
  ].sort((a, b) => a - b);
  const duracionActiva = duracion ?? duraciones[0] ?? 60;

  const rango = rangoDeAgenda(complejo.horariosAtencion, [fecha], []);

  const reservasPropiasPorCancha = new Map<number, { desde: number; hasta: number }[]>();
  for (const r of misReservas.data?.content ?? []) {
    if (r.estado !== "CONFIRMADA" && r.estado !== "PENDIENTE_SENA") continue;
    if (partirFechaHora(r.fechaHoraInicio).fecha !== fecha) continue;
    const desde = aMinutos(partirFechaHora(r.fechaHoraInicio).hora);
    const hastaCruda = aMinutos(partirFechaHora(r.fechaHoraFin).hora);
    const lista = reservasPropiasPorCancha.get(r.canchaId) ?? [];
    lista.push({ desde, hasta: hastaCruda <= desde ? hastaCruda + 1440 : hastaCruda });
    reservasPropiasPorCancha.set(r.canchaId, lista);
  }

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

        <div className="flex flex-wrap items-center gap-3">
          {familias.length > 1 && (
            <Selector
              id="familia-deporte"
              value={familiaActiva?.valor ?? ""}
              onChange={setFamiliaFiltro}
              opciones={familias}
            />
          )}

          <div className="flex flex-wrap gap-2">
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

      {dia?.abierto && canchas.length > 0 && (
        <GrillaHorarios
          canchas={canchas}
          slug={complejo.slug}
          duracion={duracionActiva}
          rango={rango}
          reservasPropiasPorCancha={reservasPropiasPorCancha}
          mostrarLeyendaPropia={esJugador}
        />
      )}
    </div>
  );
}
