export type EstadoStock = "ok" | "bajo" | "agotado";

/** Se usa cuando un producto todavía no tiene umbral propio. */
export const UMBRAL_STOCK_BAJO_POR_DEFECTO = 5;

/**
 * El umbral es POR PRODUCTO (ProductoBuffet.umbralAlerta): no se repone igual
 * una caja de agua que rota por decenas que un producto que sale una vez por
 * semana.
 *
 * El stock puede ser negativo — una venta real no se bloquea porque el
 * inventario del sistema esté desactualizado — y en ese caso cuenta como
 * agotado.
 */
export function estadoStock(
  stock: number,
  umbralAlerta: number = UMBRAL_STOCK_BAJO_POR_DEFECTO,
): EstadoStock {
  if (stock <= 0) return "agotado";
  if (stock <= umbralAlerta) return "bajo";
  return "ok";
}
