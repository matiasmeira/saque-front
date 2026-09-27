import type { EstadoReserva } from "@/lib/api/tipos/comunes";

export type RamaPrereserva = "confirmada" | "pendiente" | "vencida" | "otra";

/**
 * Qué bloque mostrar en la pantalla posterior a crear la reserva (checkout),
 * según el estado que trajo el POST y si el countdown LOCAL de 10 minutos
 * (CountdownBadge) ya se cumplió en este cliente.
 *
 * `vencida` manda sobre el estado: el backend recién pasa la reserva a
 * CANCELADA_PRERESERVA cuando corre el job periódico de expiración, así que
 * el reloj de este cliente puede llegar a cero antes de que el estado remoto
 * cambie. Sin este chequeo la pantalla seguiría mostrando "Falta confirmar"
 * con el countdown en negativo.
 */
export function ramaPrereserva(estado: EstadoReserva, vencida: boolean): RamaPrereserva {
  if (vencida || estado === "CANCELADA_PRERESERVA") return "vencida";
  if (estado === "CONFIRMADA") return "confirmada";
  if (estado === "PENDIENTE_SENA") return "pendiente";
  return "otra";
}
