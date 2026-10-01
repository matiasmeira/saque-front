import type { IniciarRegistroRequest } from "./api/tipos/auth";
import type { ModoRegistro } from "./modo-registro";

/**
 * Body de POST /auth/registro/iniciar.
 *
 * - `volverA` sólo viaja si trae texto: `searchParams.get` devuelve null cuando
 *   falta y el back no debe recibir "volverA": null ni un string vacío.
 * - En modo dueño viaja `tipo: "DUENO"` y NO viaja `volverA` (el dueño siempre
 *   aterriza en el panel). En modo jugador no se manda `tipo` (el back asume
 *   JUGADOR).
 */
export function armarBodyIniciarRegistro({
  email,
  volverA,
  modo = "jugador",
}: {
  email: string;
  volverA?: string | null;
  modo?: ModoRegistro;
}): IniciarRegistroRequest {
  if (modo === "dueno") return { email, tipo: "DUENO" };
  return volverA ? { email, volverA } : { email };
}
