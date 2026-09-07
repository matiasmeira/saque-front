"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { turnosFijos as endpointTurnosFijos } from "@/lib/api/endpoints/turnos-fijos";
import { keys } from "@/lib/api/keys";
import type { FechaISO } from "@/lib/api/fechas";

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
