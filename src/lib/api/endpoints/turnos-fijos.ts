import { apiFetch, nuevaIdempotencyKey } from "../cliente";
import { construirQuery } from "../query";
import type { Page } from "../tipos/comunes";
import type { ReservaSemanalRequest } from "../tipos/reservas";
import type {
  CancelacionTurnoFijoResponse,
  CancelarTurnoFijoRequest,
  EditarClienteTurnoFijoRequest,
  TurnoFijoListadoResponse,
  TurnoFijoResponse,
} from "../tipos/turnos-fijos";

/** TurnoFijoController — base /api/v1/turnos-fijos. */
export const turnosFijos = {
  /**
   * Crea la serie: la regla más una reserva CONFIRMADA por cada fecha del
   * período que cae en `diaSemana`. Devuelve la regla con sus ocurrencias.
   *
   * TODO-O-NADA: si una sola fecha choca no se crea ninguna y el 400 dice cuál.
   * Idempotency-Key es OBLIGATORIA: sin ella el back responde 400 sin crear nada.
   */
  crear: (body: ReservaSemanalRequest) =>
    apiFetch<TurnoFijoResponse>("/api/v1/turnos-fijos", {
      method: "POST",
      body,
      idempotencyKey: nuevaIdempotencyKey(),
    }),

  /**
   * Listado paginado de series del establecimiento. `establecimientoId` es
   * obligatorio; sin `estado`, el backend trae sólo las ACTIVO.
   */
  listar: (
    estId: number,
    { estado, page = 0, size = 20 }: { estado?: "ACTIVO" | "CANCELADO"; page?: number; size?: number } = {},
  ) =>
    apiFetch<Page<TurnoFijoListadoResponse>>(
      `/api/v1/turnos-fijos${construirQuery({ establecimientoId: estId, estado, page, size })}`,
    ),

  /**
   * Da de baja la serie desde `desde` (o desde ahora si se omite el body).
   * Sólo OWNER/ADMIN: un empleado recibe 403 aunque tenga permisos
   * operativos de reserva. No lleva Idempotency-Key: la ruta no está entre
   * las protegidas por el filtro (sólo el alta mueve plata).
   */
  cancelar: (id: number, body: CancelarTurnoFijoRequest = {}) =>
    apiFetch<CancelacionTurnoFijoResponse>(`/api/v1/turnos-fijos/${id}/cancelar`, {
      method: "POST",
      body,
    }),

  /**
   * Crea la serie del año siguiente a partir de ésta. Sin body: el backend calcula el
   * período (ver inicioDeRenovacion en lib/panel/turno-fijo.ts) y repite cancha, horario,
   * día y cliente. TODO-O-NADA igual que el alta: si una fecha choca no se crea ninguna.
   *
   * 400 esperable si la serie ya fue renovada o está cancelada. Sólo OWNER/ADMIN.
   */
  renovar: (id: number) =>
    apiFetch<TurnoFijoResponse>(`/api/v1/turnos-fijos/${id}/renovar`, {
      method: "POST",
    }),

  /**
   * Cambia nombre y teléfono del cliente de mostrador de la serie. Sólo tiene sentido
   * cuando `jugadorId` es null: si la serie está atada a un jugador, el backend responde
   * 400 porque el nombre sale de su cuenta. Sólo OWNER/ADMIN.
   */
  editarCliente: (id: number, body: EditarClienteTurnoFijoRequest) =>
    apiFetch<TurnoFijoResponse>(`/api/v1/turnos-fijos/${id}/cliente`, {
      method: "PATCH",
      body,
    }),
};
