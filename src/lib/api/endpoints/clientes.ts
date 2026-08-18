import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type { Page } from "../tipos/comunes";
import type {
  BloqueoJugadorRequest,
  BloqueoJugadorResponse,
  ClienteDetalleResponse,
  ClienteResponse,
  OrdenCliente,
} from "../tipos/clientes";
import type { ReservaResponse } from "../tipos/reservas";

/** ClienteController — /api/v1/establecimientos/{estId}/clientes. OWNER / ADMIN. */
export const clientes = {
  /**
   * Padrón paginado. `buscar` matchea nombre, teléfono O email (contains, sin
   * distinguir mayúsculas) y lo resuelve el backend: no filtrar del lado del
   * cliente, que sólo vería la página actual.
   *
   * `soloBloqueados` en false se comporta igual que no mandarlo (el service
   * chequea `TRUE.equals(...)`), así que se manda sólo cuando es true.
   *
   * El `sort` acepta únicamente los cuatro campos de `OrdenCliente`; cualquier
   * otro es un 400. Sin sort, el backend ordena por nombre.
   */
  listar: (
    estId: number,
    { buscar, soloBloqueados, orden, direccion, page = 0, size = 20 }: {
      buscar?: string;
      soloBloqueados?: boolean;
      orden?: OrdenCliente;
      direccion?: "asc" | "desc";
      page?: number;
      size?: number;
    } = {},
  ) =>
    apiFetch<Page<ClienteResponse>>(
      `/api/v1/establecimientos/${estId}/clientes${construirQuery({
        buscar,
        soloBloqueados: soloBloqueados === true ? true : undefined,
        sort: orden ? `${orden},${direccion ?? "asc"}` : undefined,
        page,
        size,
      })}`,
    ),

  /** 404 si ese jugador no tiene ninguna reserva en este establecimiento. */
  detalle: (estId: number, jugadorId: number) =>
    apiFetch<ClienteDetalleResponse>(
      `/api/v1/establecimientos/${estId}/clientes/${jugadorId}`,
    ),

  /**
   * Historial completo del cliente en este establecimiento: viene ordenado por
   * fechaHoraInicio desc e incluye TODOS los estados, canceladas incluidas (la
   * query derivada no filtra por estado).
   */
  reservas: (estId: number, jugadorId: number, { page = 0, size = 20 } = {}) =>
    apiFetch<Page<ReservaResponse>>(
      `/api/v1/establecimientos/${estId}/clientes/${jugadorId}/reservas${construirQuery({ page, size })}`,
    ),
};

/**
 * BloqueoJugadorController — .../{estId}/jugadores-bloqueados. OWNER / ADMIN.
 *
 * Vive acá y no en endpoints/establecimientos.ts porque bloquear es una acción
 * sobre un cliente: es la ficha del cliente la que la dispara.
 */
export const jugadoresBloqueados = {
  listar: (estId: number) =>
    apiFetch<BloqueoJugadorResponse[]>(
      `/api/v1/establecimientos/${estId}/jugadores-bloqueados`,
    ),

  /** 201. */
  bloquear: (estId: number, body: BloqueoJugadorRequest) =>
    apiFetch<BloqueoJugadorResponse>(
      `/api/v1/establecimientos/${estId}/jugadores-bloqueados`,
      { method: "POST", body },
    ),

  /** 204. Se borra por jugadorId, no por id del bloqueo. */
  desbloquear: (estId: number, jugadorId: number) =>
    apiFetch<void>(
      `/api/v1/establecimientos/${estId}/jugadores-bloqueados/${jugadorId}`,
      { method: "DELETE" },
    ),
};
