const LARGO_MAXIMO_NOMBRE = 40;

/**
 * Validación de front antes de mandar el POST: el backend no exige nada sobre
 * `label` (ni @NotBlank ni @Size), así que el tope de 40 es una decisión de
 * UX nuestra para que el nombre entre bien en la tabla de dispositivos y no
 * se vea feo en los demás lugares donde se muestra.
 */
export function validarNombreDispositivo(nombre: string): string | null {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return "Poné un nombre para la caja.";
  if (nombreLimpio.length > LARGO_MAXIMO_NOMBRE) {
    return `El nombre no puede tener más de ${LARGO_MAXIMO_NOMBRE} caracteres.`;
  }
  return null;
}

/** Trim + case-insensitive: el backend no exige unicidad, esto es sólo un aviso. */
export function hayNombreRepetido(nombre: string, existentes: string[]): boolean {
  const normalizado = nombre.trim().toLowerCase();
  return existentes.some((existente) => existente.trim().toLowerCase() === normalizado);
}

/**
 * Primer "Caja N" libre, no dispositivos.length + 1: si ya hay "Caja 1" y
 * "Caja 3" (se revocó la 2), sugiere el hueco "Caja 2" en vez de "Caja 3" de
 * nuevo.
 */
export function sugerirNombreDispositivo(existentes: string[]): string {
  const usados = new Set(existentes.map((existente) => existente.trim().toLowerCase()));
  let n = 1;
  while (usados.has(`caja ${n}`)) n++;
  return `Caja ${n}`;
}
