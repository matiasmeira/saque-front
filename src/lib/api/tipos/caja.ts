import type {
  EstadoTurnoCaja,
  FechaHoraISO,
  MetodoPago,
  OrigenMovimientoCaja,
  TipoMovimientoCaja,
} from "./comunes";

/**
 * Turnos de caja y sus movimientos.
 *
 * El detalle que condiciona la UI: CajaAbiertaResponse trae los totales pero
 * NO la lista de movimientos. Esa lista sólo existe en
 * TurnoCajaDetalleResponse (GET /caja/turnos/{id}), que es OWNER/ADMIN — así
 * que un empleado con OPERAR_CAJA puede operar la caja pero no ver la tabla.
 */

export type AbrirCajaRequest = {
  /** @DecimalMin(0.0, inclusive=true): admite cero. */
  fondoInicial: number;
  dispositivoId?: number;
};

export type CerrarCajaRequest = {
  saldoRealContado: number;
  observaciones?: string;
};

/** Sin metodoPago: los movimientos manuales son SIEMPRE efectivo. */
export type MovimientoManualRequest = {
  tipo: TipoMovimientoCaja;
  /** @DecimalMin(0.0, inclusive=false): tiene que ser mayor a cero. */
  monto: number;
  descripcion: string;
};

export type TurnoCajaResponse = {
  id: number;
  establecimientoId: number;
  dispositivoCajaId: number | null;
  dispositivoCajaLabel: string | null;
  usuarioAperturaId: number;
  usuarioAperturaNombre: string;
  fechaApertura: FechaHoraISO;
  fondoInicial: number;
  estado: EstadoTurnoCaja;
  fechaCierre: FechaHoraISO | null;
  usuarioCierreId: number | null;
  usuarioCierreNombre: string | null;
  saldoTeoricoEfectivo: number | null;
  saldoRealContado: number | null;
  diferencia: number | null;
  observaciones: string | null;
};

export type MovimientoCajaResponse = {
  id: number;
  turnoCajaId: number;
  tipo: TipoMovimientoCaja;
  origen: OrigenMovimientoCaja;
  metodoPago: MetodoPago;
  monto: number;
  descripcion: string;
  /** Id de la reserva o venta que lo generó, según el origen. */
  referenciaId: number | null;
  fechaHora: FechaHoraISO;
  usuarioId: number;
  usuarioNombre: string;
};

/**
 * Las claves de los Map son valores de MetodoPago; en JSON llegan como strings
 * ({"EFECTIVO": 12000.00, ...}).
 */
export type CajaAbiertaResponse = {
  turno: TurnoCajaResponse;
  saldoTeoricoEfectivo: number;
  totalIngresosPorMetodoPago: Record<string, number>;
  totalEgresosPorMetodoPago: Record<string, number>;
};

export type CierreCajaResponse = {
  turnoId: number;
  establecimientoId: number;
  fechaCierre: FechaHoraISO;
  fondoInicial: number;
  saldoTeoricoEfectivo: number;
  saldoRealContado: number;
  /** saldoRealContado - saldoTeoricoEfectivo. */
  diferencia: number;
  resultado: "SOBRANTE" | "FALTANTE" | "EXACTO";
  observaciones: string | null;
};

export type TurnoCajaResumenResponse = {
  id: number;
  establecimientoId: number;
  fechaApertura: FechaHoraISO;
  fechaCierre: FechaHoraISO | null;
  estado: EstadoTurnoCaja;
  fondoInicial: number;
  saldoRealContado: number | null;
  diferencia: number | null;
  usuarioAperturaNombre: string;
};

export type TurnoCajaDetalleResponse = {
  turno: TurnoCajaResponse;
  movimientos: MovimientoCajaResponse[];
};

// --- Dispositivos ----------------------------------------------------------

export type ActivarLocalResponse = {
  dispositivoId: number;
  label: string;
};

export type EmparejarResponse = {
  /** El código crudo sólo se ve acá: el server guarda su hash. */
  codigo: string;
  expiraEn: FechaHoraISO;
  urlEmparejamiento: string;
};

export type ConsumirCodigoResponse = {
  establecimientoId: number;
  label: string;
};

export type DispositivoCajaResponse = {
  id: number;
  label: string;
  createdAt: FechaHoraISO;
  lastUsedAt: FechaHoraISO | null;
};
