/**
 * Historial de reservas del jugador logueado — A9 (/mis-reservas).
 * No duplica Complejo/Cancha: referencia sus ids y solo "congela"
 * (snapshot) lo que no debería cambiar si mañana el complejo edita
 * sus precios o su política en Precios/Configuración — igual que
 * pasaría con una reserva real ya pagada.
 *
 * Las fechas se generan relativas a hoy (hoyISO/sumarDias) en vez de
 * quedar fijas: así el mock nunca queda "vencido" con el paso del
 * tiempo real, y Próximas/Anteriores siempre tienen datos para
 * mostrar en cualquier momento que se abra la app.
 */
import { COMPLEJOS, type Cancha, type Complejo } from "@/mocks/complejos";
import { hoyISO, sumarDias } from "@/lib/fecha";

export type EstadoReserva = "confirmada" | "pendiente" | "cancelada" | "jugada";

export type ReservaJugador = {
  id: string;
  complejoId: string;
  canchaId: string;
  fecha: string;
  hora: string;
  duracionMin: number;
  montoTotal: number;
  senia: number;
  /** Horas de anticipación que exige el complejo para cancelar sin cargo — snapshot de su política al momento de reservar. */
  horasLimiteCancelacion: number;
  estado: EstadoReserva;
};

export const RESERVAS_JUGADOR: ReservaJugador[] = [
  {
    id: "res-1",
    complejoId: "arena-sport-club",
    canchaId: "cancha-1",
    fecha: sumarDias(hoyISO(), 2),
    hora: "20:30",
    duracionMin: 60,
    montoTotal: 24000,
    senia: 8000,
    horasLimiteCancelacion: 24,
    estado: "confirmada",
  },
  {
    id: "res-2",
    complejoId: "complejo-altamira",
    canchaId: "cancha-1",
    fecha: sumarDias(hoyISO(), 9),
    hora: "21:00",
    duracionMin: 60,
    montoTotal: 26000,
    senia: 10000,
    horasLimiteCancelacion: 12,
    estado: "pendiente",
  },
  {
    id: "res-3",
    complejoId: "el-trebol-futbol",
    canchaId: "cancha-2",
    fecha: sumarDias(hoyISO(), 16),
    hora: "21:30",
    duracionMin: 90,
    montoTotal: 16000,
    senia: 4500,
    horasLimiteCancelacion: 24,
    estado: "confirmada",
  },
  {
    id: "res-4",
    complejoId: "predio-las-heras",
    canchaId: "cancha-1",
    fecha: sumarDias(hoyISO(), -7),
    hora: "22:00",
    duracionMin: 60,
    montoTotal: 20000,
    senia: 5000,
    horasLimiteCancelacion: 24,
    estado: "jugada",
  },
  {
    id: "res-5",
    complejoId: "club-pinares",
    canchaId: "cancha-1",
    fecha: sumarDias(hoyISO(), -14),
    hora: "20:00",
    duracionMin: 60,
    montoTotal: 21000,
    senia: 6000,
    horasLimiteCancelacion: 24,
    estado: "jugada",
  },
  {
    id: "res-6",
    complejoId: "polideportivo-municipal",
    canchaId: "cancha-2",
    fecha: sumarDias(hoyISO(), -3),
    hora: "20:30",
    duracionMin: 60,
    montoTotal: 14000,
    senia: 0,
    horasLimiteCancelacion: 6,
    estado: "cancelada",
  },
];

export function complejoDeReserva(reserva: ReservaJugador): Complejo | undefined {
  return COMPLEJOS.find((c) => c.id === reserva.complejoId);
}

export function canchaDeReserva(reserva: ReservaJugador): Cancha | undefined {
  return complejoDeReserva(reserva)?.canchas.find((c) => c.id === reserva.canchaId);
}

/** Próximas = todavía accionables (con turno en pie o pago en curso). Anteriores = jugadas o canceladas, sin importar si su fecha original quedó en el futuro. */
export function esProxima(reserva: ReservaJugador): boolean {
  return reserva.estado === "confirmada" || reserva.estado === "pendiente";
}

function fechaHoraReserva(reserva: ReservaJugador): number {
  return new Date(`${reserva.fecha}T${reserva.hora}:00`).getTime();
}

export function puedeCancelarse(reserva: ReservaJugador): boolean {
  if (!esProxima(reserva)) return false;
  const limite = fechaHoraReserva(reserva) - reserva.horasLimiteCancelacion * 60 * 60 * 1000;
  return Date.now() < limite;
}

/**
 * Próxima fecha (desde hoy) que cae en el mismo día de la semana que
 * la reserva original, a la misma hora — "el mismo grupo juega el
 * mismo día a la misma hora todas las semanas". Sirve tanto para
 * repetir una reserva próxima como una anterior.
 */
export function proximaFechaRepetible(reserva: ReservaJugador): string {
  const diaSemana = new Date(`${reserva.fecha}T00:00:00`).getDay();
  let candidata = hoyISO();
  if (new Date(`${candidata}T${reserva.hora}:00`).getTime() <= Date.now()) {
    candidata = sumarDias(candidata, 1);
  }
  while (new Date(`${candidata}T00:00:00`).getDay() !== diaSemana) {
    candidata = sumarDias(candidata, 1);
  }
  return candidata;
}
