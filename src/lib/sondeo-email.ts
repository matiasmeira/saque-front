/** Resultado de sondear un email en el paso 1 de /ingresar. */
export type ResultadoSondeo = "nuevo" | "tiene-cuenta" | "esperar";

/**
 * Clasifica el status que devuelve POST /auth/registro/iniciar al sondear.
 *   - 2xx → "nuevo": no hay cuenta y el back ya mandó el código.
 *   - 400 → "tiene-cuenta": "El email ya está registrado".
 *   - 429 → "esperar": rate limit. El cupo por email se consume ANTES de
 *     chequear si existe, así que un 429 no dice nada sobre la cuenta.
 *   - otro → null: error real, el llamador lo propaga.
 */
export function clasificarSondeo(status: number): ResultadoSondeo | null {
  if (status >= 200 && status < 300) return "nuevo";
  if (status === 400) return "tiene-cuenta";
  if (status === 429) return "esperar";
  return null;
}
