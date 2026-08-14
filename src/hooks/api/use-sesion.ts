"use client";

import { useSyncExternalStore } from "react";

import { hayToken, suscribirseToken } from "@/lib/api/sesion";

/**
 * Lectura reactiva de la sesión, separada de src/lib/api/sesion.ts.
 *
 * Ese módulo lo importa el cliente HTTP, que a su vez usan Server Components
 * (la zona pública se consume desde el servidor). Un import de React ahí
 * rompe el build: "You're importing a component that needs useSyncExternalStore".
 * Por eso el hook vive acá y el almacenamiento del token allá.
 *
 * `true` si hay token guardado. No valida que siga vigente — eso lo dice el
 * backend con un 401.
 */
export function useHaySesion(): boolean {
  return useSyncExternalStore(suscribirseToken, hayToken, () => false);
}
