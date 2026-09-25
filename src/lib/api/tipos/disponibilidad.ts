import type { Deporte, FechaHoraISO, FechaISO } from "./comunes";

/**
 * Grilla de disponibilidad. El backend ya la devuelve cruzada contra horarios
 * de atención, días no laborables, bloqueos y reservas existentes, y excluye
 * los slots que ya pasaron. Rango máximo: 31 días.
 *
 * Esto reemplaza por completo la matemática de src/lib/disponibilidad.ts.
 */

/**
 * Cada slot trae `inicio` y `fin`, que son exactamente los dos campos que pide
 * ReservaRequest. Hay que pasarlos tal cual al checkout: recalcular el fin a
 * partir de una duración es la forma de terminar con un 400 por duración no
 * permitida o por inicio fuera de :00/:30.
 */
export type SlotDisponibleResponse = {
  inicio: FechaHoraISO;
  fin: FechaHoraISO;
};

export type DisponibilidadDuracionResponse = {
  duracionMinutos: number;
  slotsLibres: SlotDisponibleResponse[];
};

/**
 * Rango en el que esta cancha NO es reservable porque otra cancha del mismo
 * grupo ya consumió ese horario del pool compartido. Ya excluye los rangos
 * cubiertos por una reserva propia de esta cancha.
 */
export type RangoOcupadoPoolResponse = {
  inicio: FechaHoraISO;
  fin: FechaHoraISO;
};

export type DisponibilidadCanchaResponse = {
  canchaId: number;
  canchaNombre: string;
  deportes: Deporte[];
  opcionesDuracion: DisponibilidadDuracionResponse[];
  /**
   * Sólo viene poblado si el usuario tiene acceso de panel a este
   * establecimiento; en cualquier otro caso llega `null`. Tratar `null` y
   * lista vacía igual: no hay nada que pintar como sin-disponibilidad-pool.
   */
  ocupadaPorPool: RangoOcupadoPoolResponse[] | null;
};

/** Si `abierto` es false, `canchas` viene vacío y `motivoCierre` explica por qué. */
export type DisponibilidadDiaResponse = {
  fecha: FechaISO;
  abierto: boolean;
  motivoCierre: string | null;
  canchas: DisponibilidadCanchaResponse[];
};

export type DisponibilidadEstablecimientoResponse = {
  establecimientoId: number;
  fechaInicio: FechaISO;
  fechaFin: FechaISO;
  dias: DisponibilidadDiaResponse[];
};
