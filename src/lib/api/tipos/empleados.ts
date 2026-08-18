import type { PermisoEmpleado } from "./comunes";

/**
 * EmpleadoController — /api/v1/establecimientos/{estId}/empleados. OWNER / ADMIN.
 *
 * Un empleado NO es una cuenta con email y contraseña: es un `Usuario` con rol
 * EMPLOYEE, email sintético generado por el backend, y cuya única credencial es
 * un PIN de 4 dígitos. Entra sólo por el kiosco (`/caja`), nunca por
 * `/ingresar`. Por eso `EmpleadoRequest` no tiene ni email ni contraseña.
 */

export type EmpleadoRequest = {
  /** Único dentro del establecimiento, sin distinguir mayúsculas. Se trimea en el backend. */
  nombre: string;
  /** Exactamente 4 dígitos. Se rechazan los triviales (secuencias y repeticiones). */
  pin: string;
  /** Opcional al crear: sin permisos el empleado no puede hacer nada. */
  permisos?: PermisoEmpleado[];
};

/** `activo`, no `isActive` como el resto de la API. */
export type EmpleadoResponse = {
  id: number;
  nombre: string;
  permisos: PermisoEmpleado[];
  activo: boolean;
  establecimientoId: number;
};

export type ActualizarPermisosRequest = {
  permisos: PermisoEmpleado[];
};

export type CambiarPinRequest = {
  pin: string;
};
