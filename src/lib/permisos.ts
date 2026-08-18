import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useRolPanel } from "@/lib/rol-panel";
import { useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
import type { PermisoEmpleado } from "@/lib/api/tipos/comunes";

/**
 * Permisos del empleado que está operando el panel.
 *
 * Ya no hay traducción: los permisos son los 7 valores de `PermisoEmpleado` del
 * backend, tal cual llegan en `PerfilResponse.permisos`. El conjunto viejo del
 * front (`ver_agenda`, `ver_clientes`, `ver_stock_buffet`, …) modelaba permisos
 * de PANTALLA y no tenía equivalente del otro lado; el puente que los traducía
 * (`lib/api/permisos-mapeo.ts`) se borró con él.
 *
 * El dueño tiene todos los permisos siempre, implícito — igual que hace el back
 * con OWNER/ADMIN, que ni siquiera consultan la lista.
 *
 * Este gate es SOLO de UX: evita mostrar pantallas que van a dar 403. La
 * barrera de verdad son los `@PreAuthorize` del backend más el chequeo de
 * permiso dentro de cada service.
 */
export function usePermisos(): (permiso: PermisoEmpleado) => boolean {
  const rol = useRolPanel();
  const { data: perfil } = usePerfil();

  return (permiso: PermisoEmpleado) => {
    if (rol === "dueno") return true;
    return perfil?.permisos.includes(permiso) ?? false;
  };
}

/**
 * true cuando este dispositivo está emparejado como caja (zona E) y no hay
 * ningún empleado logueado — ni "dueño" ni ningún empleado tienen acceso
 * legítimo en ese estado. El atajo de prueba ?rol=... siempre gana (así no
 * rompe los tests ya escritos contra esa convención): esto solo aplica cuando
 * el dispositivo decide todo por sí mismo, sin overrides de URL.
 */
export function useCajaSinEmpleado(): boolean {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  if (searchParams.get("rol")) return false;
  return emparejado && !empleadoIdSesion;
}

/**
 * Guard compartido para TODA pantalla de /panel/*: si este dispositivo es una
 * caja sin nadie logueado, no hay ninguna identidad legítima que mostrarle nada
 * — redirige a /caja (la puerta de entrada real) en vez de dejar que cada
 * pantalla resuelva su propio fallback de permiso vacío. Se suma a (no
 * reemplaza) el chequeo de rol/permiso específico de cada pantalla.
 */
export function useBloqueadoPorCaja(): boolean {
  const router = useRouter();
  const bloqueado = useCajaSinEmpleado();
  useEffect(() => {
    if (bloqueado) router.replace("/caja");
  }, [bloqueado, router]);
  return bloqueado;
}
