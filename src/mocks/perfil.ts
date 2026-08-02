/**
 * Datos de A11 que no viven en la sesión liviana de lib/usuario.ts
 * (nombre/email/teléfono, lo mínimo para reconocer al jugador en el
 * checkout). El email verificado es de esta otra fuente porque en el
 * backend real sale de la verificación de A4, no de la sesión misma.
 */
export type Perfil = {
  emailVerificado: boolean;
};

export const PERFIL_MOCK: Perfil = {
  emailVerificado: true,
};
