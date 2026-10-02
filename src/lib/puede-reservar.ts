import type { Role } from "@/lib/api/tipos/comunes";

export const AVISO_RESERVA_SOLO_JUGADOR =
  "Las reservas son para cuentas de jugador. Para reservar, ingresá con una cuenta de jugador.";

/**
 * Si la ficha pública ofrece reservar. Sólo una cuenta de dueño queda afuera
 * (el back responde 403 a OWNER en POST /reservas). Sin perfil (anónimo o
 * todavía cargando) se ofrece, como hasta ahora: no hay que mostrar un aviso
 * falso mientras el perfil carga.
 */
export function puedeReservarComoJugador(rol: Role | undefined): boolean {
  return rol !== "OWNER";
}
