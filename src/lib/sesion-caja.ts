import { useSyncExternalStore } from "react";
import { hoyISO } from "@/lib/fecha";

/**
 * Estado del kiosco de caja (zona E) y de su contraparte en
 * Configuración (C9, sección Dispositivos), simulado en el
 * navegador.
 *
 * Tres cosas separadas, con ciclos de vida distintos:
 * - Emparejamiento del DISPOSITIVO (nombre, fechas, si está
 *   emparejado): en localStorage — sobrevive a cerrar el navegador,
 *   como una PC de mostrador real. Se cierra explícitamente cuando el
 *   dueño la revoca (revocarDispositivo, botón real en C9 — antes
 *   esto se simulaba solo con /caja?revocar=1, que ahora dispara la
 *   misma función real).
 * - Sesión del EMPLEADO logueado en esa caja: en sessionStorage — se
 *   cierra sola si se cierra la pestaña, y "Salir / cambiar de
 *   empleado" (SidebarPanel) la limpia a mano. Nunca sobrevive más
 *   que el dispositivo: desemparejar borra las dos.
 * - Tokens de emparejamiento generados desde C9 ("Generar link para
 *   nueva caja"): también en localStorage, cada uno con su propio
 *   vencimiento — es lo que permite probar el circuito completo
 *   (generar acá → abrir el link → emparejar) sin backend.
 *
 * TODO backend: nada de esto es real todavía — el emparejamiento, la
 * sesión de empleado, el rate limit de PIN y los tokens de un solo
 * uso con expiración vienen de la API.
 */
const CLAVE_EMPAREJADO = "saque_caja_emparejado";
const CLAVE_NOMBRE_LOCAL = "saque_caja_nombre_local";
const CLAVE_NOMBRE_DISPOSITIVO = "saque_caja_nombre_dispositivo";
const CLAVE_FECHA_EMPAREJAMIENTO = "saque_caja_fecha_emparejamiento";
const CLAVE_FECHA_ULTIMO_USO = "saque_caja_fecha_ultimo_uso";
const CLAVE_REVOCADO = "saque_caja_revocado";
const CLAVE_EMPLEADO = "saque_caja_empleado";
const CLAVE_TOKENS_GENERADOS = "saque_caja_tokens_generados";

// El evento nativo "storage" del navegador solo avisa a OTRAS
// pestañas, nunca a la que hizo el cambio — pero acá una misma
// pantalla puede necesitar reaccionar a su propio cambio (ej. C9
// revoca el dispositivo que está viendo /caja en otra pestaña, o la
// misma pestaña simula el caso con /caja?revocar=1). Este evento
// propio cubre el caso same-tab; el "storage" real queda además para
// cuando el cambio viene de otra pestaña.
const EVENTO_CAMBIO = "saque_caja_cambio";

function notificarCambio() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

const NOMBRE_DISPOSITIVO_POR_DEFECTO = "Caja mostrador";

export function emparejarDispositivo(nombreLocal: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_EMPAREJADO, "1");
  window.localStorage.setItem(CLAVE_NOMBRE_LOCAL, nombreLocal);
  window.localStorage.setItem(CLAVE_FECHA_EMPAREJAMIENTO, hoyISO());
  // El apodo del dispositivo ("Caja mostrador", "Bar") sobrevive a un
  // ciclo de revocar → volver a emparejar — no tiene sentido pedirle
  // al dueño que lo escriba de nuevo cada vez. Solo se inicializa la
  // primera vez.
  if (!window.localStorage.getItem(CLAVE_NOMBRE_DISPOSITIVO)) {
    window.localStorage.setItem(CLAVE_NOMBRE_DISPOSITIVO, NOMBRE_DISPOSITIVO_POR_DEFECTO);
  }
  window.localStorage.removeItem(CLAVE_REVOCADO);
  notificarCambio();
}

export function desemparejarDispositivo() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLAVE_EMPAREJADO);
  window.localStorage.removeItem(CLAVE_NOMBRE_LOCAL);
  window.sessionStorage.removeItem(CLAVE_EMPLEADO);
  notificarCambio();
}

/** La acción real de "Revocar" en C9 — a diferencia de desemparejarDispositivo(), deja marca de POR QUÉ cayó, para que /caja muestre el mensaje correcto ("fue desvinculado") en vez del genérico de primera vez. */
export function revocarDispositivo() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_REVOCADO, "1");
  desemparejarDispositivo();
}

export function renombrarDispositivo(nombre: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLAVE_NOMBRE_DISPOSITIVO, nombre);
  notificarCambio();
}

export function iniciarSesionEmpleado(empleadoId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CLAVE_EMPLEADO, empleadoId);
  window.localStorage.setItem(CLAVE_FECHA_ULTIMO_USO, hoyISO());
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

export function useNombreDispositivo(): string {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_NOMBRE_DISPOSITIVO) ?? NOMBRE_DISPOSITIVO_POR_DEFECTO,
    () => NOMBRE_DISPOSITIVO_POR_DEFECTO,
  );
}

export function useFechaEmparejamientoDispositivo(): string | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_FECHA_EMPAREJAMIENTO),
    () => null,
  );
}

export function useFechaUltimoUsoDispositivo(): string | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_FECHA_ULTIMO_USO),
    () => null,
  );
}

export function useFueRevocado(): boolean {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.localStorage.getItem(CLAVE_REVOCADO) === "1",
    () => false,
  );
}

export function useEmpleadoIdSesion(): string | null {
  return useSyncExternalStore(
    suscribirseAlmacenamiento,
    () => window.sessionStorage.getItem(CLAVE_EMPLEADO),
    () => null,
  );
}

// ── Tokens de emparejamiento generados desde C9 ──────────────────
// Aparte de los 3 tokens fijos de mocks/dispositivos.ts (que cubren
// los 3 estados para poder probarlos sin generar nada), "Generar
// link para nueva caja" crea uno de estos, con vencimiento real, para
// poder probar el circuito completo de punta a punta.

type TokenGenerado = { token: string; expiraEn: string; usado: boolean };

function leerTokensGenerados(): TokenGenerado[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE_TOKENS_GENERADOS);
    return crudo ? (JSON.parse(crudo) as TokenGenerado[]) : [];
  } catch {
    return [];
  }
}

function guardarTokensGenerados(tokens: TokenGenerado[]) {
  window.localStorage.setItem(CLAVE_TOKENS_GENERADOS, JSON.stringify(tokens));
}

export const MINUTOS_VALIDEZ_LINK = 10;

export function generarTokenEmparejamiento(): { token: string; expiraEn: string } {
  const token = `tok-${Math.random().toString(36).slice(2, 10)}`;
  const expiraEn = new Date(Date.now() + MINUTOS_VALIDEZ_LINK * 60_000).toISOString();
  if (typeof window !== "undefined") {
    guardarTokensGenerados([...leerTokensGenerados(), { token, expiraEn, usado: false }]);
    notificarCambio();
  }
  return { token, expiraEn };
}

export type EstadoTokenGenerado = "valido" | "vencido" | "usado";

/** null = no es un token generado desde acá (puede ser uno de los 3 fijos, o no existir). */
export function estadoDeTokenGenerado(token: string): EstadoTokenGenerado | null {
  const encontrado = leerTokensGenerados().find((t) => t.token === token);
  if (!encontrado) return null;
  if (encontrado.usado) return "usado";
  if (new Date(encontrado.expiraEn).getTime() < Date.now()) return "vencido";
  return "valido";
}

export function marcarTokenGeneradoComoUsado(token: string) {
  const tokens = leerTokensGenerados();
  const indice = tokens.findIndex((t) => t.token === token);
  if (indice === -1) return;
  tokens[indice] = { ...tokens[indice], usado: true };
  guardarTokensGenerados(tokens);
}
