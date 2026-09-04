import { apiFetch } from "../cliente";
import type { EstadoMercadoPagoResponse, IniciarOAuthMercadoPagoResponse } from "../tipos/mercadopago";

/**
 * Sub-recurso de establecimiento, convención propuesta — ver
 * src/lib/api/tipos/mercadopago.ts. El intercambio del "code" de OAuth lo
 * hace el backend en su propio callback: el front nunca lo parsea, sólo
 * relee el estado (incluso al volver del redirect de MP).
 */
export const mercadopago = {
  iniciarOAuth: (estId: number) =>
    apiFetch<IniciarOAuthMercadoPagoResponse>(`/api/v1/establecimientos/${estId}/mercadopago/oauth/iniciar`),

  obtenerEstado: (estId: number) =>
    apiFetch<EstadoMercadoPagoResponse>(`/api/v1/establecimientos/${estId}/mercadopago`),
};
