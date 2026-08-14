import { useSearchParams } from "next/navigation";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";

export type RolPanel = "dueno" | "empleado";

/**
 * Rol con el que opera el panel.
 *
 * La fuente de verdad es GET /api/v1/usuarios/me: el JWT NO lleva el rol (solo
 * sub, iat, exp, tokenVersion y, para empleados, empleadoId). OWNER y ADMIN
 * son "dueno"; EMPLOYEE es "empleado".
 *
 * PUENTE TEMPORAL (se elimina en la Fase 2, cuando /ingresar sea login real):
 * mientras el panel siga consumiendo mocks, sin sesion se mantiene la
 * resolucion vieja — ?rol= en la URL, sesion de caja, dispositivo emparejado —
 * para no dejar el panel inaccesible a mitad de la migracion. Pero ese fallback
 * SOLO corre en desarrollo: en produccion, sin sesion no hay dueño implicito,
 * se degrada a "empleado" (que sin identidad no tiene ningun permiso).
 *
 * El caso "emparejado sin nadie logueado" sigue siendo "empleado" y nunca
 * "dueño": activar un dispositivo como caja es justamente lo que cierra el
 * acceso implicito de dueño en esa PC.
 */
export function useRolPanel(): RolPanel {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  const { data: perfil } = usePerfil();

  if (perfil) {
    return perfil.rol === "OWNER" || perfil.rol === "ADMIN" ? "dueno" : "empleado";
  }

  if (process.env.NODE_ENV !== "development") return "empleado";

  const rolParam = searchParams.get("rol");
  if (rolParam === "empleado") return "empleado";
  if (rolParam === "dueno") return "dueno";
  if (empleadoIdSesion) return "empleado";
  if (emparejado) return "empleado";
  return "dueno";
}
