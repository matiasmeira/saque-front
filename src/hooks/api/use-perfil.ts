"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { auth, usuarios } from "@/lib/api/endpoints/auth";
import { establecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { borrarToken, guardarToken } from "@/lib/api/sesion";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { guardarEstablecimientoSeleccionado, useEstablecimientoSeleccionado } from "@/lib/establecimiento-seleccionado";
import type { AuthRequest, PerfilResponse } from "@/lib/api/tipos/auth";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Perfil del usuario autenticado. Es LA fuente de verdad del rol y los
 * permisos: el JWT no los lleva (solo sub, iat, exp, tokenVersion y, para
 * empleados, empleadoId).
 *
 * `enabled` evita pegarle a /me cuando no hay token: sin sesion daria 401 y
 * ensuciaria la consola en cada visita anonima.
 */
export function usePerfil() {
  const haySesion = useHaySesion();

  return useQuery({
    queryKey: keys.perfil(),
    queryFn: usuarios.me,
    enabled: haySesion,
    staleTime: 5 * 60_000,
  });
}

/**
 * Establecimiento sobre el que opera el panel.
 *
 * Para EMPLOYEE viene en el propio perfil. Para OWNER/ADMIN hay que pedir la
 * lista, porque /me devuelve establecimientoId null para esos roles.
 */
export function useEstablecimientoActivo(): {
  establecimientoId: number | null;
  /**
   * El establecimiento completo, disponible sólo para OWNER/ADMIN: para un
   * EMPLOYEE el perfil trae el id pero no hay endpoint que devuelva ese
   * establecimiento (GET /establecimientos lista los PROPIOS y no existe
   * GET /establecimientos/{id}).
   */
  establecimiento: EstablecimientoResponse | null;
  /** Todos los establecimientos del dueño. Vacío para EMPLOYEE (no aplica). */
  misEstablecimientos: EstablecimientoResponse[];
  /** Cambia cuál establecimiento queda activo en este navegador. */
  seleccionarEstablecimiento: (id: number) => void;
  cargando: boolean;
} {
  const { data: perfil, isPending: perfilPendiente } = usePerfil();
  const esDuenoOAdmin = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";
  const idSeleccionado = useEstablecimientoSeleccionado();

  const { data: mios, isPending: misEstablecimientosPendientes } = useQuery({
    queryKey: keys.establecimientos.mios(),
    queryFn: establecimientos.mios,
    enabled: esDuenoOAdmin,
    staleTime: 5 * 60_000,
  });

  if (perfil?.establecimientoId != null) {
    return {
      establecimientoId: perfil.establecimientoId,
      establecimiento: null,
      misEstablecimientos: [],
      seleccionarEstablecimiento: guardarEstablecimientoSeleccionado,
      cargando: false,
    };
  }

  if (esDuenoOAdmin) {
    // Si lo elegido ya no está en la lista (se borró, o quedó de otra
    // cuenta tras un logout/login), se cae solo al primero.
    const activo = mios?.find((e) => e.id === idSeleccionado) ?? mios?.[0] ?? null;
    return {
      establecimientoId: activo?.id ?? null,
      establecimiento: activo,
      misEstablecimientos: mios ?? [],
      seleccionarEstablecimiento: guardarEstablecimientoSeleccionado,
      cargando: misEstablecimientosPendientes,
    };
  }

  return {
    establecimientoId: null,
    establecimiento: null,
    misEstablecimientos: [],
    seleccionarEstablecimiento: guardarEstablecimientoSeleccionado,
    cargando: perfilPendiente,
  };
}

/** Login con email y contraseña. Guarda el token y precarga el perfil. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<PerfilResponse, ApiError, AuthRequest>({
    mutationFn: async (credenciales) => {
      const { token } = await auth.login(credenciales);
      guardarToken(token);
      // Se pide el perfil dentro de la mutacion para que quien llame sepa el
      // rol al resolver, y pueda decidir a donde redirigir sin un render extra.
      return usuarios.me();
    },
    onSuccess: (perfil) => {
      queryClient.setQueryData(keys.perfil(), perfil);
    },
  });
}

/**
 * Cierra sesion. Avisa al back ANTES de borrar el token (el endpoint necesita
 * autenticacion para incrementar tokenVersion). Si la llamada falla, igual se
 * limpia el cliente: quedarse logueado localmente seria peor.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await auth.logout();
      } finally {
        borrarToken();
      }
    },
    onSettled: () => {
      queryClient.clear();
    },
  });
}
