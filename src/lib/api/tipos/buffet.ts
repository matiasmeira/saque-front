import type { EstadoVenta, FechaHoraISO, FechaISO, MetodoPago } from "./comunes";

/**
 * Productos y ventas de buffet.
 *
 * Lo que NO existe en el backend: un endpoint que devuelva UNA venta por id
 * (sólo hay listado y métricas).
 *
 * Y dos que el mock creía que faltaban y sí están: `metodoPago` en la venta, y
 * `umbralAlerta` en el producto (agregado en V16).
 *
 * El stock PUEDE ser negativo: es informativo y no bloquea una venta real ya
 * cobrada en el mostrador.
 */
export type ProductoBuffetRequest = {
  nombre: string;
  descripcion?: string;
  precio: number;
  /** @Min(0). Se IGNORA en el PUT: para mover stock está PATCH /stock. */
  stock: number;
  /** Opcional: si no se manda, el backend deja 5. */
  umbralAlerta?: number;
};

export type ProductoBuffetResponse = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  /** Puede ser negativo. */
  stock: number;
  /** Con stock igual o menor a este número, se marca "stock bajo". */
  umbralAlerta: number;
  establecimientoId: number;
};

/** Delta, no valor absoluto. Admite negativos para descontar. */
export type AjustarStockRequest = {
  cantidad: number;
};

export type DetalleVentaRequest = {
  productoId: number;
  cantidad: number;
};

/**
 * `establecimientoId` va en el BODY: VentaBuffetController no está anidado bajo
 * establecimiento, a diferencia del resto de la API.
 */
export type VentaRequest = {
  establecimientoId: number;
  /** Opcional: permite cargar el consumo a un turno. */
  reservaId?: number;
  metodoPago: MetodoPago;
  detalles: DetalleVentaRequest[];
};

export type DetalleVentaResponse = {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  /** subtotal/cantidad, redondeado HALF_UP a 2 decimales. */
  precioUnitario: number;
  subtotal: number;
};

export type VentaResponse = {
  id: number;
  fechaHora: FechaHoraISO;
  total: number;
  estado: EstadoVenta;
  metodoPago: MetodoPago;
  establecimientoId: number;
  reservaId: number | null;
  detalles: DetalleVentaResponse[];
};

/** El listado devuelve esta versión liviana, sin el desglose por ítem. */
export type VentaResumenResponse = {
  id: number;
  fechaHora: FechaHoraISO;
  total: number;
  estado: EstadoVenta;
  metodoPago: MetodoPago;
  reservaId: number | null;
};

export type ProductoMasVendidoResponse = {
  productoId: number;
  productoNombre: string;
  cantidadVendida: number;
  ingresoGenerado: number;
};

export type MetricasVentasResponse = {
  establecimientoId: number;
  desde: FechaISO;
  hasta: FechaISO;
  ingresoTotal: number;
  cantidadVentas: number;
  ticketPromedio: number;
  productosMasVendidos: ProductoMasVendidoResponse[];
};
