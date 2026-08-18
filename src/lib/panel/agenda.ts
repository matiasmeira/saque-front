/**
 * La forma con la que trabajan las pantallas de la agenda del panel.
 *
 * NO es el DTO del backend: `ReservaResponse` trae el cliente plano y en dos
 * pares de campos según el origen, seis estados en vez de cuatro, y un id
 * numérico. La traducción vive en `src/lib/api/adaptadores/agenda.ts`, que es
 * el único lugar que conoce las dos formas.
 *
 * Existe este tipo intermedio y no se consume el DTO directo porque el timeline
 * y el detalle ya resuelven bien el layout por cancha y hora sobre esta forma;
 * reescribirlos no compraba nada.
 *
 * Era `src/mocks/agenda.ts`, que además generaba turnos falsos. De ahí sólo
 * quedó esto: los tipos.
 */

export type BloqueoDelDia = { horaInicio: string; horaFin: string; motivo?: string };

/** Los 6 estados de `EstadoReserva` colapsados en los 4 que dibuja el timeline. */
export type EstadoTurno = "ocupado" | "pendiente" | "cancelado" | "ausente";

export type EstadoComplejo = "borrador" | "publicado" | "despublicado" | "suspendido";

export type Turno = {
  /** El backend usa Long; acá es string porque además es la key de React. */
  id: string;
  canchaId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  cliente: { nombre: string; telefono: string };
  monto: number;
  /** Cuánto se pagó de seña, no cuánto vale: el monto vive en la cancha. */
  senia: number;
  seniaPagada: boolean;
};
