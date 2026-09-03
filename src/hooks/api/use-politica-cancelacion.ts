"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { ActualizarPoliticaCancelacionRequest } from "@/lib/api/tipos/establecimientos";

/**
 * Política de cancelación del establecimiento (horas de anticipación +
 * minutos de gracia). Sub-recurso propio, autocontenido: trae sus propios
 * datos y es dueño de su query key, igual que useDiasNoLaborables/FormFotos.
 *
 * A diferencia de días no laborables, siempre existe un único registro
 * (default 24h / 30min): no hay "crear", solo leer y actualizar. El PATCH
 * ya devuelve el estado final completo, así que se siembra con
 * `setQueryData` en vez de invalidar y releer.
 */
export function usePoliticaCancelacion(estId: number | null) {
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: keys.establecimientos.politicaCancelacion(estId ?? 0),
    queryFn: () => endpointEstablecimientos.obtenerPoliticaCancelacion(estId!),
    enabled: estId !== null,
  });

  const actualizar = useMutation({
    mutationFn: (body: ActualizarPoliticaCancelacionRequest) =>
      endpointEstablecimientos.actualizarPoliticaCancelacion(estId!, body),
    onSuccess: (respuesta) => queryClient.setQueryData(keys.establecimientos.politicaCancelacion(estId ?? 0), respuesta),
  });

  return {
    politica: consulta.data,
    cargando: consulta.isPending,
    error: consulta.isError ? consulta.error : null,
    refetch: consulta.refetch,
    actualizar,
  };
}
