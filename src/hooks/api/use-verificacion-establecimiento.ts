"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { ApiError } from "@/lib/api/errores";
import type { SolicitarVerificacionRequest } from "@/lib/api/tipos/establecimientos";

/**
 * Solicitud (o resolicitud) de verificación. La respuesta del POST sólo trae
 * id/estadoVerificacion/fechaSolicitudVerificacion — no motivoRechazo ni los
 * datos de contacto — así que no se usa para nada más que confirmar éxito:
 * invalidar `establecimientos.mios()` es lo que refresca el estado real en
 * todo el panel (HeaderPanel, el banner del layout, esta misma pantalla).
 */
export function useSolicitarVerificacion() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { estId: number; datos: SolicitarVerificacionRequest }>({
    mutationFn: async ({ estId, datos }) => {
      await endpointEstablecimientos.solicitarVerificacion(estId, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
    },
  });
}
