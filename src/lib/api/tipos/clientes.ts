import type { FechaHoraISO } from "./comunes";

/**
 * ClienteController — /api/v1/establecimientos/{estId}/clientes. OWNER / ADMIN.
 *
 * El padrón NO es la libreta de contactos del complejo: son los jugadores
 * REGISTRADOS con alguna reserva en este establecimiento
 * (`jugadorIdsDelEstablecimiento` filtra `r.jugador IS NOT NULL`). Una reserva
 * cargada a mano desde el mostrador no crea ningún cliente acá — no hay a quién
 * atribuirla. Es el mismo criterio del reporte de clientes.
 *
 * Qué cuenta cada número (ReservaRepository, mismo criterio que los reportes):
 *  - `reservasTotales`, `totalGastado`, `ultimaReserva` → SOLO reservas FINALIZADA.
 *  - `ausencias` → SOLO reservas AUSENTE.
 * Alguien que reservó y todavía no jugó aparece en la lista con los tres
 * primeros en cero y `ultimaReserva` en null.
 */
export type ClienteResponse = {
  jugadorId: number;
  nombre: string;
  /** Del Usuario, no de la reserva: es null mientras no lo haya cargado. */
  telefono: string | null;
  email: string;
  reservasTotales: number;
  /** null si todavía no tiene ninguna reserva FINALIZADA. */
  ultimaReserva: FechaHoraISO | null;
  ausencias: number;
  totalGastado: number;
  bloqueado: boolean;
};

export type ClienteDetalleResponse = {
  cliente: ClienteResponse;
  /** Sólo si está bloqueado, y sólo si el dueño cargó un motivo al bloquearlo. */
  motivoBloqueo: string | null;
  fechaPrimeraReserva: FechaHoraISO | null;
};

/**
 * Campos por los que el backend acepta ordenar el padrón (`ClienteService.
 * comparadorDeCampo`). Cualquier otro dispara IllegalArgumentException → 400,
 * así que el union type no es decorativo: es lo que evita el 400.
 */
export type OrdenCliente = "nombre" | "ultimaReserva" | "reservasTotales" | "ausencias";

// ---------------------------------------------------------------------------
// BloqueoJugadorController — .../{estId}/jugadores-bloqueados
// ---------------------------------------------------------------------------

export type BloqueoJugadorRequest = {
  jugadorId: number;
  /** Máximo 255 caracteres. Opcional. */
  motivo?: string;
};

export type BloqueoJugadorResponse = {
  id: number;
  jugadorId: number;
  jugadorNombre: string;
  jugadorEmail: string;
  motivo: string | null;
  fechaBloqueo: FechaHoraISO;
};
