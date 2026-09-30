import type { IniciarRegistroRequest } from "./api/tipos/auth";

/**
 * Body de POST /auth/registro/iniciar. `volverA` sólo viaja si trae texto:
 * `searchParams.get` devuelve null cuando falta y el back no debe recibir
 * "volverA": null ni un string vacío.
 */
export function armarBodyIniciarRegistro(
  email: string,
  volverA?: string | null,
): IniciarRegistroRequest {
  return volverA ? { email, volverA } : { email };
}
