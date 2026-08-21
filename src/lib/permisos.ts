import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
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
 * true cuando este dispositivo está emparejado como caja (zona E), no hay
 * ningún empleado logueado por PIN, y tampoco hay un dueño autenticado. Un
 * dispositivo emparejado es "kiosco por defecto", no "kiosco para siempre": la
 * sesión de dueño manda por encima del emparejamiento, así que un OWNER/ADMIN
 * real nunca cae acá. El atajo de prueba ?rol=... siempre gana (así no rompe
 * los tests ya escritos contra esa convención): esto solo aplica cuando el
 * dispositivo decide todo por sí mismo, sin overrides de URL.
 */
export function useCajaSinEmpleado(): boolean {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  const perfilPendiente = usePerfilPendiente();
  const { data: perfil } = usePerfil();
  if (searchParams.get("rol")) return false;
  // Hay JWT guardado pero GET /me todavía no resolvió: no se sabe todavía si
  // es un dueño real. Esperar en vez de expulsarlo por una carrera (mismo
  // patrón que admin/ofertas/page.tsx).
  if (perfilPendiente) return false;
  const duenoLogueado = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";
  return emparejado && !empleadoIdSesion && !duenoLogueado;
}

/**
 * true si hay una sesión guardada (JWT en localStorage) pero GET /me todavía
 * no resolvió. Mientras está en vuelo, useRolPanel() cae a "empleado" y
 * usePermisos() a "sin permisos" — son valores por defecto, no un dato real.
 * Cualquier efecto que redirija por rol o por permiso tiene que esperar esto
 * antes de disparar: si no, un dueño real (o un empleado con el permiso real)
 * puede terminar expulsado de la pantalla que pidió por ese default
 * transitorio en cada F5 o entrada directa por URL — y esa navegación no se
 * deshace sola cuando el perfil de verdad llega.
 */
export function usePerfilPendiente(): boolean {
  const haySesion = useHaySesion();
  const { isPending } = usePerfil();
  return haySesion && isPending;
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
