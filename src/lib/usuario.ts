/**
 * Mock de sesión de usuario. A diferencia de la intención de
 * reserva (sessionStorage, vive y muere con la pestaña), el usuario
 * tiene que persistir entre pestañas y visitas — localStorage.
 *
 * Sin esto no hay forma de distinguir, en A7, entre un visitante
 * que nunca se registró y uno que ya completó A4 — distinción que
 * ahora es central: solo un usuario logueado puede arrancar el
 * contador de 10 minutos.
 */
import { useSyncExternalStore } from "react";

const CLAVE = "saque:usuario";
const EVENTO_CAMBIO = "saque:usuario-cambio";

export type Usuario = {
  email: string;
  nombre: string;
  telefono: string;
};

export function leerUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const crudo = localStorage.getItem(CLAVE);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as Usuario;
  } catch {
    return null;
  }
}

function notificarCambio() {
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

/** localStorage no dispara "storage" en la propia pestaña — igual que sessionStorage con la intención. */
export function suscribirseUsuario(callback: () => void) {
  window.addEventListener(EVENTO_CAMBIO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, callback);
    window.removeEventListener("storage", callback);
  };
}

export function guardarUsuario(usuario: Usuario): Usuario {
  localStorage.setItem(CLAVE, JSON.stringify(usuario));
  notificarCambio();
  return usuario;
}

/** Cerrar sesión y eliminar cuenta usan lo mismo acá: sin backend real, "eliminar cuenta" es borrar la sesión local. */
export function borrarUsuario() {
  localStorage.removeItem(CLAVE);
  notificarCambio();
}

// Mismo fix que reserva-intencion.ts: useSyncExternalStore exige la
// MISMA referencia si el dato no cambió, y JSON.parse arma un
// objeto nuevo cada vez — hay que cachear por el string crudo, si
// no entra en loop infinito ("the result of getSnapshot should be
// cached").
let crudoCacheado: string | null = null;
let valorCacheado: Usuario | null = null;

function obtenerSnapshot(): Usuario | null {
  const crudo = typeof window === "undefined" ? null : localStorage.getItem(CLAVE);
  if (crudo === crudoCacheado) return valorCacheado;
  crudoCacheado = crudo;
  try {
    valorCacheado = crudo ? (JSON.parse(crudo) as Usuario) : null;
  } catch {
    valorCacheado = null;
  }
  return valorCacheado;
}

/** Lee el usuario y se mantiene sincronizado con sus cambios (incluso entre pestañas). */
export function useUsuario(): Usuario | null {
  return useSyncExternalStore(suscribirseUsuario, obtenerSnapshot, () => null);
}
