"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { auth, usuarios } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { guardarToken } from "@/lib/api/sesion";
import type { PerfilResponse } from "@/lib/api/tipos/auth";
import type { ModoRegistro } from "@/lib/modo-registro";
import { armarBodyIniciarRegistro } from "@/lib/registro-body";
import { clasificarSondeo, type ResultadoSondeo } from "@/lib/sondeo-email";

/** Variables de las mutaciones que inician el registro. */
export type IniciarRegistroVars = {
  email: string;
  volverA?: string | null;
  modo?: ModoRegistro;
};

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
 * OJO — RATE LIMIT: ese endpoint permite 1 llamada por email por minuto
 * (RegistroVerificacionService.INICIAR_INTENTOS_MAXIMOS) y 10 cada 10 minutos
 * por IP (RateLimitFilter). El cupo por email se consume ANTES de chequear si
 * el email existe: la segunda llamada dentro del minuto devuelve 429, y con un
 * 429 no se puede saber si hay cuenta. Por eso es "esperar" (ver
 * clasificarSondeo), no "tiene-cuenta": /ingresar pide esperar y ofrece el
 * link para ingresar a quien ya tiene cuenta.
 */
export function useSondearEmail() {
  return useMutation<ResultadoSondeo, ApiError, IniciarRegistroVars>({
    mutationFn: async (vars) => {
      try {
        await auth.iniciarRegistro(armarBodyIniciarRegistro(vars));
        return "nuevo";
      } catch (error) {
        const resultado = error instanceof ApiError ? clasificarSondeo(error.status) : null;
        if (resultado) return resultado;
        throw error;
      }
    },
  });
}

/** Reenvia el codigo de verificacion. Mismo endpoint, mismo cupo: 1 por minuto por email. */
export function useReenviarCodigo() {
  return useMutation<void, ApiError, IniciarRegistroVars>({
    // El reenvío arma un link nuevo (el anterior se invalida): lleva volverA
    // también (o tipo DUENO en modo dueño).
    mutationFn: (vars) => auth.iniciarRegistro(armarBodyIniciarRegistro(vars)),
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
