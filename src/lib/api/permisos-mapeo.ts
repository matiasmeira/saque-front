import type { PermisoEmpleado } from "./tipos/comunes";
import type { Permiso } from "@/mocks/empleados";

/**
 * Puente entre los permisos del backend y los del front.
 *
 * NO son el mismo conjunto: el front modela permisos de PANTALLA
 * (ver_agenda, ver_clientes, ver_stock_buffet) y el back permisos de ACCION
 * (CREAR_RESERVA_MANUAL, MARCAR_AUSENTE, FIJAR_COMENTARIO_DESTACADO).
 *
 * El remapeo completo de la UI — checkboxes de la ficha de empleado y mapa de
 * navegacion del sidebar — es la Fase 6 del plan de conexion. Hasta entonces
 * este modulo traduce, para que las pantallas del panel sigan compilando y
 * funcionando sin cambios mientras se migra el resto.
 *
 * Ver PLAN_CONEXION.md seccion 5.7.
 */

/** Permisos del front que SI tienen equivalente directo en el back. */
const EQUIVALENCIAS: Partial<Record<Permiso, PermisoEmpleado>> = {
  cobrar_turnos: "FINALIZAR_RESERVA",
  cancelar_turnos: "CANCELAR_RESERVA",
  vender_buffet: "REGISTRAR_VENTA_BUFFET",
  gestionar_caja: "OPERAR_CAJA",
};

/**
 * Permisos de solo lectura que el back no modela. Se conceden a cualquier
 * empleado autenticado: son de ver, no de actuar, y el back igual valida cada
 * accion por su cuenta. Decision del front, revisable en la Fase 6.
 */
const SOLO_LECTURA: readonly Permiso[] = ["ver_agenda", "ver_clientes", "ver_stock_buffet"];

/**
 * Permisos del back que el front todavia no expone en ninguna pantalla:
 * CREAR_RESERVA_MANUAL, MARCAR_AUSENTE, FIJAR_COMENTARIO_DESTACADO.
 * Quedan sin consumir hasta la Fase 6.
 */
export function tienePermisoDelBack(
  permisosDelBack: readonly PermisoEmpleado[],
  permiso: Permiso,
): boolean {
  if (SOLO_LECTURA.includes(permiso)) return true;

  const equivalente = EQUIVALENCIAS[permiso];
  if (!equivalente) return false;

  return permisosDelBack.includes(equivalente);
}
