import type { PermisoEmpleado, PlanSuscripcion, Role } from "./comunes";

/**
 * DTOs de auth. Espejan los records de auth/dto del backend.
 *
 * OJO: AuthResponse trae SOLO el token. No hay rol, ni id, ni nombre, ni
 * expiracion. El rol se resuelve con GET /api/v1/usuarios/me.
 */

export type AuthRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  nombre: string;
};

export type IniciarRegistroRequest = {
  email: string;
};

export type VerificarTokenResponse = {
  email: string;
  verificado: boolean;
};

export type VerificarCodigoRegistroRequest = {
  email: string;
  codigo: string;
};

export type VerificarCodigoRegistroResponse = {
  /** Token de registro (NO es el JWT de sesion). */
  token: string;
};

export type CompletarRegistroRequest = {
  token: string;
  nombre: string;
  telefono?: string;
  password: string;
};

export type SolicitarRecuperacionPasswordRequest = {
  email: string;
};

/** `token` XOR (`email` + `codigo`). La exclusividad la valida el back. */
export type ResetPasswordRequest = {
  token?: string;
  email?: string;
  codigo?: string;
  nuevaPassword: string;
};

export type EmpleadoLoginRequest = {
  establecimientoId?: number;
  nombre: string;
  pin: string;
};

/**
 * GET /api/v1/usuarios/me
 *
 * `establecimientoId` y `permisos` solo vienen completos para rol EMPLOYEE.
 * Para un OWNER, `establecimientoId` es null: su establecimiento sale de
 * GET /api/v1/establecimientos.
 */
export type PerfilResponse = {
  id: number;
  email: string;
  nombre: string;
  rol: Role;
  planSuscripcion: PlanSuscripcion;
  emailVerified: boolean;
  telefonoVerificado: boolean;
  establecimientoId: number | null;
  permisos: PermisoEmpleado[];
};

export type SolicitarCodigoRequest = {
  telefono: string;
};

export type VerificarCodigoRequest = {
  codigo: string;
};

export type EliminarCuentaRequest = {
  password: string;
};
