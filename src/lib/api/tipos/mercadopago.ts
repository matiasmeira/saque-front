/**
 * MercadoPagoController — convención propuesta (Ruling 1 del plan de Fase 2
 * del wizard), a confirmar cuando el backend real exista. Mismo patrón que
 * fotos/canchas/políticas-cancelación: sub-recurso propio del establecimiento.
 */
export type IniciarOAuthMercadoPagoResponse = {
  /** URL de Mercado Pago a la que el front sólo redirige — arma client_id + redirect_uri el backend. */
  urlAutorizacion: string;
};

export type EstadoMercadoPagoResponse = {
  conectado: boolean;
  /** Nombre o email de la cuenta conectada, para mostrar. null si no está conectado. */
  cuenta: string | null;
};
