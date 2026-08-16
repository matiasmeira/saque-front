import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type { Page } from "../tipos/comunes";
import type {
  AbrirCajaRequest,
  ActivarLocalResponse,
  CajaAbiertaResponse,
  CerrarCajaRequest,
  CierreCajaResponse,
  ConsumirCodigoResponse,
  DispositivoCajaResponse,
  EmparejarResponse,
  MovimientoCajaResponse,
  MovimientoManualRequest,
  TurnoCajaDetalleResponse,
  TurnoCajaResponse,
  TurnoCajaResumenResponse,
} from "../tipos/caja";

/** CierreCajaController — /api/v1/establecimientos/{estId}/caja. */
export const caja = {
  /** OWNER, ADMIN o EMPLOYEE con OPERAR_CAJA. */
  abrir: (estId: number, body: AbrirCajaRequest) =>
    apiFetch<TurnoCajaResponse>(`/api/v1/establecimientos/${estId}/caja/abrir`, {
      method: "POST",
      body,
    }),

  /** El turno abierto con sus totales. NO incluye la lista de movimientos. */
  abierta: (estId: number) =>
    apiFetch<CajaAbiertaResponse>(`/api/v1/establecimientos/${estId}/caja/abierta`),

  registrarMovimiento: (estId: number, body: MovimientoManualRequest) =>
    apiFetch<MovimientoCajaResponse>(
      `/api/v1/establecimientos/${estId}/caja/movimientos`,
      { method: "POST", body },
    ),

  /**
   * Devuelve el arqueo completo. Conviene renderizar el ticket con ESTA
   * respuesta: releerlo después es GET /caja/turnos/{id}, que es OWNER/ADMIN,
   * así que un empleado que cierre la caja no podría volver a verlo.
   */
  cerrar: (estId: number, turnoId: number, body: CerrarCajaRequest) =>
    apiFetch<CierreCajaResponse>(
      `/api/v1/establecimientos/${estId}/caja/${turnoId}/cerrar`,
      { method: "POST", body },
    ),

  /** Historial de turnos. Sólo OWNER/ADMIN. */
  turnos: (estId: number, { page = 0, size = 20 } = {}) =>
    apiFetch<Page<TurnoCajaResumenResponse>>(
      `/api/v1/establecimientos/${estId}/caja/turnos${construirQuery({ page, size })}`,
    ),

  /** Turno + sus movimientos. Sólo OWNER/ADMIN. */
  turno: (estId: number, turnoId: number) =>
    apiFetch<TurnoCajaDetalleResponse>(
      `/api/v1/establecimientos/${estId}/caja/turnos/${turnoId}`,
    ),
};

/** DispositivoCajaController + CajaPublicoController. */
export const dispositivos = {
  /** Marca ESTA computadora como caja de confianza. Setea la cookie. OWNER/ADMIN. */
  activarLocal: (estId: number, label?: string) =>
    apiFetch<ActivarLocalResponse>(
      `/api/v1/establecimientos/${estId}/caja/dispositivos/activar-local`,
      { method: "POST", body: { label }, conCookieDispositivo: true },
    ),

  /** Genera el código para emparejar OTRA computadora. El crudo sólo se ve acá. */
  generarCodigo: (estId: number, label?: string) =>
    apiFetch<EmparejarResponse>(
      `/api/v1/establecimientos/${estId}/caja/dispositivos/emparejar`,
      { method: "POST", body: { label } },
    ),

  listar: (estId: number) =>
    apiFetch<DispositivoCajaResponse[]>(
      `/api/v1/establecimientos/${estId}/caja/dispositivos`,
    ),

  revocar: (estId: number, dispositivoId: number) =>
    apiFetch<void>(
      `/api/v1/establecimientos/${estId}/caja/dispositivos/${dispositivoId}`,
      { method: "DELETE" },
    ),

  /**
   * Canjea el código en la computadora que se quiere emparejar. PÚBLICO: es el
   * paso donde esa PC todavía no tiene ninguna credencial. Setea la cookie, así
   * que necesita credentials: 'include'.
   */
  emparejar: (codigo: string) =>
    apiFetch<ConsumirCodigoResponse>("/api/v1/caja/emparejar", {
      method: "POST",
      body: { codigo },
      conAuth: false,
      conCookieDispositivo: true,
    }),
};

/**
 * Nombres de los empleados activos para la pantalla de mostrador.
 *
 * No lleva JWT a propósito: cuando el kiosco muestra la lista todavía no hay
 * ninguna sesión abierta. Lo que autoriza es la cookie del dispositivo de
 * confianza, que además ata el pedido a SU establecimiento.
 */
export const mostrador = {
  empleadosActivos: (estId: number) =>
    apiFetch<{ id: number; nombre: string }[]>(
      `/api/v1/establecimientos/${estId}/empleados/activos`,
      { conAuth: false, conCookieDispositivo: true },
    ),
};
