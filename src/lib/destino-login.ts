import type { Role } from "./api/tipos/comunes";

const ORIGEN_FICTICIO = "https://canche.local";

/**
 * Devuelve la ruta interna normalizada (pathname + search + hash) o null si
 * el valor no es una ruta interna segura. Next resuelve el destino con
 * `new URL(href, location.href)`, que normaliza "\" a "/" y descarta tabs y
 * saltos de línea, así que un `startsWith("/")` no alcanza: "/\evil.com"
 * termina siendo "//evil.com". Acá se resuelve igual contra un origen fijo y
 * sólo se acepta si el origen no cambia.
 */
export function rutaInternaSegura(valor: string | null | undefined): string | null {
  if (!valor || !valor.startsWith("/")) return null;
  try {
    const url = new URL(valor, ORIGEN_FICTICIO);
    if (url.origin !== ORIGEN_FICTICIO) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * Adónde va el usuario una vez que hay sesión (después de ingresar o de
 * verificar el mail). Orden de decisión:
 *
 * 1. `volverA`, si es una ruta interna (lo manda el checkout). Se valida con
 *    `rutaInternaSegura`: cualquier valor que resuelto contra un origen fijo
 *    cambie de origen (URL absoluta, "//host", "/\host", etc.) sería un open
 *    redirect y se ignora. /verificar no tiene `volverA`: no lo pasa.
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
  const rutaVolverA = rutaInternaSegura(volverA);
  if (rutaVolverA) return rutaVolverA;
  if (destinoReserva) return destinoReserva;
  if (rol === "ADMIN") return "/admin/ofertas";
  if (rol === "OWNER") return "/panel/agenda";
  return "/";
}
