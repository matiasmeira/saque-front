"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

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

/**
 * Redirige a `destino` si no hay sesión. Pensado para un efecto que corre en
 * toda una pantalla/layout: en una carga dura (F5, URL directa, entrar por
 * link externo) useSyncExternalStore — y por lo tanto useHaySesion() — rinde
 * `false` en el primer commit post-hidratación (getServerSnapshot) y recién
 * se corrige en un render posterior. Si el efecto decidiera con ese `false`
 * transitorio, expulsaría una sesión real. Por eso vuelve a leer hayToken()
 * DENTRO del efecto (valor fresco) y usa haySesion solo como disparador —
 * no "simplificar" esto reemplazándolo por haySesion directo.
 *
 * `exceptuar`: cuando es true, este render no redirige aunque no haya sesión.
 * El caller decide el motivo (un pathname puntual, un estado local
 * transitorio, etc.) — el hook no sabe nada de esos casos.
 */
export function useRedirigirSiSinSesion(destino: string, exceptuar = false): void {
  const router = useRouter();
  const haySesion = useHaySesion();

  useEffect(() => {
    if (exceptuar) return;
    if (hayToken()) return;
    router.replace(destino);
  }, [haySesion, exceptuar, destino, router]);
}
