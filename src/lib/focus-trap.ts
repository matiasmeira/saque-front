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
