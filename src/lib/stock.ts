export type EstadoStock = "ok" | "bajo" | "agotado";

/**
 * Umbral para el aviso de "stock bajo".
 *
 * Es una heurística de PRESENTACIÓN, no un dato del negocio: ProductoBuffet no
 * tiene `umbralAlerta` en el backend, así que no se puede configurar por
 * producto. Si en algún momento hace falta que cada producto tenga el suyo,
 * el campo tiene que existir primero en el DTO.
 */
export const UMBRAL_STOCK_BAJO = 5;

export function estadoStock(stock: number): EstadoStock {
  if (stock <= 0) return "agotado";
  if (stock <= UMBRAL_STOCK_BAJO) return "bajo";
  return "ok";
}
