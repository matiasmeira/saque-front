import type { EstadoVenta, FechaHoraISO, FechaISO, MetodoPago } from "./comunes";

/**
 * Productos y ventas de buffet.
 *
 * Dos cosas del mock que NO existen en el backend:
 *  - `umbralAlerta` en el producto: el badge de "stock bajo" es una heurística
 *    del front, no un dato del negocio.
 *  - un endpoint que devuelva UNA venta por id: sólo hay listado y métricas.
 *
 * Y una que el mock creía que faltaba y sí está: `metodoPago` en la venta.
 */
export type ProductoBuffetRequest = {
  nombre: string;
  descripcion?: string;
  precio: number;
  /** @Min(0). Se IGNORA en el PUT: para mover stock está PATCH /stock. */
  stock: number;
};

export type ProductoBuffetResponse = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
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
