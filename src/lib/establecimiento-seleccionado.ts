import { useSyncExternalStore } from "react";

/**
 * Qué establecimiento tiene activo el dueño en ESTE navegador.
 *
 * Es sólo una preferencia de UI: no autoriza nada. Cada request sigue
 * llevando el establecimientoId que corresponda y el backend lo valida en
 * vivo contra la Establecimiento puntual (dueño real, no lo que diga este
 * localStorage). Si el id guardado ya no está en la lista de `mios` (se
 * borró, o cambió de cuenta), `useEstablecimientoActivo` cae sola al primero
 * — por eso acá no hace falta un "clear" explícito en el logout.
 *
 * Mismo patrón que sesion-caja.ts (localStorage + evento propio para
 * reactividad same-tab, porque el evento nativo "storage" sólo avisa a
 * OTRAS pestañas), pero en un módulo aparte: esto es una preferencia de
 * sesión de panel, no del dispositivo físico que usa el kiosco de caja.
 */
const CLAVE_ESTABLECIMIENTO_SELECCIONADO = "saque_panel_establecimiento_seleccionado";
const EVENTO_CAMBIO = "saque_panel_establecimiento_cambio";

function notificarCambio() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function guardarEstablecimientoSeleccionado(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_ESTABLECIMIENTO_SELECCIONADO, String(id));
  notificarCambio();
}

function suscribirseAlmacenamiento(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_CAMBIO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_CAMBIO, callback);
  };
}

/** `null` si todavía no se eligió ninguno en este navegador. */
export function useEstablecimientoSeleccionado(): number | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => {
      const crudo = window.localStorage.getItem(CLAVE_ESTABLECIMIENTO_SELECCIONADO);
      return crudo === null ? null : Number(crudo);
    },
    () => null,
  );
}
