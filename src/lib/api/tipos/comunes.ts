/**
 * Tipos compartidos del contrato del backend (repo sacaladelangulo, branch test).
 *
 * Convencion: los nombres de campo espejan EXACTAMENTE los records de Java.
 * Si el DTO dice `cantidadCanchasNecesarias`, aca dice lo mismo. El renombrado
 * a nombres mas comodos, si hace falta, ocurre en el componente.
 *
 * Los campos opcionales se tipan `| null` y no con `?`: el back serializa la
 * clave con valor null, no la omite.
 */

export type { FechaISO, FechaHoraISO, HoraISO, DiaSemanaBack } from "../fechas";

/** Serializacion estandar de Spring Data `Page<T>`. */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

/** `Comparativo<T>` de los reportes: va por METRICA, no por reporte. */
export type Comparativo<T> = {
  actual: T;
  anterior: T;
};

export type RangoFechas = {
  desde: string;
  hasta: string;
};

// ---------------------------------------------------------------------------
// Enums — valores exactos del backend
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "OWNER" | "EMPLOYEE" | "PLAYER";

export type PlanSuscripcion = "TRIAL" | "FREE" | "PREMIUM";

export type EstadoReserva =
  | "PENDIENTE_SENA"
  | "CONFIRMADA"
  | "CANCELADA"
  | "CANCELADA_PRERESERVA"
  | "FINALIZADA"
  | "AUSENTE";

export type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "MERCADO_PAGO"
  | "TARJETA_DEBITO"
  | "TARJETA_CREDITO";

export type Deporte = "FUTBOL" | "PADEL" | "TENIS" | "HOCKEY" | "BASQUET" | "VOLEY";

export type Servicio =
  | "PARRILLA"
  | "VESTUARIOS"
  | "ESTACIONAMIENTO"
  | "BUFFET"
  | "WIFI"
  | "DUCHAS"
  | "KIOSCO";

export type PermisoEmpleado =
  | "CREAR_RESERVA_MANUAL"
  | "FINALIZAR_RESERVA"
  | "CANCELAR_RESERVA"
  | "MARCAR_AUSENTE"
  | "REGISTRAR_VENTA_BUFFET"
  | "FIJAR_COMENTARIO_DESTACADO"
  | "OPERAR_CAJA";

export type CategoriaGasto =
  | "ALQUILER"
  | "SERVICIOS"
  | "SUELDOS"
  | "INSUMOS"
  | "MANTENIMIENTO"
  | "IMPUESTOS"
  | "MARKETING"
  | "OTROS";

export type EstadoVenta = "CONFIRMADA" | "CANCELADA";

export type EstadoTurnoCaja = "ABIERTO" | "CERRADO";

export type TipoMovimientoCaja = "INGRESO" | "EGRESO";

export type OrigenMovimientoCaja = "RESERVA" | "VENTA_BUFFET" | "GASTO" | "MANUAL";

export type FranjaHoraria = "MANANA" | "TARDE" | "NOCHE";

// ---------------------------------------------------------------------------
// DTOs compartidos entre dominios
// ---------------------------------------------------------------------------

export type HorarioAtencionDto = {
  diaSemana: string;
  horaApertura: string;
  horaCierre: string;
};

export type FeedbackDestacadoDto = {
  feedbackId: number;
  puntuacion: number;
  comentario: string | null;
  jugadorNombre: string | null;
  fechaCreacion: string;
};

// ---------------------------------------------------------------------------
// Paginacion
// ---------------------------------------------------------------------------

/** Tope duro del backend (ReservaService.capPageSize). Pedir mas lo recorta en silencio. */
export const TAMANIO_PAGINA_MAXIMO = 100;

export type ParamsPaginacion = {
  page?: number;
  size?: number;
  sort?: string | string[];
};
