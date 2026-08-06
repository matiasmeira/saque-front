/**
 * Wrapper mínimo para simular una llamada de red mientras no hay
 * cliente de API real — evita repetir el mismo setTimeout+Promise en
 * cada página nueva. Cada call site sigue escribiendo su propio
 * // TODO backend: y su propia rama de éxito/error.
 */
export function simularLlamada<T>(resultado: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(resultado), ms));
}
