import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type {
  BloqueoCanchaRequest,
  BloqueoCanchaResponse,
  CanchaRequest,
  CanchaResponse,
} from "../tipos/canchas";

/**
 * CanchaController — /api/v1/establecimientos/{estId}/canchas. OWNER / ADMIN.
 *
 * Las tarifas viajan DENTRO de CanchaRequest: no hay endpoint granular para
 * editarlas. Cambiar una tarifa es leer la cancha, mutar el array y hacer un
 * PUT completo (ver /panel/precios).
 */
export const canchas = {
  listar: (estId: number) =>
    apiFetch<CanchaResponse[]>(`/api/v1/establecimientos/${estId}/canchas`),

  crear: (estId: number, body: CanchaRequest) =>
    apiFetch<CanchaResponse>(`/api/v1/establecimientos/${estId}/canchas`, {
      method: "POST",
      body,
    }),

  actualizar: (estId: number, canchaId: number, body: CanchaRequest) =>
    apiFetch<CanchaResponse>(`/api/v1/establecimientos/${estId}/canchas/${canchaId}`, {
      method: "PUT",
      body,
    }),

  /** 204. Desactiva (isActive = false), no borra: las reservas históricas la siguen referenciando. */
  desactivar: (estId: number, canchaId: number) =>
    apiFetch<void>(`/api/v1/establecimientos/${estId}/canchas/${canchaId}`, {
      method: "DELETE",
    }),
};

/**
 * BloqueoCanchaController. No tiene @RequestMapping de clase: cada método
 * declara su path completo, y por eso el listado por establecimiento cuelga de
 * una ruta distinta a la de creación.
 */
export const bloqueos = {
  deCancha: (estId: number, canchaId: number) =>
    apiFetch<BloqueoCanchaResponse[]>(
      `/api/v1/establecimientos/${estId}/canchas/${canchaId}/bloqueos`,
    ),

  crear: (estId: number, canchaId: number, body: BloqueoCanchaRequest) =>
    apiFetch<BloqueoCanchaResponse>(
      `/api/v1/establecimientos/${estId}/canchas/${canchaId}/bloqueos`,
      { method: "POST", body },
    ),

  eliminar: (estId: number, canchaId: number, bloqueoId: number) =>
    apiFetch<void>(
      `/api/v1/establecimientos/${estId}/canchas/${canchaId}/bloqueos/${bloqueoId}`,
      { method: "DELETE" },
    ),

  /** Todos los bloqueos del establecimiento en una fecha. Lo usa la agenda. */
  delDia: (estId: number, fecha: string) =>
    apiFetch<BloqueoCanchaResponse[]>(
      `/api/v1/establecimientos/${estId}/bloqueos${construirQuery({ fecha })}`,
    ),
};
