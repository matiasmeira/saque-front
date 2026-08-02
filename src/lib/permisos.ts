import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRolPanel } from "@/lib/rol-panel";
import { useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
import { PANEL_EMPLEADOS, type Empleado, type Permiso } from "@/mocks/empleados";

// TODO backend: sesión real vía cookie/JWT. "Quién sos" se resuelve acá
// con la MISMA prioridad que useRolPanel(), pero sin heredar su
// fallback de conveniencia: el atajo de prueba ?rol=empleado (sin
// empleadoId) elige el primer empleado activo del mock para no tener
// que escribir un id cada vez que se prueba algo — eso está BIEN para
// testing, pero sería un agujero de seguridad si se aplicara también
// cuando el rol "empleado" sale de una caja emparejada sin nadie
// logueado: ahí no hay que inventarle una identidad a nadie, tiene que
// quedar en null (cero permisos).
export function useEmpleadoActual(): Empleado | null {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();

  const rolParam = searchParams.get("rol");
  if (rolParam === "dueno") return null;
  if (rolParam === "empleado") {
    const idParam = searchParams.get("empleadoId");
    const porId = idParam ? PANEL_EMPLEADOS.find((e) => e.id === idParam && e.estado === "activo") : undefined;
    return porId ?? PANEL_EMPLEADOS.find((e) => e.estado === "activo") ?? null;
  }
  if (empleadoIdSesion) {
    return PANEL_EMPLEADOS.find((e) => e.id === empleadoIdSesion && e.estado === "activo") ?? null;
  }
  // Emparejada como caja y nadie tocó su nombre todavía (o lo revocaron
  // a mitad de uso): sin identidad, nunca "el primero que haya".
  if (emparejado) return null;
  return null;
}

/**
 * El dueño tiene todos los permisos siempre, implícito — nunca se le
 * chequea la lista. Un empleado solo tiene los que el dueño le tildó
 * en su ficha (C10); si no hay sesión de empleado resuelta (rol
 * "empleado" sin identidad real detrás — ver useEmpleadoActual), no
 * tiene ninguno. Devuelve la función de chequeo en vez de un objeto,
 * para poder escribir `tienePermiso("cobrar_turnos")` en el punto de uso.
 */
export function usePermisos(): (permiso: Permiso) => boolean {
  const rol = useRolPanel();
  const empleadoActual = useEmpleadoActual();
  return (permiso: Permiso) => rol === "dueno" || (empleadoActual?.permisos.includes(permiso) ?? false);
}

/**
 * true cuando este dispositivo está emparejado como caja (zona E) y
 * no hay ningún empleado logueado — ni "dueño" ni ningún empleado
 * tienen acceso legítimo en ese estado. El atajo de prueba ?rol=...
 * siempre gana (así no rompe los tests ya escritos contra esa
 * convención): esto solo aplica cuando el dispositivo decide todo
 * por sí mismo, sin overrides de URL.
 */
export function useCajaSinEmpleado(): boolean {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  if (searchParams.get("rol")) return false;
  return emparejado && !empleadoIdSesion;
}

/**
 * Guard compartido para TODA pantalla de /panel/*: si este
 * dispositivo es una caja sin nadie logueado, no hay ninguna
 * identidad legítima que mostrarle nada — redirige a /caja (la
 * puerta de entrada real) en vez de dejar que cada pantalla resuelva
 * su propio fallback de permiso vacío. Se suma a (no reemplaza) el
 * chequeo de rol/permiso específico de cada pantalla.
 */
export function useBloqueadoPorCaja(): boolean {
  const router = useRouter();
  const bloqueado = useCajaSinEmpleado();
  useEffect(() => {
    if (bloqueado) router.replace("/caja");
  }, [bloqueado, router]);
  return bloqueado;
}
