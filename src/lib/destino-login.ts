import type { Role } from "./api/tipos/comunes";

/**
 * Adónde va el usuario una vez que hay sesión (después de ingresar o de
 * verificar el mail). Orden de decisión:
 *
 * 1. `volverA`, si es una ruta interna (lo manda el checkout). Una URL
 *    absoluta o "//host" sería un open redirect y se ignora. /verificar no
 *    tiene `volverA`: no lo pasa.
 * 2. `destinoReserva`, si hay una reserva en curso (null si no).
 * 3. Según el rol: ADMIN a su área de administración, OWNER a su panel, el
 *    resto a la home.
 */
export function destinoTrasLogin({
  rol,
  volverA,
  destinoReserva,
}: {
  rol: Role;
  volverA?: string | null;
  destinoReserva?: string | null;
}): string {
  if (volverA?.startsWith("/") && !volverA.startsWith("//")) return volverA;
  if (destinoReserva) return destinoReserva;
  if (rol === "ADMIN") return "/admin/ofertas";
  if (rol === "OWNER") return "/panel/agenda";
  return "/";
}
