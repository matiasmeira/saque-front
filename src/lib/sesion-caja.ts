import { useSyncExternalStore } from "react";

/**
 * Lo que el kiosco de caja (zona E) necesita recordar en ESTA PC.
 *
 * Es poco a propósito, porque el emparejamiento de verdad no vive acá: es la
 * cookie `saque_caja_device`, que el backend setea al consumir el código
 * (`POST /api/v1/caja/emparejar`) y que es HttpOnly — el JS no puede leerla ni
 * falsificarla. La revocación también es del backend
 * (`DELETE .../caja/dispositivos/{id}`), y se nota porque el listado de
 * empleados del mostrador pasa a responder 403.
 *
 * Acá sólo quedan dos cosas, y ninguna autoriza nada:
 *
 * - `establecimientoId` + nombre del local, en localStorage: sobreviven a
 *   cerrar el navegador, como una PC de mostrador real. Sirven para saber a
 *   quién pedirle la lista de nombres sin volver a preguntar.
 * - Qué empleado tocó su nombre en esta pestaña, en sessionStorage: se cierra
 *   sola al cerrarla, y "Salir / cambiar de empleado" la limpia a mano. Es una
 *   marca de UI; quien autoriza es el JWT de 15 minutos que devuelve
 *   `POST /auth/empleados/login` tras validar el PIN en el servidor.
 *
 * Se fueron con el backend real: los tokens de emparejamiento simulados con
 * vencimiento, el renombre del dispositivo, la revocación local y el rate
 * limit de PIN.
 */
const CLAVE_EMPAREJADO = "saque_caja_emparejado";
const CLAVE_NOMBRE_LOCAL = "saque_caja_nombre_local";
const CLAVE_EMPLEADO = "saque_caja_empleado";
const CLAVE_ESTABLECIMIENTO = "saque_caja_establecimiento";

// El evento nativo "storage" del navegador solo avisa a OTRAS pestañas, nunca a
// la que hizo el cambio — pero acá una misma pantalla puede necesitar reaccionar
// a su propio cambio. Este evento propio cubre el caso same-tab; el "storage"
// real queda además para cuando el cambio viene de otra pestaña.
const EVENTO_CAMBIO = "saque_caja_cambio";

function notificarCambio() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

/**
 * Guarda a qué establecimiento quedó atada esta PC tras emparejarla.
 *
 * El TOKEN del dispositivo NO se guarda acá: vive en la cookie saque_caja_device,
 * que es HttpOnly y el JS no puede leer. Lo único que necesita el kiosco de este
 * lado es el establecimientoId, para saber a quién pedirle los empleados.
 */
export function guardarDispositivo(establecimientoId: number, nombreLocal: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_ESTABLECIMIENTO, String(establecimientoId));
  window.localStorage.setItem(CLAVE_EMPAREJADO, "1");
  window.localStorage.setItem(CLAVE_NOMBRE_LOCAL, nombreLocal);
  notificarCambio();
}

/** `null` si esta PC nunca se emparejó. */
export function leerEstablecimientoDispositivo(): number | null {
  if (typeof window === "undefined") return null;
  const crudo = window.localStorage.getItem(CLAVE_ESTABLECIMIENTO);
  return crudo === null ? null : Number(crudo);
}

export function iniciarSesionEmpleado(empleadoId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CLAVE_EMPLEADO, empleadoId);
  notificarCambio();
}

export function cerrarSesionEmpleado() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CLAVE_EMPLEADO);
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

// useSyncExternalStore, no useState+useEffect: localStorage no existe
// en el server, así que leerlo derecho en el render rompería la
// hidratación. getServerSnapshot le da a React un valor neutro para
// el render de servidor, y el real llega apenas hidrata — sin flash
// ni warning. getSnapshot devuelve el string crudo (nunca un objeto
// nuevo por llamada), porque dos primitivos iguales sí son estables.
//
// OJO: por esto mismo, ninguna pantalla debe disparar una navegación
// (router.replace/push) directamente a partir de "!estoEsFalse" leído
// de uno de estos hooks dentro de un efecto — la lectura transitoria
// del valor neutro durante una navegación dura puede disparar esa
// navegación antes de que reconcilie con el valor real, y esa
// redirección ya no se deshace (ver /caja/pin/[empleadoId]/page.tsx).
export function useEmparejado(): boolean {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_EMPAREJADO) === "1",
    () => false,
  );
}

export function useNombreLocalDispositivo(): string | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_NOMBRE_LOCAL),
    () => null,
  );
}

export function useEmpleadoIdSesion(): string | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.sessionStorage.getItem(CLAVE_EMPLEADO),
    () => null,
  );
}
