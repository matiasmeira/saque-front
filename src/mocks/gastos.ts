/**
 * Gastos del complejo (panel del dueño) — costos operativos que se
 * restan de la facturación para llegar al neto real (bloque "Resultado"
 * de /panel/reportes, hoy contra GET .../reportes/resultado).
 *
 * Lo que queda acá NO son datos: /panel/gastos ya consume
 * GET/POST/PUT/DELETE /establecimientos/{id}/gastos. Sobreviven el tipo
 * `Gasto`, el catálogo `CATEGORIAS_GASTO` y los helpers de totales que usan
 * las pantallas para presentar lo que trae la API.
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { hoyISO, sumarDias } from "@/lib/fecha";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";

export type CategoriaGasto = "ALQUILER" | "SERVICIOS" | "SUELDOS" | "INSUMOS" | "MANTENIMIENTO" | "IMPUESTOS" | "MARKETING" | "OTROS";

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
  /** TODO backend: hoy es solo texto — subida real de archivos vía ImageKit todavía no está integrada (ver galeria-config.tsx). */
  comprobanteUrl?: string;
};

const MONTO_POR_CATEGORIA: Record<CategoriaGasto, [number, number]> = {
  ALQUILER: [180000, 220000],
  SERVICIOS: [20000, 60000],
  SUELDOS: [150000, 400000],
  INSUMOS: [8000, 45000],
  MANTENIMIENTO: [10000, 90000],
  IMPUESTOS: [15000, 70000],
  MARKETING: [5000, 35000],
  OTROS: [3000, 25000],
};

const DESCRIPCION_POR_CATEGORIA: Record<CategoriaGasto, string[]> = {
  ALQUILER: ["Alquiler del predio"],
  SERVICIOS: ["Luz", "Gas", "Agua", "Internet"],
  SUELDOS: ["Sueldo encargado", "Sueldo mantenimiento", "Sueldo recepción"],
  INSUMOS: ["Pelotas", "Redes", "Cinta para líneas", "Artículos de limpieza"],
  MANTENIMIENTO: ["Reparación de luminarias", "Pintura de líneas", "Service de compresor", "Arreglo de red"],
  IMPUESTOS: ["Ingresos brutos", "Tasa municipal", "ART"],
  MARKETING: ["Campaña en redes", "Impresión de folletos"],
  OTROS: ["Gasto varios"],
};

function generarGasto(id: number, fecha: string, rand: () => number): Gasto {
  const categoria = CATEGORIAS_GASTO[Math.floor(rand() * CATEGORIAS_GASTO.length)].valor;
  const [min, max] = MONTO_POR_CATEGORIA[categoria];
  const monto = Math.round((min + rand() * (max - min)) / 100) * 100;
  const opciones = DESCRIPCION_POR_CATEGORIA[categoria];
  const descripcion = opciones[Math.floor(rand() * opciones.length)];
  const comprobanteUrl = rand() < 0.35 ? `https://comprobantes.saque.app/gasto-${id}.jpg` : undefined;
  const metodoPago = METODOS_PAGO[Math.floor(rand() * METODOS_PAGO.length)].valor;
  return { id, fecha, monto, categoria, descripcion, metodoPago, comprobanteUrl };
}

const rand = crearRand(hashSeed("gastos-complejo"));

export const PANEL_GASTOS: Gasto[] = Array.from({ length: 38 }, (_, i) => generarGasto(i + 1, sumarDias(hoyISO(), -Math.floor(rand() * 120)), rand)).sort((a, b) =>
  a.fecha < b.fecha ? 1 : -1,
);

export function gastosDelPeriodo(gastos: Gasto[], desde: string, hasta: string): Gasto[] {
  return gastos.filter((g) => g.fecha >= desde && g.fecha <= hasta);
}

export function totalGastos(gastos: Gasto[]): number {
  return gastos.reduce((acc, g) => acc + g.monto, 0);
}

export function gastosPorCategoria(gastos: Gasto[]): { categoria: CategoriaGasto; monto: number }[] {
  const totales = new Map<CategoriaGasto, number>();
  for (const g of gastos) totales.set(g.categoria, (totales.get(g.categoria) ?? 0) + g.monto);
  return CATEGORIAS_GASTO.map((c) => ({ categoria: c.valor, monto: totales.get(c.valor) ?? 0 })).filter((d) => d.monto > 0);
}
