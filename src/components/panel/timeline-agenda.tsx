"use client";

import { CheckCircle2, Clock, Repeat, UserX, Wrench, XCircle } from "lucide-react";
import { aHHMM, aMinutos } from "@/lib/disponibilidad";
import type { BloqueoDelDia, EstadoTurno, Turno } from "@/lib/panel/agenda";

/**
 * La grilla de C2: canchas u días en columnas (según la vista), horas
 * en filas. Igual lenguaje visual que GrillaDisponibilidad (A3), pero
 * acá cada bloque es una reserva real con cliente y estado, editable.
 *
 * Densidad de escritorio: filas de 30 minutos, compactas (Parte 9,
 * C2 pide "sin scroll horizontal a 1440px" — la altura no tiene esa
 * restricción, así que la página scrollea vertical sin problema).
 */
const ROW_MIN = 30;
const ROW_H = 32;

/** Turno + el id de la serie, sólo para dibujar el badge de turno fijo. */
type TurnoConSerie = Turno & { turnoFijoId: number | null };

export type ColumnaTimeline = {
  /** id de cancha en vista Día, fecha ISO en vista Semana */
  id: string | number;
  titulo: string;
  subtitulo?: string;
  turnos: TurnoConSerie[];
  /** bloqueos de mantenimiento de ese día — no son turnos de cliente */
  bloqueos?: BloqueoDelDia[];
};

/**
 * Las coordenadas de la grilla dependen del horario de atención real del
 * complejo, así que se calculan por render y no son constantes del módulo como
 * cuando salían de un `PANEL_HORARIO` fijo del mock.
 */
type Grilla = {
  abreMin: number;
  totalFilas: number;
  horasEnPunto: number[];
  fila: (min: number) => number;
  /** Un turno que termina a medianoche cierra en 1440, no en 0. */
  filaFin: (inicioMin: number, finMin: number) => number;
};

function armarGrilla(abre: string, cierra: string): Grilla {
  const abreMin = aMinutos(abre);
  const cierraMin = Math.max(aMinutos(cierra), abreMin + 60);
  const fila = (min: number) => (min - abreMin) / ROW_MIN;
  return {
    abreMin,
    totalFilas: Math.round((cierraMin - abreMin) / ROW_MIN),
    horasEnPunto: Array.from({ length: Math.ceil((cierraMin - abreMin) / 60) }, (_, i) => abreMin + i * 60),
    fila,
    filaFin: (inicioMin, finMin) => fila(finMin <= inicioMin ? finMin + 1440 : finMin),
  };
}

const ICONO_ESTADO: Record<EstadoTurno, typeof CheckCircle2> = {
  ocupado: CheckCircle2,
  pendiente: Clock,
  cancelado: XCircle,
  ausente: UserX,
};

const CLASE_BLOQUE: Record<EstadoTurno, string> = {
  ocupado: "border-ocupado bg-ocupado-suave text-tinta",
  pendiente: "border-pendiente bg-pendiente-suave text-tinta",
  cancelado: "border-cancelado bg-cancelado-suave text-cancelado",
  ausente: "border-ausente bg-ausente-suave text-ausente",
};

export function TimelineAgenda({
  columnas,
  horaActual,
  mostrarLineaAhora,
  abre,
  cierra,
  onClickLibre,
  onClickTurno,
}: {
  columnas: ColumnaTimeline[];
  horaActual: Date;
  mostrarLineaAhora: boolean;
  /** Extremos de la grilla, "HH:mm". `cierra` puede pasar de 24 (ver rangoDeAgenda). */
  abre: string;
  cierra: string;
  onClickLibre: (columnaId: string | number, hora: string) => void;
  onClickTurno: (turno: Turno) => void;
}) {
  const grilla = armarGrilla(abre, cierra);
  const minutosAhora = horaActual.getHours() * 60 + horaActual.getMinutes();
  const finMin = grilla.abreMin + grilla.totalFilas * ROW_MIN;
  const dentroDeHorario = minutosAhora >= grilla.abreMin && minutosAhora <= finMin;
  const lineaTop = grilla.fila(minutosAhora) * ROW_H;

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="flex border-b border-borde bg-humo">
        <div className="w-16 shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))` }}>
          {columnas.map((col) => (
            <div key={col.id} className="min-w-0 border-l border-borde px-2 py-2.5 text-center">
              <p className="truncate font-display text-xs font-bold text-tinta">{col.titulo}</p>
              {col.subtitulo && <p className="truncate text-[10px] text-grafito">{col.subtitulo}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex">
        <div className="w-16 shrink-0" style={{ height: grilla.totalFilas * ROW_H }}>
          {grilla.horasEnPunto.map((m) => (
            <div key={m} className="relative" style={{ height: ROW_H * 2 }}>
              <span className="absolute -top-2 right-2 text-[10px] text-grafito">
                {String(Math.floor(m / 60) % 24).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))` }}>
          {columnas.map((col) => (
            <ColumnaAgenda
              key={col.id}
              columna={col}
              grilla={grilla}
              onClickLibre={(hora) => onClickLibre(col.id, hora)}
              onClickTurno={onClickTurno}
            />
          ))}
        </div>

        {mostrarLineaAhora && dentroDeHorario && (
          <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: lineaTop }}>
            <div className="absolute -left-1 -top-[5px] size-3 rounded-full bg-celeste" aria-hidden />
            <div className="h-0.5 bg-celeste" aria-hidden />
            <span className="sr-only">Hora actual</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ColumnaAgenda({
  columna,
  grilla,
  onClickLibre,
  onClickTurno,
}: {
  columna: ColumnaTimeline;
  grilla: Grilla;
  onClickLibre: (hora: string) => void;
  onClickTurno: (turno: Turno) => void;
}) {
  const tramo = (desde: string, hasta: string) => {
    const inicioMin = aMinutos(desde);
    return { inicio: grilla.fila(inicioMin), fin: grilla.filaFin(inicioMin, aMinutos(hasta)) };
  };

  const cubiertas = new Set<number>();
  for (const turno of columna.turnos) {
    const { inicio, fin } = tramo(turno.horaInicio, turno.horaFin);
    for (let f = inicio; f < fin; f++) cubiertas.add(f);
  }
  for (const bloqueo of columna.bloqueos ?? []) {
    const { inicio, fin } = tramo(bloqueo.horaInicio, bloqueo.horaFin);
    for (let f = inicio; f < fin; f++) cubiertas.add(f);
  }

  const filasLibres = Array.from({ length: grilla.totalFilas }, (_, f) => f).filter((f) => !cubiertas.has(f));

  return (
    <div className="relative min-w-0 border-l border-borde" style={{ height: grilla.totalFilas * ROW_H }}>
      {filasLibres.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onClickLibre(aHHMM(grilla.abreMin + f * ROW_MIN))}
          aria-label={`Cargar turno a las ${aHHMM(grilla.abreMin + f * ROW_MIN)}`}
          className={`absolute inset-x-0 bg-disponible-suave transition-colors hover:bg-disponible/25 ${
            f % 2 === 0 ? "border-t border-borde" : ""
          }`}
          style={{ top: f * ROW_H, height: ROW_H }}
        />
      ))}

      {columna.turnos.map((turno) => {
        const { inicio, fin } = tramo(turno.horaInicio, turno.horaFin);
        const Icono = ICONO_ESTADO[turno.estado];
        return (
          <button
            key={turno.id}
            type="button"
            onClick={() => onClickTurno(turno)}
            aria-label={`${turno.cliente.nombre}, ${turno.horaInicio} a ${turno.horaFin}, ${turno.estado}${
              turno.turnoFijoId !== null ? ", turno fijo" : ""
            }`}
            className={`absolute inset-x-0.5 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left transition-opacity hover:opacity-80 ${CLASE_BLOQUE[turno.estado]}`}
            style={{ top: inicio * ROW_H + 1, height: (fin - inicio) * ROW_H - 2 }}
          >
            <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
              <Icono className="size-3 shrink-0" aria-hidden />
              {/* El "turno fijo" ya está en el aria-label del <button>: el nombre accesible
                  del botón gana sobre el de un ícono anidado, así que uno acá adentro nunca
                  se anuncia. El ícono queda puramente decorativo. */}
              {turno.turnoFijoId !== null && <Repeat className="size-3 shrink-0" aria-hidden />}
              <span className={`truncate ${turno.estado === "cancelado" ? "line-through" : ""}`}>{turno.cliente.nombre}</span>
            </span>
            <span className="block truncate text-[10px] leading-tight text-grafito">
              {turno.horaInicio}–{turno.horaFin}
            </span>
          </button>
        );
      })}

      {(columna.bloqueos ?? []).map((bloqueo, indice) => {
        const { inicio, fin } = tramo(bloqueo.horaInicio, bloqueo.horaFin);
        return (
          <div
            key={indice}
            title={bloqueo.motivo ?? "Mantenimiento programado"}
            className="absolute inset-x-0.5 overflow-hidden rounded-md border-l-4 border-grafito bg-[repeating-linear-gradient(45deg,var(--color-ocupado-suave),var(--color-ocupado-suave)_6px,var(--color-borde)_6px,var(--color-borde)_12px)] px-1.5 py-1 text-left text-grafito"
            style={{ top: inicio * ROW_H + 1, height: (fin - inicio) * ROW_H - 2 }}
          >
            <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
              <Wrench className="size-3 shrink-0" aria-hidden />
              Mantenimiento
            </span>
            <span className="block truncate text-[10px] leading-tight">{bloqueo.motivo ?? `${bloqueo.horaInicio}–${bloqueo.horaFin}`}</span>
          </div>
        );
      })}
    </div>
  );
}
