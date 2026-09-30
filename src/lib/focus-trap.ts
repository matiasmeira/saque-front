/**
 * Decide a dónde mover el foco cuando se aprieta Tab dentro de un contenedor
 * que atrapa el foco (drawer, modal). Devuelve el índice del enfocable al que
 * hay que ir, o null si el navegador puede seguir solo (movimiento normal).
 *
 * `actual` es el índice del elemento enfocado dentro de la lista de enfocables
 * (-1 si el foco está afuera). Pura: no toca el DOM.
 */
export function indiceFocoTrap({ actual, cantidad, shift }: { actual: number; cantidad: number; shift: boolean }): number | null {
  if (cantidad <= 0) return null;
  if (cantidad === 1) return 0;
  if (actual < 0 || actual >= cantidad) return shift ? cantidad - 1 : 0;
  if (!shift && actual === cantidad - 1) return 0;
  if (shift && actual === 0) return cantidad - 1;
  return null;
}

/**
 * Qué cuenta como enfocable con Tab dentro de un diálogo: links, botones,
 * campos y cualquier [tabindex], siempre sin [disabled] y sin tabindex="-1".
 * Los inputs hidden no se enfocan. Los elementos ocultos por CSS no se
 * distinguen acá: el que la use tiene que filtrarlos (necesita el DOM).
 */
export const SELECTOR_ENFOCABLES = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  "[tabindex]",
]
  .map((s) => `${s}:not([disabled]):not([tabindex="-1"])`)
  .join(", ");

/** Pila de diálogos abiertos (el último es el que está arriba). Pura: devuelve una pila nueva. */
export function apilarDialogo(pila: readonly string[], id: string): readonly string[] {
  return [...pila.filter((x) => x !== id), id];
}

/** Saca el diálogo de la pila, esté donde esté. Un id inexistente no cambia nada. */
export function desapilarDialogo(pila: readonly string[], id: string): readonly string[] {
  return pila.filter((x) => x !== id);
}

/** true si `id` es el diálogo de más arriba. La pila vacía no tiene tope. */
export function esTopeDePila(pila: readonly string[], id: string): boolean {
  return pila.length > 0 && pila[pila.length - 1] === id;
}

/**
 * Al abrir un diálogo: si el foco ya está adentro (un autoFocus de un hijo) no
 * se toca; si no, va al ✕ del propio diálogo.
 */
export function debeEnfocarCierre({ focoDentro }: { focoDentro: boolean }): boolean {
  return !focoDentro;
}

/**
 * Al cerrar un diálogo: el foco vuelve a quien lo abrió sólo si sigue en la
 * página y no es el body. Si no, no se hace nada (el foco queda en el body).
 */
export function debeDevolverFoco({ previoConectado, previoEsBody }: { previoConectado: boolean; previoEsBody: boolean }): boolean {
  return previoConectado && !previoEsBody;
}
