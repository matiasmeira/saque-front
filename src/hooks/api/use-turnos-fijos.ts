"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { turnosFijos as endpointTurnosFijos } from "@/lib/api/endpoints/turnos-fijos";
import { keys } from "@/lib/api/keys";
import type { FechaISO } from "@/lib/api/fechas";
import type { EditarClienteTurnoFijoRequest } from "@/lib/api/tipos/turnos-fijos";

/**
 * Listado de series ACTIVAS del establecimiento — el filtro por defecto del
 * backend cuando no se manda `estado`. Ver un histórico de canceladas queda
 * para cuando la pantalla lo necesite; hoy "gestionar turnos fijos" es
 * gestionar las vigentes.
 */
export function useTurnosFijos(estId: number | null, page = 0) {
  return useQuery({
    queryKey: keys.turnosFijos.lista(estId ?? 0, page),
    queryFn: () => endpointTurnosFijos.listar(estId!, { page }),
    enabled: estId !== null,
  });
}

/**
 * Da de baja la serie completa desde `desde`. Sólo OWNER/ADMIN: el backend le
 * responde 403 a un empleado aunque tenga permisos operativos de reserva.
 *
 * Invalida el listado de series y las reservas: cancelar la serie también
 * cancela sus ocurrencias puntuales, así que la agenda tiene que reflejarlo.
 */
export function useCancelarTurnoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, desde }: { id: number; desde: FechaISO }) =>
      endpointTurnosFijos.cancelar(id, { desde }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnos-fijos"] });
      queryClient.invalidateQueries({ queryKey: keys.reservas.todas() });
    },
  });
}

/**
 * Renueva la serie: crea la del año siguiente con la misma cancha, horario, día y
 * cliente. Sólo OWNER/ADMIN.
 *
 * Invalida el listado (aparece la serie nueva) y las reservas (hasta 52 ocurrencias
 * nuevas que la agenda tiene que reflejar).
 */
export function useRenovarTurnoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => endpointTurnosFijos.renovar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnos-fijos"] });
      queryClient.invalidateQueries({ queryKey: keys.reservas.todas() });
    },
  });
}

/**
 * Cambia nombre y teléfono del cliente de mostrador de la serie. Sólo tiene sentido
 * con `jugadorId` null. Sólo OWNER/ADMIN.
 *
 * Invalida el listado (la fila muestra el nombre nuevo) y las reservas: el backend
 * devuelve las ocurrencias con el cliente actualizado, así que también cambian en
 * la agenda.
 */
export function useEditarClienteTurnoFijo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & EditarClienteTurnoFijoRequest) =>
      endpointTurnosFijos.editarCliente(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnos-fijos"] });
      queryClient.invalidateQueries({ queryKey: keys.reservas.todas() });
    },
  });
}
