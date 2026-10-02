/**
 * Interruptor único de la verificación de teléfono. Mientras sea false, el
 * flujo está apagado: el perfil, la configuración del complejo y el wizard
 * muestran "Próximamente", el checkout no avisa nada preventivo y el front
 * manda requiereTelefonoVerificado=false. Para volver a encenderla alcanza
 * con cambiar este valor (el código del flujo sigue en su lugar).
 */
export const VERIFICACION_TELEFONO_HABILITADA = false;

/**
 * Valor de requiereTelefonoVerificado que se manda al backend (o se muestra
 * como requisito al jugador): con la verificación apagada siempre es false,
 * aunque el complejo lo tenga guardado en true.
 */
export function requiereTelefonoEfectivo(
  guardado: boolean,
  habilitada: boolean = VERIFICACION_TELEFONO_HABILITADA,
): boolean {
  return habilitada && guardado;
}
