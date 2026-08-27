/**
 * Transformaciones on-the-fly de ImageKit via query params: evita bajar la
 * imagen full para una miniatura de grilla. La URL guardada (sin params) es
 * la que se usa para el detalle.
 */
export function miniatura(url: string): string {
  return `${url}?tr=w-300,h-200,c-at_max`;
}
