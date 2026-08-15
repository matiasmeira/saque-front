import type { Deporte, DiaSemanaBack, FechaHoraISO, HoraISO } from "./comunes";

/**
 * DTOs de cancha (establecimiento/dto del backend).
 *
 * Los nombres NO coinciden con el mock src/mocks/canchas.ts:
 *
 *   mock                          backend
 *   ────────────────────────────  ────────────────────────────────
 *   preciosBase: {dur, precio}[]  preciosPorDuracion: Record<string, number>
 *   canchasFisicas: number[]      canchasFisicasIds: number[]
 *   canchasNecesarias             cantidadCanchasNecesarias
 *   mantenimientos: Bloqueo[]     (endpoints aparte de bloqueos)
 *
 * Ojo con preciosPorDuracion: en Java es Map<Integer, BigDecimal>, pero las
 * claves de un objeto JSON son strings. En TS es Record<string, number> y hay
 * que indexar con String(duracion).
 */

export type TarifaDto = {
  /** UN día, no una lista. Una tarifa del front con N días son N TarifaDto. */
  diaSemana: DiaSemanaBack;
  horaInicio: HoraISO;
  horaFin: HoraISO;
  precio: number;
  preciosPorDuracion: Record<string, number> | null;
};

export type CanchaRequest = {
  nombre: string;
  deportes: Deporte[];
  capacidad: number;
  /** @NotNull @Positive en el backend, además del map por duración. */
  precioBase: number;
  montoSena?: number;
  duracionesPermitidas?: number[];
  preciosPorDuracion?: Record<string, number>;
  permiteInicioMediaHora?: boolean;
  tarifas?: TarifaDto[];
  canchasFisicasIds?: number[];
  cantidadCanchasNecesarias?: number | null;
};

export type CanchaResponse = {
  id: number;
  nombre: string;
  deportes: Deporte[];
  capacidad: number;
  isActive: boolean;
  establecimientoId: number;
  precioBase: number;
  montoSena: number | null;
  duracionesPermitidas: number[];
  preciosPorDuracion: Record<string, number>;
  permiteInicioMediaHora: boolean;
  tarifas: TarifaDto[];
  canchasFisicasIds: number[];
  cantidadCanchasNecesarias: number | null;
};

export type BloqueoCanchaRequest = {
  fechaInicio: FechaHoraISO;
  fechaFin: FechaHoraISO;
  motivo: string;
};

export type CanchaDisponibleResponse = {
  id: number;
  nombre: string;
};

export type BloqueoCanchaResponse = {
  id: number;
  canchaId: number;
  fechaInicio: FechaHoraISO;
  fechaFin: FechaHoraISO;
  /** Se oculta cuando quien consulta es un PLAYER. */
  motivo: string | null;
  /**
   * Reservas que el bloqueo pisa, cada una con las canchas alternativas
   * libres. Es el insumo directo para un flujo de "mover reserva".
   */
  reservasAfectadas: {
    reserva: { id: number; canchaNombre: string; fechaHoraInicio: FechaHoraISO };
    canchasAlternativasDisponibles: CanchaDisponibleResponse[];
  }[];
};
