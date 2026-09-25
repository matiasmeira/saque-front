"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { adminEstablecimientos, establecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { EstadoVerificacionEstablecimiento } from "@/lib/api/tipos/comunes";

/** Cola de moderación, paginada y filtrable por estado (default: todos). */
export function useAdminEstablecimientos({
  estadoVerificacion,
  page = 0,
}: {
  estadoVerificacion?: EstadoVerificacionEstablecimiento;
  page?: number;
}) {
  return useQuery({
    queryKey: keys.adminEstablecimientos.lista(estadoVerificacion, page),
    queryFn: () => adminEstablecimientos.listar({ estadoVerificacion, page }),
  });
}

/**
 * Cualquier pestaña de estado puede perder o ganar filas tras una
 * verificación/rechazo, así que se invalida el prefijo entero en vez de sólo
 * la combinación de filtros que está montada.
 */
function invalidarColaAdmin(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["admin-establecimientos", "lista"] });
}

/** Sólo válido desde EN_REVISION (400 en cualquier otro caso). Arranca el trial del dueño; no reversible desde acá. */
export function useVerificarEstablecimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminEstablecimientos.verificar(id),
    onSettled: () => invalidarColaAdmin(queryClient),
  });
}

/** Sólo válido desde EN_REVISION. `id` viaja en `variables` para poder deshabilitar sólo la fila en curso. */
export function useRechazarEstablecimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      adminEstablecimientos.rechazar(id, { motivo }),
    onSettled: () => invalidarColaAdmin(queryClient),
  });
}

/** Ficha pública del establecimiento, aunque todavía no esté verificado. */
export function usePrevisualizacionEstablecimiento(id: number) {
  return useQuery({
    queryKey: keys.adminEstablecimientos.previsualizacion(id),
    queryFn: () => establecimientos.previsualizacion(id),
  });
}
