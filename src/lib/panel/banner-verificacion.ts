import type { EstadoVerificacionEstablecimiento, Role } from "@/lib/api/tipos/comunes";

/**
 * Si el panel muestra el banner de "verificación pendiente". Es la única
 * fuente de la regla: la usan el banner (para renderizarse) y el header (para
 * no repetir la píldora "Sin verificar" en celular cuando el banner ya dice
 * lo mismo). Sólo OWNER: solicitar la verificación es OWNER puro en el backend.
 */
export function hayBannerVerificacion(
  rol: Role | undefined,
  estado: EstadoVerificacionEstablecimiento | undefined,
): boolean {
  return rol === "OWNER" && estado === "PENDIENTE";
}
