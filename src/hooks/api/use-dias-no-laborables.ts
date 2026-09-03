"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { DiaNoLaborableRequest } from "@/lib/api/tipos/establecimientos";

/**
 * Días no laborables del establecimiento (feriados, cierres puntuales).
 *
 * Sin editar: para cambiar uno se borra y se crea de nuevo, por eso solo hay
 * `crear` y `eliminar`. La disponibilidad (agenda y buscador) ya viene
 * excluyendo estos días desde el backend — este hook no recalcula nada.
 */
export function useDiasNoLaborables(estId: number | null) {
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: keys.diasNoLaborables(estId ?? 0),
    queryFn: () => endpointEstablecimientos.listarDiasNoLaborables(estId!),
    enabled: estId !== null,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: keys.diasNoLaborables(estId ?? 0) });

  const crear = useMutation({
    mutationFn: (body: DiaNoLaborableRequest) => endpointEstablecimientos.crearDiaNoLaborable(estId!, body),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => endpointEstablecimientos.eliminarDiaNoLaborable(estId!, id),
    onSuccess: invalidar,
  });

  return {
    dias: consulta.data ?? [],
    cargando: consulta.isPending,
    error: consulta.isError ? consulta.error : null,
    refetch: consulta.refetch,
    crear,
    eliminar,
  };
}
