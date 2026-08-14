export type ValorQuery = string | number | boolean | null | undefined;

/**
 * Arma el query string de una request.
 *
 * Omite `null`, `undefined` y string vacio: en la API casi todos los filtros
 * son opcionales y mandarlos vacios cambia el resultado (por ejemplo `buscar=`
 * o `estado=`). En cambio `0` y `false` SI viajan: `page=0` es la primera
 * pagina e `incluirCanceladas=false` es un valor con significado.
 *
 * Un array repite la clave, que es como Spring Data espera el `sort` multiple:
 * `?sort=fechaHora,desc&sort=id,desc`.
 */
export function construirQuery(
  params: Record<string, ValorQuery | ValorQuery[]>,
): string {
  const search = new URLSearchParams();

  for (const [clave, valor] of Object.entries(params)) {
    const valores = Array.isArray(valor) ? valor : [valor];
    for (const item of valores) {
      if (item === null || item === undefined || item === "") continue;
      search.append(clave, String(item));
    }
  }

  const texto = search.toString();
  return texto === "" ? "" : `?${texto}`;
}
