"use client";

import Link from "next/link";

import { agendaDeCancha } from "@/lib/agenda-publica";
import { aMinutos } from "@/lib/disponibilidad";
import { etiquetaDeporte } from "@/lib/deportes";
import type { RangoHorario } from "@/lib/horarios";
import type { DisponibilidadCanchaResponse } from "@/lib/api/tipos/disponibilidad";

/**
 * Grilla horizontal de horarios: columnas de hora, filas de cancha, bloques
 * de color para lo ocupado. Reemplaza a la lista de chips de horarios
 * sueltos que mostraba cada cancha por separado — acá todas comparten un
 * mismo header de horas y cada franja libre es un tramo hoverable/clickeable
 * posicionado por porcentaje.
 */
export function GrillaHorarios({
  canchas,
  slug,
  duracion,
  rango,
  reservasPropiasPorCancha,
  mostrarLeyendaPropia,
}: {
  canchas: DisponibilidadCanchaResponse[];
  slug: string;
  duracion: number;
  rango: RangoHorario;
  reservasPropiasPorCancha: Map<number, { desde: number; hasta: number }[]>;
  mostrarLeyendaPropia: boolean;
}) {
  const abreMin = aMinutos(rango.abre);
  const cierraCrudo = aMinutos(rango.cierra);
  const cierraMin = cierraCrudo <= abreMin ? cierraCrudo + 1440 : cierraCrudo;
  const totalMin = cierraMin - abreMin;
  const horasEnPunto = Array.from({ length: Math.ceil(totalMin / 60) }, (_, i) => abreMin + i * 60);

  return (
    <div>
      <div className="w-full overflow-hidden rounded-card border border-borde bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="flex border-b border-borde bg-humo">
              <div className="sticky left-0 z-10 w-48 shrink-0 border-r border-borde bg-humo" />
              <div className="flex flex-1">
                {horasEnPunto.map((m) => (
                  <div
                    key={m}
                    className="flex-1 border-r border-borde/50 p-3 text-center text-xs text-grafito last:border-r-0"
                  >
                    {String(Math.floor(m / 60) % 24).padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-borde">
              {canchas.map((cancha) => (
                <FilaCanchaGrilla
                  key={cancha.canchaId}
                  cancha={cancha}
                  slug={slug}
                  duracion={duracion}
                  rango={rango}
                  abreMin={abreMin}
                  totalMin={totalMin}
                  horasEnPunto={horasEnPunto}
                  reservasPropias={reservasPropiasPorCancha.get(cancha.canchaId) ?? []}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-6 text-sm text-grafito">
        <span className="flex items-center gap-2">
          <span className="size-4 rounded border border-ocupado bg-ocupado-suave" aria-hidden />
          No disponible
        </span>
        {mostrarLeyendaPropia && (
          <span className="flex items-center gap-2">
            <span className="size-4 rounded border border-disponible bg-disponible-suave" aria-hidden />
            Tu reserva
          </span>
        )}
      </div>
    </div>
  );
}

function FilaCanchaGrilla({
  cancha,
  slug,
  duracion,
  rango,
  abreMin,
  totalMin,
  horasEnPunto,
  reservasPropias,
}: {
  cancha: DisponibilidadCanchaResponse;
  slug: string;
  duracion: number;
  rango: RangoHorario;
  abreMin: number;
  totalMin: number;
  horasEnPunto: number[];
  reservasPropias: { desde: number; hasta: number }[];
}) {
  const opcion = cancha.opcionesDuracion.find((o) => o.duracionMinutos === duracion);
  const { ocupados, franjas } = agendaDeCancha(opcion?.slotsLibres ?? [], duracion, rango, reservasPropias);

  const posicion = (desde: number, hasta: number) => ({
    left: `${((desde - abreMin) / totalMin) * 100}%`,
    width: `${((hasta - desde) / totalMin) * 100}%`,
  });

  return (
    <div className="flex h-24">
      <div className="sticky left-0 z-10 w-48 shrink-0 border-r border-borde bg-white p-4">
        <p className="truncate font-display text-sm font-bold text-tinta">{cancha.canchaNombre}</p>
        <p className="mt-1 truncate text-[11px] leading-tight text-grafito">
          {cancha.deportes.map(etiquetaDeporte).join(" · ")}
        </p>
      </div>

      <div className="relative flex flex-1">
        {horasEnPunto.map((m) => (
          <div key={m} className="flex-1 border-r border-borde/30 last:border-r-0" />
        ))}

        {ocupados.map((tramo) => (
          <div
            key={tramo.desde}
            className={`absolute inset-y-2 rounded-lg border ${
              tramo.propia ? "border-disponible bg-disponible-suave" : "border-ocupado bg-ocupado-suave"
            }`}
            style={posicion(tramo.desde, tramo.hasta)}
          />
        ))}

        {franjas.map((franja) => (
          <Link
            key={franja.inicioISO}
            href={`/reservar/${slug}?cancha=${cancha.canchaId}&inicio=${franja.inicioISO}&fin=${franja.finISO}&deporte=${cancha.deportes[0]}`}
            aria-label={`Reservar ${cancha.canchaNombre} de ${horaDe(franja.inicioISO)} a ${horaDe(franja.finISO)}`}
            className="absolute inset-y-2 rounded-lg border border-transparent transition-colors hover:border-azul hover:bg-celeste-suave"
            style={posicion(franja.desde, franja.hasta)}
          />
        ))}
      </div>
    </div>
  );
}

function horaDe(iso: string): string {
  return iso.slice(11, 16);
}
