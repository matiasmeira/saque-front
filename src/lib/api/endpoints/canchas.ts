import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type {
  BloqueoCanchaRequest,
  BloqueoCanchaResponse,
  CambiarEstadoCanchaRequest,
  CambiarEstadoCanchaResponse,
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
  /** incluirInactivas exige dueño/admin — ver CanchaController.obtenerCanchasPorEstablecimiento. */
  listar: (estId: number, incluirInactivas = false) =>
    apiFetch<CanchaResponse[]>(
      `/api/v1/establecimientos/${estId}/canchas${construirQuery({ incluirInactivas })}`,
    ),

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

  /**
   * PATCH /canchas/{id}/estado. Reemplaza al viejo DELETE (deprecado, delegaba
   * en la misma lógica de validarDesactivacion). Sólo lo usa el wizard de
   * onboarding para desactivar: el panel de canchas activa/desactiva con
   * `actualizar` porque ahí el switch "Cancha activa" viaja dentro del mismo
   * PUT que el resto del formulario.
   */
  cambiarEstado: (estId: number, canchaId: number, body: CambiarEstadoCanchaRequest) =>
    apiFetch<CambiarEstadoCanchaResponse>(
      `/api/v1/establecimientos/${estId}/canchas/${canchaId}/estado`,
      { method: "PATCH", body },
    ),

  /**
   * Baja lógica (deletedAt), irreversible. Sólo OWNER (ver CanchaController):
   * ni ADMIN ni EMPLOYEE, a diferencia del resto de los métodos de canchas.
   * El backend exige isActive=false antes de eliminar y rechaza si hay
   * reservas futuras CONFIRMADAS (400 con mensaje visible en ambos casos).
   */
  eliminar: (estId: number, canchaId: number) =>
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
