"use client";

import { usePathname } from "next/navigation";
import { useRedirigirSiSinSesion } from "@/hooks/api/use-sesion";
import { destinoSinSesion, useEmpleadoIdSesion } from "@/lib/sesion-caja";

/**
 * Si el JWT se cae mientras el dueño/empleado sigue navegando /panel/* (un
 * 401 en cualquier fetch, o el token expira solo con el tiempo), apiFetch
 * limpia el token con borrarToken() pero nadie sacaba al usuario de la
 * pantalla: se quedaba viendo el panel sin datos y sin botón de logout (ese
 * botón necesita el perfil, que ya no carga sin sesión) — había que volver a
 * mano por la URL. Este guard corre en TODO /panel/* y manda al lugar
 * correcto: ver destinoSinSesion (mismo destino que usa cerrarSesionDueno en
 * el sidebar para el logout manual).
 *
 * /panel/perfil no pasa por acá: administra su propio caso especial de
 * "cuenta eliminada" (borra el token pero necesita mostrar un cartel antes
 * de navegar, no un replace inmediato a /ingresar).
 */
export function GuardSesionPanel() {
  const pathname = usePathname();
  const empleadoIdSesion = useEmpleadoIdSesion();

  useRedirigirSiSinSesion(destinoSinSesion(empleadoIdSesion), pathname === "/panel/perfil");

  return null;
}
