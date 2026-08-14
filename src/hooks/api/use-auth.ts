"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { auth, usuarios } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { guardarToken } from "@/lib/api/sesion";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/** Resultado de sondear un email en el paso 1 de /ingresar. */
export type ResultadoSondeo = "tiene-cuenta" | "sin-cuenta";

/**
 * ¿Este email ya tiene cuenta?
 *
 * El backend no expone un endpoint de "existe este email". Se usa
 * POST /auth/registro/iniciar, que SI distingue:
 *   - 400 "El email ya está registrado" → hay cuenta, pedimos contraseña
 *   - 200                                → no hay cuenta, y el back YA mandó
 *                                          el mail con el código de 6 dígitos
 *
 * Es exactamente el comportamiento que pide el flujo: "si está asociado a una
 * cuenta se pide la contraseña, de lo contrario se envía el mail para crear
 * la cuenta". El efecto de mandar el mail es parte del mismo request.
 *
 * OJO — RATE LIMIT: ese endpoint permite 3 llamadas por email cada 15 minutos
 * (RegistroVerificacionService.INICIAR_INTENTOS_MAXIMOS) y consume el cupo
 * ANTES de chequear si el email existe. Al cuarto intento devuelve 429. Como
 * dejar a un usuario sin poder loguearse seria peor que mostrarle un campo de
 * mas, un 429 se trata como "tiene-cuenta": mostramos la contraseña igual y,
 * si en realidad no tenia cuenta, el login le dara 401 con el link a registro.
 */
export function useSondearEmail() {
  return useMutation<ResultadoSondeo, ApiError, string>({
    mutationFn: async (email) => {
      try {
        await auth.iniciarRegistro({ email });
        return "sin-cuenta";
      } catch (error) {
        if (error instanceof ApiError && (error.status === 400 || error.status === 429)) {
          return "tiene-cuenta";
        }
        throw error;
      }
    },
  });
}

/** Reenvia el codigo de verificacion. Mismo endpoint, mismo cupo de 3 cada 15 min. */
export function useReenviarCodigo() {
  return useMutation<void, ApiError, string>({
    mutationFn: (email) => auth.iniciarRegistro({ email }),
  });
}

/**
 * Paso 2 del registro: canjea el codigo de 6 digitos por el token de registro.
 * Ese token NO es el JWT de sesion: solo sirve para completar el alta.
 */
export function useVerificarCodigo() {
  return useMutation<string, ApiError, { email: string; codigo: string }>({
    mutationFn: async ({ email, codigo }) => {
      const { token } = await auth.verificarCodigoRegistro({ email, codigo });
      return token;
    },
  });
}

/**
 * Paso final del registro: manda token de registro + datos + contraseña en un
 * unico request (asi lo pide CompletarRegistroRequest) y deja la sesion abierta.
 */
export function useCompletarRegistro() {
  const queryClient = useQueryClient();

  return useMutation<
    PerfilResponse,
    ApiError,
    { token: string; nombre: string; telefono?: string; password: string }
  >({
    mutationFn: async (datos) => {
      const { token } = await auth.completarRegistro(datos);
      guardarToken(token);
      return usuarios.me();
    },
    onSuccess: (perfil) => {
      queryClient.setQueryData(keys.perfil(), perfil);
    },
  });
}
