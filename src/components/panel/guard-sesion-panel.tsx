"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hayToken } from "@/lib/api/sesion";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { useEmparejado } from "@/lib/sesion-caja";

/**
 * Si el JWT se cae mientras el dueño/empleado sigue navegando /panel/* (un
 * 401 en cualquier fetch, o el token expira solo con el tiempo), apiFetch
 * limpia el token con borrarToken() pero nadie sacaba al usuario de la
 * pantalla: se quedaba viendo el panel sin datos y sin botón de logout (ese
 * botón necesita el perfil, que ya no carga sin sesión) — había que volver a
 * mano por la URL. Este guard corre en TODO /panel/* y manda al lugar
 * correcto: /caja si este dispositivo está emparejado como caja (mismo
 * destino que usa salirDeLaCaja en el sidebar), /ingresar si no.
 *
 * Lee hayToken() adentro del efecto en vez de confiar en haySesion (que sólo
 * dispara el efecto): useSyncExternalStore rinde false en el primer commit
 * post-hidratación, y confiar en ese false transitorio redirigiría a una
 * sesión real. Mismo patrón que /panel/perfil.
 *
 * /panel/perfil no pasa por acá: administra su propio caso especial de
 * "cuenta eliminada" (borra el token pero necesita mostrar un cartel antes
 * de navegar, no un replace inmediato a /ingresar).
 */
export function GuardSesionPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const haySesion = useHaySesion();
  const emparejado = useEmparejado();

  useEffect(() => {
    if (pathname === "/panel/perfil") return;
    if (hayToken()) return;
    router.replace(emparejado ? "/caja" : "/ingresar");
  }, [haySesion, pathname, emparejado, router]);

  return null;
}
