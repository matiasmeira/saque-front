import { apiFetch } from "../cliente";
import type {
  ActualizarPermisosRequest,
  CambiarPinRequest,
  EmpleadoRequest,
  EmpleadoResponse,
} from "../tipos/empleados";

/**
 * EmpleadoController — /api/v1/establecimientos/{estId}/empleados. OWNER / ADMIN.
 *
 * Ojo con lo que NO existe, porque define la UI:
 *  - No hay endpoint para RENOMBRAR un empleado. El nombre se fija al crearlo
 *    (y es con lo que se loguea en el mostrador), así que la ficha no lo edita.
 *  - No hay endpoint para REACTIVAR a uno dado de baja. El DELETE desactiva; no
 *    hay vuelta atrás salvo dándolo de alta otra vez con otro nombre, porque el
 *    chequeo de nombre duplicado sólo mira a los activos.
 *  - Editar permisos y cambiar el PIN son dos endpoints DISTINTOS, no un PUT
 *    del empleado entero.
 *
 * `GET /activos` (la lista del mostrador, que se pide con la cookie del
 * dispositivo y sin sesión) vive en endpoints/caja.ts junto al resto del kiosco.
 */
export const empleados = {
  listar: (estId: number) =>
    apiFetch<EmpleadoResponse[]>(`/api/v1/establecimientos/${estId}/empleados`),

  /** 201. Nombre duplicado entre los ACTIVOS → 400. PIN trivial → 400. */
  crear: (estId: number, body: EmpleadoRequest) =>
    apiFetch<EmpleadoResponse>(`/api/v1/establecimientos/${estId}/empleados`, {
      method: "POST",
      body,
    }),

  actualizarPermisos: (estId: number, empleadoId: number, body: ActualizarPermisosRequest) =>
    apiFetch<EmpleadoResponse>(
      `/api/v1/establecimientos/${estId}/empleados/${empleadoId}/permisos`,
      { method: "PUT", body },
    ),

  /**
   * Cambiar el PIN incrementa el `tokenVersion` del empleado, o sea que corta
   * cualquier sesión de mostrador que tenga abierta en ese momento. Es a
   * propósito: si el PIN se cambió porque se filtró, dejar viva la sesión vieja
   * anularía el cambio.
   */
  cambiarPin: (estId: number, empleadoId: number, body: CambiarPinRequest) =>
    apiFetch<EmpleadoResponse>(
      `/api/v1/establecimientos/${estId}/empleados/${empleadoId}/pin`,
      { method: "PUT", body },
    ),

  /** 204. Desactiva (activo=false); no borra, para no perder el historial. */
  desactivar: (estId: number, empleadoId: number) =>
    apiFetch<void>(`/api/v1/establecimientos/${estId}/empleados/${empleadoId}`, {
      method: "DELETE",
    }),
};
