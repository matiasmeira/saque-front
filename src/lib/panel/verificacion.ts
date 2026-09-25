import type { ErroresCampo } from "@/lib/panel/wizard-onboarding";

export type DatosSolicitudVerificacion = {
  cuit: string;
  razonSocial: string;
  telefonoContacto: string;
  urlRedSocial: string;
};

/** Mismos 3 dominios que RedSocialUrlUtils del backend (core/util). */
const DOMINIOS_RED_SOCIAL_VALIDOS = new Set(["instagram.com", "facebook.com", "fb.com"]);

/** Deja sólo los dígitos — igual que CuitUtils.normalizar del backend. Acepta que se tipee con guiones. */
export function normalizarCuit(cuit: string): string {
  return cuit.replace(/\D/g, "");
}

/**
 * Sólo chequea el FORMATO (11 dígitos tras sacar guiones/espacios). El dígito
 * verificador (módulo 11) lo valida el backend — no se duplica acá, se
 * muestra su mensaje si lo rechaza.
 */
function tieneLongitudDeCuit(cuit: string): boolean {
  return normalizarCuit(cuit).length === 11;
}

/**
 * true si, sacando un esquema http(s) opcional y un "www." opcional, el host
 * es instagram.com, facebook.com o fb.com. Mismo criterio permisivo que
 * RedSocialUrlUtils.esUrlValida del backend.
 */
export function esUrlRedSocialValida(url: string): boolean {
  const sinEsquema = url.trim().replace(/^https?:\/\//i, "");
  const host = sinEsquema.split(/[/?#]/)[0];
  const hostNormalizado = host.replace(/^www\./i, "").toLowerCase();
  return DOMINIOS_RED_SOCIAL_VALIDOS.has(hostNormalizado);
}

/**
 * Validación de front antes de mandar el POST: los 4 obligatorios, el CUIT
 * con forma de CUIT, y la URL de una red social soportada. Sólo bloquea lo
 * que el backend igual va a rechazar sin siquiera llamarlo — el resto
 * (módulo 11 del CUIT) queda para la respuesta del backend.
 */
export function validarSolicitudVerificacion(datos: DatosSolicitudVerificacion): ErroresCampo {
  const errores: ErroresCampo = {};

  if (!datos.cuit.trim()) errores.cuit = "El CUIT es obligatorio.";
  else if (!tieneLongitudDeCuit(datos.cuit)) errores.cuit = "El CUIT tiene que tener 11 dígitos.";

  if (!datos.razonSocial.trim()) errores.razonSocial = "La razón social es obligatoria.";

  if (!datos.telefonoContacto.trim()) errores.telefonoContacto = "El teléfono de contacto es obligatorio.";

  if (!datos.urlRedSocial.trim()) errores.urlRedSocial = "La URL de Instagram o Facebook es obligatoria.";
  else if (!esUrlRedSocialValida(datos.urlRedSocial)) errores.urlRedSocial = "Tiene que ser un link de Instagram o Facebook.";

  return errores;
}
