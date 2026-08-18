"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { bloqueos as endpointBloqueos } from "@/lib/api/endpoints/canchas";
import { reservas as endpointReservas } from "@/lib/api/endpoints/reservas";
import { keys } from "@/lib/api/keys";
import { aTurno, type TurnoConReserva } from "@/lib/api/adaptadores/agenda";
import { partirFechaHora } from "@/lib/api/fechas";
import type { BloqueoDelDia } from "@/lib/panel/agenda";
import type { MetodoPago } from "@/lib/api/tipos/comunes";
import type { ReservaManualRequest } from "@/lib/api/tipos/reservas";

/**
 * Datos y acciones de la agenda.
 *
 * El backend expone la agenda por DÍA: `fecha` es un único día y obligatorio.
 * La vista semanal necesita entonces 7 requests, que useQueries emite en
 * paralelo en vez de encadenarlas.
 *
 * Se pide size=100 explícito: el default es 10 y un día con varias canchas lo
 * supera fácil. 100 es además el tope duro del backend (capPageSize), así que
 * pedir más no sirve de nada.
 */
export function useAgenda(estId: number | null, fechas: string[]) {
  const consultas = useQueries({
    queries: fechas.map((fecha) => ({
      queryKey: keys.reservas.porEstablecimiento(estId ?? 0, fecha),
      queryFn: () => endpointReservas.porEstablecimiento(estId!, fecha),
      enabled: estId !== null,
    })),
  });

  const consultasBloqueos = useQueries({
    queries: fechas.map((fecha) => ({
      queryKey: keys.bloqueos.delEstablecimiento(estId ?? 0, fecha),
      queryFn: () => endpointBloqueos.delDia(estId!, fecha),
      enabled: estId !== null,
    })),
  });

  const turnosPorFecha: Record<string, TurnoConReserva[]> = {};
  fechas.forEach((fecha, i) => {
    turnosPorFecha[fecha] = (consultas[i]?.data?.content ?? []).map(aTurno);
  });

  /**
   * El timeline dibuja franjas dentro de un día, así que necesita horas
   * sueltas; el backend devuelve LocalDateTime completos. `canchaId` se
   * conserva para poder filtrar por columna.
   */
  const bloqueosPorFecha: Record<string, (BloqueoDelDia & { canchaId: number })[]> = {};
  fechas.forEach((fecha, i) => {
    bloqueosPorFecha[fecha] = (consultasBloqueos[i]?.data ?? []).map((b) => ({
      canchaId: b.canchaId,
      horaInicio: partirFechaHora(b.fechaInicio).hora,
      horaFin: partirFechaHora(b.fechaFin).hora,
      motivo: b.motivo ?? undefined,
    }));
  });

  return {
    turnosPorFecha,
    bloqueosPorFecha,
    cargando: consultas.some((c) => c.isPending),
    error: consultas.find((c) => c.isError)?.error ?? null,
    refetch: () => consultas.forEach((c) => c.refetch()),
  };
}

/**
 * Las seis acciones sobre una reserva. Todas invalidan ["reservas"] entero:
 * la agenda puede tener 7 días montados y no vale la pena razonar cuál cambió.
 *
 * Notas de contrato que condicionan la UI:
 *  - finalizar exige metodoPago (@NotNull): hay que pedirlo antes de llamar.
 *  - marcarAusente sólo funciona desde CONFIRMADA y si el turno YA empezó.
 *  - revertirAusencia es OWNER/ADMIN: un empleado recibe 403.
 *  - moverCancha sólo desde PENDIENTE_SENA o CONFIRMADA.
 */
export function useAccionesReserva() {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: keys.reservas.todas() });
    // Finalizar mueve la caja: si hay un turno abierto, su saldo cambió.
    queryClient.invalidateQueries({ queryKey: ["caja"] });
    // Cualquiera de estas acciones ocupa o libera un slot, y el form de carga
    // rápida ofrece horarios leídos de la grilla de disponibilidad.
    queryClient.invalidateQueries({ queryKey: ["disponibilidad"] });
  };

  return {
    crearManual: useMutation({
      mutationFn: (body: ReservaManualRequest) => endpointReservas.crearManual(body),
      onSuccess: invalidar,
    }),
    finalizar: useMutation({
      mutationFn: ({ id, metodoPago }: { id: number; metodoPago: MetodoPago }) =>
        endpointReservas.finalizar(id, { metodoPago }),
      onSuccess: invalidar,
    }),
    cancelar: useMutation({
      mutationFn: (id: number) => endpointReservas.cancelar(id),
      onSuccess: invalidar,
    }),
    marcarAusente: useMutation({
      mutationFn: (id: number) => endpointReservas.marcarAusente(id),
      onSuccess: invalidar,
    }),
    revertirAusencia: useMutation({
      mutationFn: (id: number) => endpointReservas.revertirAusencia(id),
      onSuccess: invalidar,
    }),
    moverCancha: useMutation({
      mutationFn: ({ id, nuevaCanchaId }: { id: number; nuevaCanchaId: number }) =>
        endpointReservas.moverCancha(id, { nuevaCanchaId }),
      onSuccess: invalidar,
    }),
  };
}
