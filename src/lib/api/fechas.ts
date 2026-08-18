import type { DiaSemana } from "@/lib/panel/tarifas";

/**
 * Conversion entre el modelo de fecha de la UI (fecha y hora separadas, como
 * las manejan los formularios y src/lib/fecha.ts) y los tipos temporales del
 * backend, que son LocalDate / LocalTime / LocalDateTime SIN zona horaria.
 *
 * REGLA DURA: nunca usar Date.prototype.toISOString() para enviar al back.
 * Agrega la Z y convierte a UTC; el back parsea LocalDateTime y rechaza el
 * offset. Toda conversion de salida pasa por este modulo.
 */

/** `"2026-08-13"` — LocalDate. */
export type FechaISO = string;
/** `"2026-08-13T20:00:00"` — LocalDateTime, sin zona ni offset. */
export type FechaHoraISO = string;
/** `"20:00:00"` — LocalTime. */
export type HoraISO = string;

export type DiaSemanaBack =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DIA_SEMANA_A_BACK: Record<DiaSemana, DiaSemanaBack> = {
  lun: "MONDAY",
  mar: "TUESDAY",
  mie: "WEDNESDAY",
  jue: "THURSDAY",
  vie: "FRIDAY",
  sab: "SATURDAY",
  dom: "SUNDAY",
};

export const DIA_SEMANA_DESDE_BACK: Record<DiaSemanaBack, DiaSemana> = {
  MONDAY: "lun",
  TUESDAY: "mar",
  WEDNESDAY: "mie",
  THURSDAY: "jue",
  FRIDAY: "vie",
  SATURDAY: "sab",
  SUNDAY: "dom",
};

/**
 * Día de la semana del backend a partir de una fecha ISO.
 *
 * Con `T00:00:00` explícito: `new Date("2026-08-13")` se parsea como UTC y en
 * Argentina (UTC-3) cae en el día anterior.
 */
const DIAS_BACK_POR_INDICE: DiaSemanaBack[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function diaSemanaBackDeFecha(fechaISO: FechaISO): DiaSemanaBack {
  return DIAS_BACK_POR_INDICE[new Date(`${fechaISO}T00:00:00`).getDay()];
}

/** `"20:00"` o `"20:00:00"` → `"20:00:00"`. */
export function aHoraBack(hora: string): HoraISO {
  return hora.length === 5 ? `${hora}:00` : hora;
}

/** `("2026-08-13", "20:00")` → `"2026-08-13T20:00:00"`. */
export function aFechaHora(fecha: FechaISO, hora: string): FechaHoraISO {
  return `${fecha}T${aHoraBack(hora)}`;
}

/** `"2026-08-13T20:30:00"` → `{ fecha: "2026-08-13", hora: "20:30" }`. */
export function partirFechaHora(fechaHora: FechaHoraISO): {
  fecha: FechaISO;
  hora: string;
} {
  return { fecha: fechaHora.slice(0, 10), hora: fechaHora.slice(11, 16) };
}
