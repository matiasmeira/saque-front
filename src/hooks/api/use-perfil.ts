"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { auth, usuarios } from "@/lib/api/endpoints/auth";
import { establecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { borrarToken, guardarToken } from "@/lib/api/sesion";
import { useHaySesion } from "@/hooks/api/use-sesion";
import type { AuthRequest, PerfilResponse } from "@/lib/api/tipos/auth";

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
  cargando: boolean;
} {
  const { data: perfil, isPending: perfilPendiente } = usePerfil();
  const esDuenoOAdmin = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";

  const { data: mios, isPending: misEstablecimientosPendientes } = useQuery({
    queryKey: keys.establecimientos.mios(),
    queryFn: establecimientos.mios,
    enabled: esDuenoOAdmin,
    staleTime: 5 * 60_000,
  });

  if (perfil?.establecimientoId != null) {
    return { establecimientoId: perfil.establecimientoId, cargando: false };
  }

  if (esDuenoOAdmin) {
    return {
      establecimientoId: mios?.[0]?.id ?? null,
      cargando: misEstablecimientosPendientes,
    };
  }

  return { establecimientoId: null, cargando: perfilPendiente };
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
