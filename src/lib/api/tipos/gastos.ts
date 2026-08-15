import type { CategoriaGasto, FechaHoraISO, FechaISO, MetodoPago } from "./comunes";

/**
 * GastoRequest / GastoResponse. Es el DTO que más se parece a su mock: los
 * seis campos del formulario coinciden uno a uno con los del backend.
 *
 * La diferencia está en la respuesta, que suma quién lo registró y cuándo —
 * datos de auditoría que el mock no tenía.
 */
export type GastoRequest = {
  fecha: FechaISO;
  /** @DecimalMin(0.0, inclusive=false): tiene que ser mayor a cero. */
  monto: number;
  categoria: CategoriaGasto;
  descripcion: string;
  metodoPago: MetodoPago;
  comprobanteUrl?: string;
};

export type GastoResponse = {
  id: number;
  establecimientoId: number;
  fecha: FechaISO;
  monto: number;
  categoria: CategoriaGasto;
  descripcion: string;
  metodoPago: MetodoPago;
  comprobanteUrl: string | null;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
  fechaCreacion: FechaHoraISO;
};
