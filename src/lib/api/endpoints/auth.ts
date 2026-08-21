import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type {
  AuthRequest,
  AuthResponse,
  CompletarRegistroRequest,
  EliminarCuentaRequest,
  EmpleadoLoginRequest,
  IniciarRegistroRequest,
  PerfilResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SolicitarCodigoRequest,
  SolicitarRecuperacionPasswordRequest,
  VerificarCodigoRegistroRequest,
  VerificarCodigoRegistroResponse,
  VerificarCodigoRequest,
  VerificarTokenResponse,
} from "../tipos/auth";

/**
 * AuthController — base /api/v1/auth. Todo publico salvo logout.
 * Ninguno de estos manda Authorization salvo logout y los de usuarios/*.
 */
export const auth = {
  login: (body: AuthRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body,
      conAuth: false,
    }),

  registrarDueno: (body: RegisterRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/register/owner", {
      method: "POST",
      body,
      conAuth: false,
    }),

  /** 204 No Content. Incrementa tokenVersion: invalida TODOS los JWT del usuario. */
  logout: () => apiFetch<void>("/api/v1/auth/logout", { method: "POST" }),

  iniciarRegistro: (body: IniciarRegistroRequest) =>
    apiFetch<void>("/api/v1/auth/registro/iniciar", {
      method: "POST",
      body,
      conAuth: false,
    }),

  verificarTokenRegistro: (token: string) =>
    apiFetch<VerificarTokenResponse>(
      `/api/v1/auth/registro/verificar${construirQuery({ token })}`,
      { conAuth: false },
    ),

  verificarCodigoRegistro: (body: VerificarCodigoRegistroRequest) =>
    apiFetch<VerificarCodigoRegistroResponse>(
      "/api/v1/auth/registro/verificar-codigo",
      { method: "POST", body, conAuth: false },
    ),

  completarRegistro: (body: CompletarRegistroRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/registro/completar", {
      method: "POST",
      body,
      conAuth: false,
    }),

  /** 200 siempre, exista o no el email: no revela si la cuenta existe. */
  recuperarPassword: (body: SolicitarRecuperacionPasswordRequest) =>
    apiFetch<void>("/api/v1/auth/password/recuperar", {
      method: "POST",
      body,
      conAuth: false,
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    apiFetch<void>("/api/v1/auth/password/reset", {
      method: "POST",
      body,
      conAuth: false,
    }),

  /**
   * Exige la cookie saque_caja_device (HttpOnly, SameSite=None, Secure).
   * El token que devuelve dura 15 minutos y lleva el claim empleadoId.
   */
  loginEmpleado: (body: EmpleadoLoginRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/empleados/login", {
      method: "POST",
      body,
      conAuth: false,
      conCookieDispositivo: true,
    }),
};

/** UsuarioController — base /api/v1/usuarios. Requiere sesion. */
export const usuarios = {
  me: () => apiFetch<PerfilResponse>("/api/v1/usuarios/me"),

  solicitarCodigoTelefono: (body: SolicitarCodigoRequest) =>
    apiFetch<void>("/api/v1/usuarios/telefono/solicitar-codigo", {
      method: "POST",
      body,
    }),

  verificarCodigoTelefono: (body: VerificarCodigoRequest) =>
    apiFetch<void>("/api/v1/usuarios/telefono/verificar-codigo", {
      method: "POST",
      body,
    }),

  /**
   * 204. Pide la contraseña actual como confirmación. El back devuelve 401 si
   * no coincide y 400 si es un OWNER con complejos activos (guardrail).
   */
  eliminar: (body: EliminarCuentaRequest) =>
    apiFetch<void>("/api/v1/usuarios/me", {
      method: "DELETE",
      body,
      // Un 401 acá es "contraseña incorrecta", no sesión muerta.
      borrarTokenEn401: false,
    }),
};
