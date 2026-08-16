import { apiFetch, nuevaIdempotencyKey } from "../cliente";
import { construirQuery } from "../query";
import type { EstadoVenta, Page } from "../tipos/comunes";
import type {
  AjustarStockRequest,
  MetricasVentasResponse,
  ProductoBuffetRequest,
  ProductoBuffetResponse,
  VentaRequest,
  VentaResponse,
  VentaResumenResponse,
} from "../tipos/buffet";

/** ProductoBuffetController — /api/v1/establecimientos/{estId}/productos-buffet. */
export const productosBuffet = {
  listar: (estId: number) =>
    apiFetch<ProductoBuffetResponse[]>(
      `/api/v1/establecimientos/${estId}/productos-buffet`,
    ),

  crear: (estId: number, body: ProductoBuffetRequest) =>
    apiFetch<ProductoBuffetResponse>(
      `/api/v1/establecimientos/${estId}/productos-buffet`,
      { method: "POST", body },
    ),

  /** OJO: el backend IGNORA `stock` acá. Para moverlo hay que usar ajustarStock. */
  actualizar: (estId: number, productoId: number, body: ProductoBuffetRequest) =>
    apiFetch<ProductoBuffetResponse>(
      `/api/v1/establecimientos/${estId}/productos-buffet/${productoId}`,
      { method: "PUT", body },
    ),

  /** `cantidad` es un DELTA: 5 suma cinco, -2 descuenta dos. */
  ajustarStock: (estId: number, productoId: number, body: AjustarStockRequest) =>
    apiFetch<ProductoBuffetResponse>(
      `/api/v1/establecimientos/${estId}/productos-buffet/${productoId}/stock`,
      { method: "PATCH", body },
    ),

  eliminar: (estId: number, productoId: number) =>
    apiFetch<void>(
      `/api/v1/establecimientos/${estId}/productos-buffet/${productoId}`,
      { method: "DELETE" },
    ),
};

/**
 * VentaBuffetController — /api/v1/buffet/ventas.
 *
 * No está anidado bajo establecimiento: el establecimientoId viaja en el body
 * (alta) o como query param (listado y métricas).
 */
export const ventasBuffet = {
  /** El backend protege este POST con Idempotency-Key: un doble tap no cobra dos veces. */
  crear: (body: VentaRequest) =>
    apiFetch<VentaResponse>("/api/v1/buffet/ventas", {
      method: "POST",
      body,
      idempotencyKey: nuevaIdempotencyKey(),
    }),

  /** Devuelve el stock de los productos vendidos. Sólo OWNER/ADMIN. */
  cancelar: (id: number) =>
    apiFetch<VentaResponse>(`/api/v1/buffet/ventas/${id}/cancelar`, { method: "PUT" }),

  /** Sin `estado` trae CONFIRMADA y CANCELADA. Orden por fechaHora desc. */
  listar: (
    estId: number,
    desde: string,
    hasta: string,
    { estado, page = 0, size = 100 }: { estado?: EstadoVenta; page?: number; size?: number } = {},
  ) =>
    apiFetch<Page<VentaResumenResponse>>(
      `/api/v1/buffet/ventas${construirQuery({
        establecimientoId: estId,
        desde,
        hasta,
        estado,
        page,
        size,
      })}`,
    ),

  metricas: (estId: number, desde: string, hasta: string) =>
    apiFetch<MetricasVentasResponse>(
      `/api/v1/buffet/ventas/metricas${construirQuery({
        establecimientoId: estId,
        desde,
        hasta,
      })}`,
    ),
};
