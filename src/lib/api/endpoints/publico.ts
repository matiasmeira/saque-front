import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type { Page } from "../tipos/comunes";
import type { DisponibilidadEstablecimientoResponse } from "../tipos/disponibilidad";
import type {
  ComplejoCardResponse,
  ComplejoDetalleResponse,
  FiltrosComplejos,
} from "../tipos/publico";

/**
 * ComplejoPublicoController — /api/v1/publico/complejos.
 *
 * `conAuth: false` a propósito: son endpoints públicos y mandarles un
 * Authorization vencido los haría fallar sin ninguna necesidad.
 */
export const publico = {
  buscarComplejos: ({ page = 0, size = 20, ...filtros }: FiltrosComplejos = {}) =>
    apiFetch<Page<ComplejoCardResponse>>(
      `/api/v1/publico/complejos${construirQuery({ ...filtros, page, size })}`,
      { conAuth: false },
    ),

  detalle: (slug: string) =>
    apiFetch<ComplejoDetalleResponse>(
      `/api/v1/publico/complejos/${encodeURIComponent(slug)}`,
      { conAuth: false },
    ),

  /** `fechaFin` opcional; si se omite, devuelve sólo `fecha`. Tope de 31 días. */
  disponibilidad: (slug: string, fecha: string, fechaFin?: string) =>
    apiFetch<DisponibilidadEstablecimientoResponse>(
      `/api/v1/publico/complejos/${encodeURIComponent(slug)}/disponibilidad${construirQuery(
        { fecha, fechaFin },
      )}`,
      { conAuth: false },
    ),
};
