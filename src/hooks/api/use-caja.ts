"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { caja as endpointCaja } from "@/lib/api/endpoints/caja";
import { keys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/errores";
import { usePerfil } from "@/hooks/api/use-perfil";
import type {
  AbrirCajaRequest,
  CajaAbiertaResponse,
  CerrarCajaRequest,
  MovimientoManualRequest,
} from "@/lib/api/tipos/caja";

/**
 * Turno de caja abierto.
 *
 * "No hay caja abierta" es un ESTADO VÁLIDO, no un error: el backend responde
 * 404 con "No hay un turno de caja abierto para este establecimiento". Se
 * traduce a `null` para que la pantalla muestre el formulario de apertura en
 * vez de un cartel de error.
 *
 * Los MOVIMIENTOS no vienen acá: CajaAbiertaResponse trae los totales pero no
 * el detalle. La lista sólo existe en GET /caja/turnos/{id}, que es OWNER/ADMIN
 * — así que un empleado con OPERAR_CAJA puede operar la caja pero no ver la
 * tabla. Se pide sólo cuando el rol lo permite.
 */
export function useCajaAbierta(estId: number | null) {
  const { data: perfil } = usePerfil();
  const puedeVerMovimientos = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";

  const consulta = useQuery({
    queryKey: keys.caja.abierta(estId ?? 0),
    queryFn: async (): Promise<CajaAbiertaResponse | null> => {
      try {
        return await endpointCaja.abierta(estId!);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: estId !== null,
  });

  const turnoId = consulta.data?.turno.id ?? null;

  const detalle = useQuery({
    queryKey: keys.caja.turno(estId ?? 0, turnoId ?? 0),
    queryFn: () => endpointCaja.turno(estId!, turnoId!),
    enabled: estId !== null && turnoId !== null && puedeVerMovimientos,
  });

  return {
    caja: consulta.data ?? null,
    movimientos: detalle.data?.movimientos ?? [],
    puedeVerMovimientos,
    cargando: consulta.isPending,
    error: consulta.error,
    refetch: consulta.refetch,
  };
}

export function useAccionesCaja(estId: number | null) {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["caja"] });

  return {
    abrir: useMutation({
      mutationFn: (body: AbrirCajaRequest) => endpointCaja.abrir(estId!, body),
      onSuccess: invalidar,
    }),
    registrarMovimiento: useMutation({
      mutationFn: (body: MovimientoManualRequest) =>
        endpointCaja.registrarMovimiento(estId!, body),
      onSuccess: invalidar,
    }),
    /**
     * Devuelve el arqueo completo. La pantalla del ticket se dibuja con ESTA
     * respuesta: releerlo es GET /caja/turnos/{id}, que es OWNER/ADMIN, así que
     * un empleado que cierre la caja no podría volver a verlo.
     */
    cerrar: useMutation({
      mutationFn: ({ turnoId, body }: { turnoId: number; body: CerrarCajaRequest }) =>
        endpointCaja.cerrar(estId!, turnoId, body),
      onSuccess: invalidar,
    }),
  };
}
