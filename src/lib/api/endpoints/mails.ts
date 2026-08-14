import { apiFetch } from "../cliente";

export type BajaMarketingRequest = {
  token: string;
};

export type EnviarOfertaRequest = {
  asunto: string;
  /** El DTO del back se llama `cuerpoHtml`, no `cuerpo`, y espera HTML. */
  cuerpoHtml: string;
};

/** MailsController — /api/v1/mails. Público. */
export const mails = {
  /**
   * Baja de marketing. Público a propósito: el link del mail identifica al
   * usuario por su token opaco (Usuario.unsubscribeToken), no por una sesión.
   * Devuelve 204 sin body.
   */
  darDeBaja: (body: BajaMarketingRequest) =>
    apiFetch<void>("/api/v1/mails/baja", { method: "POST", body, conAuth: false }),
};

/**
 * AdminMailsController — /api/v1/admin/mails.
 *
 * OJO: exige rol ADMIN (validado dentro de OfertaMarketingService, sin
 * @PreAuthorize) y el envío alcanza a TODOS los usuarios de la plataforma con
 * opt-in de marketing, sin filtrar por establecimiento. No es una herramienta
 * del dueño de un complejo. Devuelve 202 con body vacío porque el envío es
 * asíncrono: la cantidad de destinatarios no está disponible para el frontend.
 */
export const adminMails = {
  enviarOferta: (body: EnviarOfertaRequest) =>
    apiFetch<void>("/api/v1/admin/mails/oferta", { method: "POST", body }),
};
