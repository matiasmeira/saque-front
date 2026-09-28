import { usePerfil } from "@/hooks/api/use-perfil";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

export type RolPanel = "dueno" | "empleado";

/**
 * Mapeo puro perfil → rol. OWNER y ADMIN son "dueno"; EMPLOYEE es "empleado".
 * Sin perfil (cargando, error, o sin sesión) es "empleado": el rol con menos
 * permisos, el default seguro cuando todavía no se sabe quién es.
 */
export function rolDesdePerfil(perfil: PerfilResponse | undefined): RolPanel {
  if (!perfil) return "empleado";
  return perfil.rol === "OWNER" || perfil.rol === "ADMIN" ? "dueno" : "empleado";
}

/**
 * Rol con el que opera el panel.
 *
 * La fuente de verdad es GET /api/v1/usuarios/me: el JWT NO lleva el rol (solo
 * sub, iat, exp, tokenVersion y, para empleados, empleadoId).
 *
 * Sin perfil todavía (mientras /me está en vuelo, si la query falló, o si no
 * hay sesión) el rol es "empleado" en todos los entornos — no hay dueño
 * implícito. Los consumidores que necesitan distinguir "todavía no se sabe"
 * de "es empleado de verdad" usan usePerfilPendiente() (src/lib/permisos.ts)
 * para no redirigir ni bloquear mientras el perfil está cargando.
 */
export function useRolPanel(): RolPanel {
  const { data: perfil } = usePerfil();
  return rolDesdePerfil(perfil);
}
