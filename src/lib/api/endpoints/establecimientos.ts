import { apiFetch } from "../cliente";
import type {
  EstablecimientoRequest,
  EstablecimientoResponse,
} from "../tipos/establecimientos";

/** EstablecimientoController — base /api/v1/establecimientos. OWNER / ADMIN. */
export const establecimientos = {
  /**
   * Los establecimientos del dueño autenticado. Es tambien la via por la que el
   * front obtiene el establecimientoId de un OWNER: /me lo devuelve null para
   * ese rol (solo lo completa para EMPLOYEE).
   *
   * No existe GET /api/v1/establecimientos/{id}.
   */
  mios: () => apiFetch<EstablecimientoResponse[]>("/api/v1/establecimientos"),

  crear: (body: EstablecimientoRequest) =>
    apiFetch<EstablecimientoResponse>("/api/v1/establecimientos", {
      method: "POST",
      body,
    }),

  actualizar: (id: number, body: EstablecimientoRequest) =>
    apiFetch<EstablecimientoResponse>(`/api/v1/establecimientos/${id}`, {
      method: "PUT",
      body,
    }),
};
