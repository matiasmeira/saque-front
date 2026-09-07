import type { Deporte, DiaSemanaBack, FechaHoraISO, FechaISO, HoraISO } from "./comunes";
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

/**
 * Fila del listado de series del establecimiento (TurnoFijoListadoResponse del backend):
 * los mismos campos de `TurnoFijoResponse` menos `ocurrencias` — traerlas de a una por fila
 * sería N+1 — más dos agregados que el backend resuelve en una sola consulta para toda la
 * página.
 */
export type TurnoFijoListadoResponse = {
  id: number;
  canchaId: number;
  canchaNombre: string;
  deporteSeleccionado: Deporte;
  diaSemana: DiaSemanaBack;
  horaInicio: HoraISO;
  horaFin: HoraISO;
  fechaInicioPeriodo: FechaISO;
  fechaFinPeriodo: FechaISO;
  estado: "ACTIVO" | "CANCELADO";
  canceladoDesde: FechaISO | null;
  jugadorId: number | null;
  jugadorNombre: string | null;
  nombreClienteManual: string | null;
  telefonoClienteManual: string | null;
  renovadoDesdeId: number | null;
  /** Ocurrencias futuras todavía vivas (CONFIRMADA/PENDIENTE_SENA), no el total histórico de la serie. */
  ocurrenciasActivas: number;
  proximaOcurrencia: FechaHoraISO | null;
};

/** `desde` opcional: si no viene, el backend corta la serie desde ahora. */
export type CancelarTurnoFijoRequest = {
  desde?: FechaISO;
};

/**
 * Resultado de cancelar una serie. `omitidas` no es cosmético: una ocurrencia FINALIZADA,
 * AUSENTE o ya cancelada nunca se vuelve a tocar, y si no se muestra el dueño cree que la
 * serie quedó de baja completa mientras esas ocurrencias siguen apareciendo en los reportes.
 *
 * `motivo` llega como el nombre crudo del enum EstadoReserva ("FINALIZADA", "AUSENTE",
 * "CANCELADA", "CANCELADA_PRERESERVA"): hay que traducirlo antes de mostrarlo.
 */
export type CancelacionTurnoFijoResponse = {
  canceladas: number;
  omitidas: { fecha: FechaHoraISO; motivo: string }[];
};
