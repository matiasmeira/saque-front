/**
 * Token JWT de la sesion. Mismo patron que src/lib/usuario.ts (localStorage +
 * evento propio + useSyncExternalStore con snapshot cacheado), para no
 * introducir un mecanismo de estado distinto al que ya usa el proyecto.
 *
 * El token es lo UNICO que se persiste. El perfil del usuario (rol, permisos,
 * establecimientoId) vive en el cache de TanStack Query bajo la key ["perfil"]
 * y se repide con GET /api/v1/usuarios/me, que es la fuente de verdad.
 *
 * No hay refresh: el backend no expone endpoint de refresh, y ademas invalida
 * todos los JWT del usuario al incrementar tokenVersion (logout, cambio de
 * password). Un 401 significa sesion muerta, no sesion renovable.
 */
import { useSyncExternalStore } from "react";

const CLAVE_TOKEN = "saque:token";
const EVENTO_CAMBIO = "saque:token-cambio";

export function leerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLAVE_TOKEN);
}

function notificarCambio() {
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function guardarToken(token: string): string {
  localStorage.setItem(CLAVE_TOKEN, token);
  notificarCambio();
  return token;
}

export function borrarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
  notificarCambio();
}

export function suscribirseToken(callback: () => void) {
  window.addEventListener(EVENTO_CAMBIO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, callback);
    window.removeEventListener("storage", callback);
  };
}

function obtenerSnapshot(): string | null {
  return leerToken();
}

/** `true` si hay token guardado. No valida que siga vigente: eso lo dice el back. */
export function useHaySesion(): boolean {
  return useSyncExternalStore(
    suscribirseToken,
    () => obtenerSnapshot() !== null,
    () => false,
  );
}
