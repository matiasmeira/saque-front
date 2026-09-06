import { apiFetch, nuevaIdempotencyKey } from "../cliente";
import type { ReservaSemanalRequest } from "../tipos/reservas";
import type { TurnoFijoResponse } from "../tipos/turnos-fijos";

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
};
