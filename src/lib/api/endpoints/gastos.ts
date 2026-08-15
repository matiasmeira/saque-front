import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type { CategoriaGasto, Page } from "../tipos/comunes";
import type { GastoRequest, GastoResponse } from "../tipos/gastos";

/** GastoController — /api/v1/establecimientos/{estId}/gastos. OWNER / ADMIN. */
export const gastos = {
  /**
   * `desde`, `hasta` y `categoria` son opcionales: sin ellos devuelve todo.
   * Paginado, default size 20 — se pide 100 (el tope) para que el total del
   * período y el desglose por categoría se calculen sobre el conjunto
   * completo y no sobre una página.
   */
  listar: (
    estId: number,
    { desde, hasta, categoria, page = 0, size = 100 }: {
      desde?: string;
      hasta?: string;
      categoria?: CategoriaGasto;
      page?: number;
      size?: number;
    } = {},
  ) =>
    apiFetch<Page<GastoResponse>>(
      `/api/v1/establecimientos/${estId}/gastos${construirQuery({
        desde,
        hasta,
        categoria,
        page,
        size,
      })}`,
    ),

  crear: (estId: number, body: GastoRequest) =>
    apiFetch<GastoResponse>(`/api/v1/establecimientos/${estId}/gastos`, {
      method: "POST",
      body,
    }),

  actualizar: (estId: number, gastoId: number, body: GastoRequest) =>
    apiFetch<GastoResponse>(`/api/v1/establecimientos/${estId}/gastos/${gastoId}`, {
      method: "PUT",
      body,
    }),

  /** 204. Anulación lógica (isActive=false), no borrado físico. */
  eliminar: (estId: number, gastoId: number) =>
    apiFetch<void>(`/api/v1/establecimientos/${estId}/gastos/${gastoId}`, {
      method: "DELETE",
    }),
};
