"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { ApiError } from "@/lib/api/errores";
import type { CambiarEstadoEstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Previsualización del propio complejo (panel del dueño). A diferencia de
 * `usePrevisualizacionEstablecimiento` en use-admin-establecimientos.ts (que
 * pega al mismo endpoint pero para la cola de moderación), usa el namespace
 * `keys.establecimientos.*` -- son casos de uso distintos y no conviene que
 * invalidar uno afecte la caché del otro.
 */
export function usePrevisualizacionPropia(estId: number | null) {
  return useQuery({
    queryKey: keys.establecimientos.previsualizacion(estId ?? 0),
    queryFn: () => endpointEstablecimientos.previsualizacion(estId!),
    enabled: estId !== null,
  });
}

/**
 * Deshabilita o rehabilita el complejo activo. Invalida `mios()`: es de ahí
 * de donde el resto del panel (header, selector, esta misma pantalla) vuelve
 * a leer `isActive`. No toca `estadoVerificacion`.
 */
export function useCambiarEstadoEstablecimiento() {
  const queryClient = useQueryClient();

  return useMutation<CambiarEstadoEstablecimientoResponse, ApiError, { estId: number; activo: boolean }>({
    mutationFn: ({ estId, activo }) => endpointEstablecimientos.cambiarEstado(estId, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
    },
  });
}

/**
 * Baja definitiva. Invalida `mios()`: `useEstablecimientoActivo` ya cae sola
 * al primero de los que queden (o a `null` si no queda ninguno) apenas la
 * lista se refresca sin este id -- no hace falta ningún redirect manual acá.
 */
export function useEliminarEstablecimiento() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (estId) => endpointEstablecimientos.eliminar(estId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
    },
  });
}
