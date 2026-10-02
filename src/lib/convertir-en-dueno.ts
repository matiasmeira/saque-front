import { RUTA_WIZARD } from "@/lib/panel/nuevo-complejo";
import type { Role } from "@/lib/api/tipos/comunes";

/** A dónde se va tras convertir la cuenta: el wizard del primer complejo (sin `nuevo`). */
export const DESTINO_TRAS_CONVERTIR = RUTA_WIZARD;

/** Sólo un jugador puede convertir su cuenta (el back da 403 a ADMIN/EMPLOYEE y es no-op para OWNER). */
export function puedeConvertirseEnDueno(rol: Role | undefined): boolean {
  return rol === "PLAYER";
}

export type AccionCtaClub = "registro" | "convertir" | "panel" | "admin";

/**
 * Qué ofrece el botón de la landing de clubes según quién mira. Sin perfil
 * (sin sesión o todavía cargando) y EMPLOYEE ven lo mismo que un anónimo.
 */
export function accionCtaClub(rol: Role | undefined): AccionCtaClub {
  switch (rol) {
    case "PLAYER":
      return "convertir";
    case "OWNER":
      return "panel";
    case "ADMIN":
      return "admin";
    default:
      return "registro";
  }
}
