import type { Role } from "@/lib/api/tipos/comunes";

/** Mismo tope que EstablecimientoService.LIMITE_ESTABLECIMIENTOS_ACTIVOS en el backend (cuenta los no eliminados). */
export const LIMITE_ESTABLECIMIENTOS = 3;

/** Mismo texto que tira el backend (LimiteEstablecimientosException). */
export const MENSAJE_LIMITE_ESTABLECIMIENTOS = "Ya alcanzaste el máximo de 3 establecimientos.";

export const RUTA_WIZARD = "/panel/bienvenida";
export const RUTA_WIZARD_NUEVO = "/panel/bienvenida?nuevo=1";

const PASOS_WIZARD = ["Identidad", "Políticas", "Horarios", "Canchas", "Tarifas", "Verificación"];

export function puedeCrearOtroComplejo(cantidad: number): boolean {
  return cantidad < LIMITE_ESTABLECIMIENTOS;
}

/**
 * A dónde ir con "+ Agregar complejo": null si ya no hay lugar (se avisa, no se
 * navega). Sin complejos es el primero: el wizard normal, sin `nuevo`.
 */
export function rutaCrearComplejo(cantidad: number): string | null {
  if (!puedeCrearOtroComplejo(cantidad)) return null;
  return cantidad === 0 ? RUTA_WIZARD : RUTA_WIZARD_NUEVO;
}

/** "Complejo adicional": se entró con intención explícita (`nuevo=1`) teniendo ya al menos uno. */
export function esComplejoAdicional({
  esNuevo,
  yaTeniaEstablecimiento,
}: {
  esNuevo: boolean;
  yaTeniaEstablecimiento: boolean;
}): boolean {
  return esNuevo && yaTeniaEstablecimiento;
}

/**
 * Guard del wizard: un OWNER que ya tenía complejo vuelve a la agenda (evita
 * duplicar el complejo con un F5 a mitad del wizard), salvo que haya entrado
 * con intención explícita de crear otro.
 */
export function debeRedirigirGuardWizard({
  rol,
  yaTeniaEstablecimiento,
  esNuevo,
}: {
  rol: Role | undefined;
  yaTeniaEstablecimiento: boolean;
  esNuevo: boolean;
}): boolean {
  return rol === "OWNER" && yaTeniaEstablecimiento && !esNuevo;
}

/**
 * Etiquetas de los pasos que se recorren. Solicitar la verificación es sólo
 * OWNER en el backend: para un ADMIN el paso 6 no existe, y la barra no
 * promete un paso que no va a poder hacer.
 */
export function pasosDelWizard(rol: Role | undefined): string[] {
  return rol === "ADMIN" ? PASOS_WIZARD.slice(0, 5) : PASOS_WIZARD;
}

const AVISO_SIN_BUSCADOR = "Hasta que lo aprobemos no vas a aparecer en el buscador ni recibir reservas.";

/** Texto del paso 6. El mes de prueba sólo se menciona para el primer complejo. */
export function textoPasoVerificacion(adicional: boolean): string {
  const base = "Enviá estos datos para que confirmemos que el complejo es real. ";
  return adicional
    ? base + AVISO_SIN_BUSCADOR
    : base +
        "Hasta que lo aprobemos no vas a aparecer en el buscador ni vas a poder recibir reservas — el mes de prueba gratis arranca recién cuando se apruebe, así que no perdés días esperando.";
}

/** Cierre cuando la solicitud de verificación ya se envió. */
export function textoCierreEnRevision(adicional: boolean): string {
  const base = "La solicitud de verificación ya está en camino — te avisamos por mail cuando la resolvamos. ";
  return adicional
    ? base + "Hasta entonces no aparece en el buscador ni puede recibir reservas."
    : base +
        "Hasta entonces no aparece en el buscador ni puede recibir reservas; el mes de prueba gratis arranca recién cuando se apruebe, así que no perdés días esperando.";
}

/** Cierre cuando no se envió la solicitud: el OWNER puede mandarla después; el ADMIN no puede, verifica él. */
export function textoCierrePendiente(rol: Role | undefined): string {
  return rol === "ADMIN"
    ? "Queda pendiente de verificación: hasta que lo verifiques desde Establecimientos, en el panel de administración, no aparece en el buscador ni puede recibir reservas."
    : "Todavía no enviaste la solicitud de verificación, así que no aparece en el buscador ni puede recibir reservas. Te lo vamos a recordar en el panel — podés mandarla cuando quieras desde Configuración.";
}
