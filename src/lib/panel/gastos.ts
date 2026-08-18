import type { MetodoPago } from "@/lib/api/tipos/comunes";

/**
 * Gastos del complejo: costos operativos que se restan de la facturación para
 * llegar al neto real (bloque "Resultado" de /panel/reportes, contra
 * `GET .../reportes/resultado`).
 *
 * Acá no hay datos: /panel/gastos consume el CRUD real
 * (`/establecimientos/{id}/gastos`). Quedan el tipo, el catálogo de categorías
 * —los 8 valores del enum `CategoriaGasto` del backend— y los dos totales que
 * las pantallas calculan sobre lo que trae la API.
 *
 * Era `src/mocks/gastos.ts`, que generaba 38 gastos falsos.
 */
export type CategoriaGasto =
  | "ALQUILER"
  | "SERVICIOS"
  | "SUELDOS"
  | "INSUMOS"
  | "MANTENIMIENTO"
  | "IMPUESTOS"
  | "MARKETING"
  | "OTROS";

export const CATEGORIAS_GASTO: { valor: CategoriaGasto; etiqueta: string }[] = [
  { valor: "ALQUILER", etiqueta: "Alquiler" },
  { valor: "SERVICIOS", etiqueta: "Servicios" },
  { valor: "SUELDOS", etiqueta: "Sueldos" },
  { valor: "INSUMOS", etiqueta: "Insumos" },
  { valor: "MANTENIMIENTO", etiqueta: "Mantenimiento" },
  { valor: "IMPUESTOS", etiqueta: "Impuestos" },
  { valor: "MARKETING", etiqueta: "Marketing" },
  { valor: "OTROS", etiqueta: "Otros" },
];

export function etiquetaCategoriaGasto(categoria: CategoriaGasto): string {
  return CATEGORIAS_GASTO.find((c) => c.valor === categoria)?.etiqueta ?? categoria;
}

export type Gasto = {
  id: number;
  /** fecha ISO "YYYY-MM-DD" */
  fecha: string;
  monto: number;
  categoria: CategoriaGasto;
  descripcion: string;
  metodoPago: MetodoPago;
  /**
   * Es una URL que el dueño pega a mano: el backend la guarda como texto y no
   * hay endpoint de subida de archivos en ningún lado de la API.
   */
  comprobanteUrl?: string;
};

export function totalGastos(gastos: Gasto[]): number {
  return gastos.reduce((acc, g) => acc + g.monto, 0);
}

/** Para el desglose por categoría: sólo las que tuvieron movimiento, en el orden del catálogo. */
export function gastosPorCategoria(gastos: Gasto[]): { categoria: CategoriaGasto; monto: number }[] {
  const totales = new Map<CategoriaGasto, number>();
  for (const g of gastos) totales.set(g.categoria, (totales.get(g.categoria) ?? 0) + g.monto);
  return CATEGORIAS_GASTO.map((c) => ({ categoria: c.valor, monto: totales.get(c.valor) ?? 0 })).filter((d) => d.monto > 0);
}
