import type { OrigenMovimientoCaja } from "@/lib/api/tipos/comunes";

/**
 * Etiquetas de los orígenes reales de un movimiento de caja.
 *
 * No coinciden con las del mock, que tenía APERTURA y COBRO_TURNO. El backend
 * usa RESERVA (el cobro de un turno), VENTA_BUFFET, GASTO y MANUAL — el fondo
 * inicial no es un movimiento, es un campo del turno.
 */
export const ETIQUETA_ORIGEN: Record<OrigenMovimientoCaja, string> = {
  RESERVA: "Turno",
  VENTA_BUFFET: "Buffet",
  GASTO: "Gasto",
  MANUAL: "Manual",
};
