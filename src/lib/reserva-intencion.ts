/**
 * Persistencia de la intención de reserva durante A4 (ingresar →
 * verificar → completar perfil). Nada de Redux ni Zustand —
 * sessionStorage alcanza: sobrevive a la navegación entre estas
 * tres rutas, se borra sola al cerrar la pestaña, y no hace falta
 * levantar un layout compartido solo para esto.
 *
 * El deadline (turno congelado 10 minutos) se fija una sola vez por
 * reserva: volver de /verificar a /ingresar no reinicia el reloj.
 * Si no hay complejo/cancha/fecha/hora (alguien entra a /ingresar
 * desde el link genérico del header, no desde un turno), el flujo
 * sigue andando para login/registro común, simplemente sin cartel
 * de cronómetro ni checkout al final.
 */
import { useSyncExternalStore } from "react";

const CLAVE = "saque:intencion-reserva";
const EVENTO_CAMBIO = "saque:intencion-cambio";
const DURACION_BLOQUEO_MS = 10 * 60 * 1000;

export type IntencionReserva = {
  complejo?: string;
  cancha?: string;
  fecha?: string;
  hora?: string;
  deadline?: number;
  email?: string;
  verificado?: boolean;
};

export function leerIntencion(): IntencionReserva | null {
  if (typeof window === "undefined") return null;
  const crudo = sessionStorage.getItem(CLAVE);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as IntencionReserva;
  } catch {
    return null;
  }
}

function notificarCambio() {
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

/**
 * Se subscribe a los cambios de la intención — tanto los que hace
 * esta misma pestaña (evento propio, sessionStorage no dispara
 * "storage" para su propia pestaña) como los de otra pestaña.
 * Pensado para useSyncExternalStore: leer sessionStorage durante el
 * render es una lectura impura, y el compiler de React ya no deja
 * llamar setState desde adentro de un efecto para sincronizarla a
 * mano — esta es la forma correcta de exponer una fuente externa.
 */
export function suscribirseIntencion(callback: () => void) {
  window.addEventListener(EVENTO_CAMBIO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, callback);
    window.removeEventListener("storage", callback);
  };
}

export function actualizarIntencion(cambios: Partial<IntencionReserva>): IntencionReserva {
  const nueva = { ...leerIntencion(), ...cambios };
  sessionStorage.setItem(CLAVE, JSON.stringify(nueva));
  notificarCambio();
  return nueva;
}

export function borrarIntencion() {
  sessionStorage.removeItem(CLAVE);
  notificarCambio();
}

/**
 * Guarda complejo/cancha/fecha/hora y arranca el bloqueo de 10
 * minutos — pero solo si es una reserva distinta a la que ya
 * estaba guardada. Es lo primero que se llama al entrar a /ingresar
 * con query params: la intención se guarda ANTES de pedir el email.
 */
export function asegurarReservaCongelada(datos: {
  complejo: string;
  cancha: string;
  fecha: string;
  hora: string;
}): IntencionReserva {
  const existente = leerIntencion();
  const mismaReserva =
    existente?.complejo === datos.complejo &&
    existente?.cancha === datos.cancha &&
    existente?.fecha === datos.fecha &&
    existente?.hora === datos.hora;

  return actualizarIntencion(mismaReserva ? {} : { ...datos, deadline: Date.now() + DURACION_BLOQUEO_MS });
}

/**
 * Guarda complejo/cancha/fecha/hora SIN arrancar el bloqueo de 10
 * minutos. La usa /ingresar: mostrar el checkout completo y dejar
 * elegir cuenta no es sensible, pero arrancar el reloj antes de que
 * haya un pago de por medio sí lo es — un bot podría pegarle a esta
 * URL para todos los horarios y bloquear canchas sin registrarse
 * nunca. Arrancar el reloj es responsabilidad exclusiva del botón
 * de pago en el checkout (asegurarReservaCongelada).
 *
 * Si la reserva es DISTINTA a la que ya estaba guardada, limpia
 * cualquier deadline viejo: si no, un deadline de una reserva
 * abandonada podría reaparecer en el checkout de esta reserva nueva.
 * Si es la MISMA reserva, no lo toca — mismo criterio que
 * asegurarReservaCongelada.
 */
export function guardarBooking(datos: {
  complejo: string;
  cancha: string;
  fecha: string;
  hora: string;
}): IntencionReserva {
  const existente = leerIntencion();
  const mismaReserva =
    existente?.complejo === datos.complejo &&
    existente?.cancha === datos.cancha &&
    existente?.fecha === datos.fecha &&
    existente?.hora === datos.hora;

  return actualizarIntencion(mismaReserva ? datos : { ...datos, deadline: undefined });
}

export function urlCheckout(intencion: { complejo: string; cancha: string; fecha: string; hora: string }): string {
  const params = new URLSearchParams({ cancha: intencion.cancha, fecha: intencion.fecha, hora: intencion.hora });
  return `/reservar/${intencion.complejo}?${params.toString()}`;
}

// useSyncExternalStore exige que getSnapshot devuelva la MISMA
// referencia si el dato no cambió — si no, entra en loop ("the
// result of getSnapshot should be cached"). leerIntencion() arma un
// objeto nuevo en cada llamada (viene de JSON.parse), así que acá
// cacheamos por el string crudo.
let crudoCacheado: string | null = null;
let valorCacheado: IntencionReserva | null = null;

function obtenerSnapshot(): IntencionReserva | null {
  const crudo = typeof window === "undefined" ? null : sessionStorage.getItem(CLAVE);
  if (crudo === crudoCacheado) return valorCacheado;
  crudoCacheado = crudo;
  try {
    valorCacheado = crudo ? (JSON.parse(crudo) as IntencionReserva) : null;
  } catch {
    valorCacheado = null;
  }
  return valorCacheado;
}

/** Lee la intención y se mantiene sincronizado con sus cambios. */
export function useIntencion(): IntencionReserva | null {
  return useSyncExternalStore(suscribirseIntencion, obtenerSnapshot, () => null);
}

/** "sábado 20:00" — para meter la fecha del turno en una oración. */
export function etiquetaTurno(fechaISO: string, hora: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  const dia = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(fecha);
  return `${dia} ${hora}`;
}
