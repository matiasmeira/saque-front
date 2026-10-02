/** Usuarios del seed e2e del back (sacaladelangulo/e2e/seed/V1000__seed_e2e.sql). */
export const CLAVE_E2E = "E2e-Canche-2026!";

export const USUARIOS = {
  dueno: { email: "dueno.e2e@canche.test", password: CLAVE_E2E },
  duenoVacio: { email: "dueno.vacio.e2e@canche.test", password: CLAVE_E2E },
  admin: { email: "admin.e2e@canche.test", password: CLAVE_E2E },
  jugador: { email: "jugador.e2e@canche.test", password: CLAVE_E2E },
} as const;

/** Email que no choca con corridas anteriores si se reusan los servidores. */
export function emailUnico(prefijo: string): string {
  return `${prefijo}+${Date.now()}@canche.test`;
}
