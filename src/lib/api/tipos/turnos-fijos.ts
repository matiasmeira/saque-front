import type { Deporte, DiaSemanaBack, FechaISO, HoraISO } from "./comunes";
import type { ReservaResponse } from "./reservas";

/**
 * DTO de turno fijo (turnofijo/dto del backend).
 *
 * Antes el alta de un turno fijo semanal devolvía `ReservaResponse[]`: N
 * reservas sueltas sin marca de pertenencia a una serie. Ahora la serie es una
 * entidad propia, con su propio ciclo de vida (ACTIVO/CANCELADO), y el alta
 * devuelve UNA regla con sus ocurrencias adentro.
 */
export type TurnoFijoResponse = {
  id: number;
  canchaId: number;
  canchaNombre: string;
  deporteSeleccionado: Deporte;
  diaSemana: DiaSemanaBack;
  /** LocalTime: "20:00:00". */
  horaInicio: HoraISO;
  horaFin: HoraISO;
  fechaInicioPeriodo: FechaISO;
  fechaFinPeriodo: FechaISO;
  estado: "ACTIVO" | "CANCELADO";
  /** Fecha desde la que la serie deja de generar ocurrencias, o null si sigue activa. */
  canceladoDesde: FechaISO | null;
  /** null en series de mostrador. */
  jugadorId: number | null;
  jugadorNombre: string | null;
  nombreClienteManual: string | null;
  telefonoClienteManual: string | null;
  /** Id de la serie anterior si ésta nació de una renovación, o null. */
  renovadoDesdeId: number | null;
  /** Las reservas ya creadas para el período, en orden cronológico. */
  ocurrencias: ReservaResponse[];
};
