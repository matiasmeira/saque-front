import { partirFechaHora } from "@/lib/api/fechas";
import type { EstadoReserva } from "@/lib/api/tipos/comunes";
import type { ReservaResponse } from "@/lib/api/tipos/reservas";
import type { EstadoTurno, Turno } from "@/lib/panel/agenda";

/**
 * Traducción de ReservaResponse a la forma `Turno` que usan el timeline y el
 * detalle de la agenda.
 *
 * Igual que en canchas, se adapta en el borde para no reescribir el timeline
 * ni el detalle, que ya resuelven bien el layout por cancha y hora.
 *
 * Diferencias que hay que salvar:
 *
 *  - El cliente viene PLANO y en dos pares de campos según el origen:
 *    jugadorId/jugadorNombre en las reservas de jugador, o
 *    nombreClienteManual/telefonoClienteManual en las de mostrador. El mock
 *    tenía un objeto anidado `cliente`.
 *  - Una reserva de JUGADOR no trae teléfono: ReservaResponse no lo expone.
 *  - `senia` (el monto de la seña) no existe en la reserva: vive en la cancha
 *    (montoSena). Lo que sí viene es senaPagada, cuánto se pagó.
 *  - `turnoFijoId` viene con valor cuando la reserva es una ocurrencia de un
 *    turno fijo semanal, y null cuando es puntual. La serie completa se
 *    gestiona en /panel/turnos-fijos.
 */

/**
 * Los 6 estados del backend colapsan en los 4 que dibuja el timeline.
 *
 * FINALIZADA cae en "ocupado": el turno se jugó y ocupa la grilla igual. La
 * diferencia entre confirmada y finalizada se ve en el detalle, donde importa
 * (una finalizada ya no se puede cobrar).
 */
export function aEstadoTurno(estado: EstadoReserva): EstadoTurno {
  switch (estado) {
    case "PENDIENTE_SENA":
      return "pendiente";
    case "CANCELADA":
    case "CANCELADA_PRERESERVA":
      return "cancelado";
    case "AUSENTE":
      return "ausente";
    case "CONFIRMADA":
    case "FINALIZADA":
      return "ocupado";
  }
}

/** Turno + los campos del contrato real que el mock no tenía. */
export type TurnoConReserva = Turno & {
  /** Estado sin colapsar, para las acciones del detalle. */
  estadoReserva: EstadoReserva;
  esDeJugador: boolean;
  /** Id de la serie si el turno es una ocurrencia de un turno fijo; ver arriba. */
  turnoFijoId: number | null;
};

export function aTurno(reserva: ReservaResponse): TurnoConReserva {
  const { fecha, hora } = partirFechaHora(reserva.fechaHoraInicio);
  const { hora: horaFin } = partirFechaHora(reserva.fechaHoraFin);

  return {
    // El timeline usa el id como key de React; el backend usa Long.
    id: String(reserva.id),
    canchaId: reserva.canchaId,
    fecha,
    horaInicio: hora,
    horaFin,
    estado: aEstadoTurno(reserva.estado),
    cliente: {
      nombre: reserva.jugadorNombre ?? reserva.nombreClienteManual ?? "Sin nombre",
      // Las reservas de jugador no traen teléfono en el DTO.
      telefono: reserva.telefonoClienteManual ?? "",
    },
    monto: reserva.precioTotal,
    // El monto de la seña no está en la reserva (vive en la cancha); lo que
    // viene es cuánto se pagó.
    senia: reserva.senaPagada,
    seniaPagada: reserva.senaPagada > 0,
    estadoReserva: reserva.estado,
    esDeJugador: reserva.jugadorId !== null,
    turnoFijoId: reserva.turnoFijoId,
  };
}
