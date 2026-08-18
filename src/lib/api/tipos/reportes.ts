import type {
  CategoriaGasto,
  Comparativo,
  DiaSemanaBack,
  FechaHoraISO,
  FechaISO,
  FranjaHoraria,
  MetodoPago,
  RangoFechas,
} from "./comunes";

/**
 * ReporteController — /api/v1/establecimientos/{estId}/reportes/*.
 *
 * Son SIETE respuestas independientes, no un reporte monolítico. Y el detalle
 * que rompe el modelo que tenía el front: el `Comparativo<T>` está al nivel de
 * CADA MÉTRICA, no al nivel del reporte. O sea `totalFacturado: Comparativo<number>`
 * dentro de una única `FacturacionReporteResponse`, y no un
 * `Comparativo<FacturacionReporteResponse>` como estaba mockeado.
 *
 * Los porcentajes vienen en escala 0–100 con DOS DECIMALES (ReporteOcupacionService
 * hace `x * 100 / y` con `setScale(2, HALF_UP)`), así que llegan valores como
 * 43.75. Redondear es cosa de la vista.
 *
 * Facturación, ocupación, horarios y clientes cuentan SOLO reservas FINALIZADA.
 */

// ---------------------------------------------------------------------------
// Facturación
// ---------------------------------------------------------------------------

export type DesglosePorMetodoPagoDto = {
  metodoPago: MetodoPago;
  monto: Comparativo<number>;
  cantidadReservas: Comparativo<number>;
};

/**
 * Un punto PAREADO de la serie: ya trae el día N del período actual junto al
 * día N del anterior. No hay dos series que haya que alinear en el front — los
 * dos rangos tienen igual duración por diseño del backend.
 */
export type PuntoFacturacionDiariaDto = {
  diaIndice: number;
  fechaActual: FechaISO;
  montoActual: number;
  fechaAnterior: FechaISO;
  montoAnterior: number;
};

export type FacturacionReporteResponse = {
  periodoActual: RangoFechas;
  periodoAnterior: RangoFechas;
  totalFacturado: Comparativo<number>;
  desglosePorMetodoPago: DesglosePorMetodoPagoDto[];
  serieTemporal: PuntoFacturacionDiariaDto[];
};

// ---------------------------------------------------------------------------
// Ocupación
// ---------------------------------------------------------------------------

export type OcupacionPorFranjaDto = {
  franja: FranjaHoraria;
  porcentajeOcupacion: Comparativo<number>;
  horasReservadas: Comparativo<number>;
  horasDisponibles: Comparativo<number>;
};

export type OcupacionPorCanchaDto = {
  canchaId: number;
  canchaNombre: string;
  porcentajeOcupacion: Comparativo<number>;
  horasReservadas: Comparativo<number>;
  horasDisponibles: Comparativo<number>;
};

export type OcupacionReporteResponse = {
  periodoActual: RangoFechas;
  periodoAnterior: RangoFechas;
  porcentajeOcupacionGeneral: Comparativo<number>;
  ocupacionPorFranja: OcupacionPorFranjaDto[];
  ocupacionPorCancha: OcupacionPorCanchaDto[];
  /** Texto del backend explicando cómo calculó las horas disponibles. Se muestra tal cual. */
  notaMetodologica: string;
};

// ---------------------------------------------------------------------------
// Horarios más pedidos — ranking, sin comparativo
// ---------------------------------------------------------------------------

export type HorarioPedidoDto = {
  diaSemana: DiaSemanaBack;
  /** Hora del día como entero: 20 = las 20:00. No es un LocalTime. */
  hora: number;
  cantidadReservas: number;
};

export type HorariosPedidosReporteResponse = {
  periodo: RangoFechas;
  /** Ya viene ordenado desc por cantidad desde el backend. */
  ranking: HorarioPedidoDto[];
};

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

/**
 * `disponible` hoy siempre llega en true (ReporteClientesService lo construye
 * fijo), pero el campo sigue en el contrato y el front contempla el false: si
 * alguna vez la métrica deja de calcularse, `motivoNoDisponible` explica por qué.
 */
export type AusenciasInfo = {
  disponible: boolean;
  total: number | null;
  motivoNoDisponible: string | null;
};

export type TopClienteDto = {
  jugadorId: number;
  nombre: string;
  cantidadReservas: number;
  ausencias: number;
};

/**
 * Ojo con el alcance: tanto `clientesNuevos` como `topClientes` salen de queries
 * con `r.jugador IS NOT NULL` (ReservaRepository), o sea que cuentan SOLO a los
 * jugadores registrados. Las reservas manuales cargadas desde el mostrador no
 * entran en ninguno de los dos. `ausencias`, en cambio, cuenta todas.
 */
export type ClientesReporteResponse = {
  periodoActual: RangoFechas;
  periodoAnterior: RangoFechas;
  clientesNuevos: Comparativo<number>;
  /** No es un Comparativo: no hay dato del período anterior para las ausencias. */
  ausencias: AusenciasInfo;
  topClientes: TopClienteDto[];
};

// ---------------------------------------------------------------------------
// Gastos y resultado
// ---------------------------------------------------------------------------

export type DesglosePorCategoriaDto = {
  categoria: CategoriaGasto;
  monto: Comparativo<number>;
  cantidad: Comparativo<number>;
};

export type PuntoGastoDiariaDto = {
  diaIndice: number;
  fechaActual: FechaISO;
  montoActual: number;
  fechaAnterior: FechaISO;
  montoAnterior: number;
};

export type GastosReporteResponse = {
  periodoActual: RangoFechas;
  periodoAnterior: RangoFechas;
  totalGastado: Comparativo<number>;
  desglosePorCategoria: DesglosePorCategoriaDto[];
  serieTemporal: PuntoGastoDiariaDto[];
};

export type ResultadoReporteResponse = {
  periodoActual: RangoFechas;
  periodoAnterior: RangoFechas;
  totalFacturado: Comparativo<number>;
  totalGastos: Comparativo<number>;
  neto: Comparativo<number>;
};

// ---------------------------------------------------------------------------
// Diferencias de caja
// ---------------------------------------------------------------------------

export type TurnoCajaResumenDto = {
  turnoCajaId: number;
  fechaApertura: FechaHoraISO;
  fechaCierre: FechaHoraISO;
  saldoTeoricoEfectivo: number;
  saldoRealContado: number;
  /** Positiva = sobrante, negativa = faltante. */
  diferencia: number;
};

export type CierreCajaReporteResponse = {
  periodo: RangoFechas;
  turnos: TurnoCajaResumenDto[];
  /** Ambos acumulados llegan como valores POSITIVOS, aunque el faltante sea una resta. */
  faltanteAcumulado: number;
  sobranteAcumulado: number;
};
