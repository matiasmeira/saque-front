import type {
  Deporte,
  EstadoReserva,
  FechaHoraISO,
  MetodoPago,
} from "./comunes";

/**
 * DTOs de reserva (reserva/dto del backend).
 *
 * OJO con los tipos: `estado` y `metodoPago` viajan como String porque el
 * mapper los serializa con .name(), pero sus valores son los de los enums.
 * `deporteSeleccionado` sí va tipado como enum. En TS se tipan todos como
 * union: el JSON es idéntico.
 */

export type ReservaRequest = {
  canchaId: number;
  /** LocalDateTime sin zona: "2026-08-14T09:00:00". */
  fechaHoraInicio: FechaHoraISO;
  fechaHoraFin: FechaHoraISO;
  deporteSeleccionado: Deporte;
};

export type ReservaResponse = {
  id: number;
  /** null en reservas manuales de mostrador. */
  jugadorId: number | null;
  jugadorNombre: string | null;
  canchaId: number;
  canchaNombre: string;
  fechaHoraInicio: FechaHoraISO;
  fechaHoraFin: FechaHoraISO;
  estado: EstadoReserva;
  precioTotal: number;
  senaPagada: number;
  /** null en reservas de jugador; sólo se completan en las manuales. */
  nombreClienteManual: string | null;
  telefonoClienteManual: string | null;
  deporteSeleccionado: Deporte;
  /**
   * Vencimiento de la prereserva. Viene con valor sólo mientras el estado es
   * PENDIENTE_SENA: son 10 minutos desde que se creó. Si nadie confirma, un
   * job la pasa a CANCELADA_PRERESERVA.
   */
  expiraEn: FechaHoraISO | null;
  /** null hasta que la reserva se finaliza. */
  metodoPago: MetodoPago | null;
};

/**
 * Reserva de mostrador. A diferencia de ReservaRequest, el cliente puede no
 * tener cuenta: va como texto libre.
 */
export type ReservaManualRequest = {
  canchaId: number;
  fechaHoraInicio: FechaHoraISO;
  fechaHoraFin: FechaHoraISO;
  deporteSeleccionado: Deporte;
  nombreCliente: string;
  telefonoCliente?: string;
  senaFisicaRecibida?: boolean;
};

export type FinalizarReservaRequest = {
  metodoPago: MetodoPago;
};

export type MoverReservaRequest = {
  nuevaCanchaId: number;
};
