import { apiFetch, nuevaIdempotencyKey } from "../cliente";
import { construirQuery } from "../query";
import type { EstadoReserva, Page, ParamsPaginacion } from "../tipos/comunes";
import type {
  FinalizarReservaRequest,
  MoverReservaRequest,
  ReservaManualRequest,
  ReservaRequest,
  ReservaResponse,
} from "../tipos/reservas";

/** ReservaController — base /api/v1/reservas. */
export const reservas = {
  /**
   * Crea la prereserva. Nace en PENDIENTE_SENA con expiraEn = ahora + 10 min.
   *
   * Manda Idempotency-Key: el backend protege este POST (junto con /manual,
   * /semanal y /buffet/ventas) para que un doble submit o un reintento no
   * generen dos reservas. Un replay devuelve el mismo 201 con el header
   * Idempotency-Replayed: true.
   *
   * Errores esperables, verificados contra la API:
   *   400 — "La cancha exacta ya está reservada en ese horario". Es el caso
   *         COMÚN de doble booking: el service lo detecta antes de insertar.
   *         El 409 de conflicto de concurrencia queda sólo para la carrera
   *         que llega hasta el constraint de exclusión de Postgres.
   *   400 — fuera de los 31 días de anticipación, o duración no permitida
   *   403 — el jugador está bloqueado en ese establecimiento
   *
   * En todos los casos el backend manda un mensaje mostrable, así que la UI
   * usa mensajeVisible(error) en vez de traducir por status.
   */
  crear: (body: ReservaRequest) =>
    apiFetch<ReservaResponse>("/api/v1/reservas", {
      method: "POST",
      body,
      idempotencyKey: nuevaIdempotencyKey(),
    }),

  /**
   * Reservas del jugador autenticado. Sólo rol PLAYER: un OWNER recibe 403.
   * Por defecto vienen las más recientes primero.
   */
  mias: ({
    estado,
    page = 0,
    size = 10,
    sort = "fechaHoraInicio,desc",
  }: ParamsPaginacion & { estado?: EstadoReserva } = {}) =>
    apiFetch<Page<ReservaResponse>>(
      `/api/v1/reservas/mis-reservas${construirQuery({ estado, page, size, sort })}`,
    ),

  /**
   * Cancela. El backend valida el plazo contra
   * Establecimiento.horasCancelacionAntesPartido (default 24 h) con una
   * ventana de gracia de 30 min desde que se creó. Ninguno de esos dos
   * valores se expone en un DTO, así que el front no puede anticipar la
   * respuesta: muestra el botón y maneja el 400.
   */
  cancelar: (id: number) =>
    apiFetch<ReservaResponse>(`/api/v1/reservas/${id}/cancelar`, { method: "PUT" }),

  // --- Panel (OWNER / ADMIN / EMPLOYEE) -------------------------------------

  /** Agenda del día. `fecha` es un único día y es obligatoria. */
  porEstablecimiento: (
    estId: number,
    fecha: string,
    { incluirCanceladas = false, size = 100 } = {},
  ) =>
    apiFetch<Page<ReservaResponse>>(
      `/api/v1/reservas/establecimiento/${estId}${construirQuery({
        fecha,
        incluirCanceladas,
        size,
      })}`,
    ),

  /** Nace en CONFIRMADA, con expiraEn null: no pasa por el hold de 10 minutos. */
  crearManual: (body: ReservaManualRequest) =>
    apiFetch<ReservaResponse>("/api/v1/reservas/manual", {
      method: "POST",
      body,
      idempotencyKey: nuevaIdempotencyKey(),
    }),

  /**
   * Cierra el turno registrando con qué se pagó. metodoPago es @NotNull, así
   * que la UI necesita pedirlo sí o sí antes de llamar acá.
   * Falla si la reserva sigue en PENDIENTE_SENA o si está cancelada.
   */
  finalizar: (id: number, body: FinalizarReservaRequest) =>
    apiFetch<ReservaResponse>(`/api/v1/reservas/${id}/finalizar`, {
      method: "PATCH",
      body,
    }),

  /** Sólo desde CONFIRMADA y sólo si el turno YA empezó. */
  marcarAusente: (id: number) =>
    apiFetch<ReservaResponse>(`/api/v1/reservas/${id}/ausente`, { method: "PATCH" }),

  /** Sólo desde AUSENTE, y sólo OWNER/ADMIN (un empleado no puede revertir). */
  revertirAusencia: (id: number) =>
    apiFetch<ReservaResponse>(`/api/v1/reservas/${id}/revertir-ausencia`, {
      method: "PATCH",
    }),

  /** Sólo desde PENDIENTE_SENA o CONFIRMADA, y a una cancha del mismo establecimiento. */
  moverCancha: (id: number, body: MoverReservaRequest) =>
    apiFetch<ReservaResponse>(`/api/v1/reservas/${id}/mover-cancha`, {
      method: "PUT",
      body,
    }),
};
