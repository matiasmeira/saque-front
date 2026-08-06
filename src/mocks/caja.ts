/**
 * Caja (Modo Caja) — apertura, movimientos y cierre (arqueo) del
 * turno de mostrador. El saldo teórico es SOLO efectivo: los medios
 * electrónicos (transferencia, MP, tarjetas) no pasan físicamente
 * por la caja, así que solo entran en totalesPorMetodo (informativo),
 * nunca en el cálculo de lo que debería haber en el cajón.
 *
 * TODO backend:
 *   GET  /establecimientos/{id}/caja/abierta          → turno + movimientos + saldoTeorico + totalesPorMetodo
 *   POST /establecimientos/{id}/caja/abrir             { fondoInicial }
 *   POST /establecimientos/{id}/caja/movimientos       { tipo, monto, descripcion }
 *   POST /establecimientos/{id}/caja/{turnoId}/cerrar  { saldoRealContado, observaciones }
 *   GET  /establecimientos/{id}/caja/turnos            → historial paginado
 *   GET  /establecimientos/{id}/caja/turnos/{turnoId}  → detalle
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { hoyISO, sumarDias } from "@/lib/fecha";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";
import { PANEL_EMPLEADOS } from "@/mocks/empleados";

export type TipoMovimiento = "INGRESO" | "EGRESO";
export type OrigenMovimiento = "APERTURA" | "MANUAL" | "VENTA_BUFFET" | "COBRO_TURNO";

export const ETIQUETA_ORIGEN: Record<OrigenMovimiento, string> = {
  APERTURA: "Apertura de caja",
  MANUAL: "Manual",
  VENTA_BUFFET: "Venta de buffet",
  COBRO_TURNO: "Cobro de turno",
};

export type MovimientoCaja = {
  id: string;
  /** "HH:mm" */
  hora: string;
  origen: OrigenMovimiento;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
  metodoPago: MetodoPago;
};

export type TurnoCaja = {
  id: string;
  /** ISO datetime */
  fechaApertura: string;
  /** ISO datetime, solo si ya se cerró */
  fechaCierre?: string;
  abiertoPor: string;
  cerradoPor?: string;
  fondoInicial: number;
  movimientos: MovimientoCaja[];
  saldoReal?: number;
  observaciones?: string;
};

export function calcularSaldoTeorico(fondoInicial: number, movimientos: MovimientoCaja[]): number {
  return movimientos
    .filter((m) => m.metodoPago === "EFECTIVO")
    .reduce((acc, m) => acc + (m.tipo === "INGRESO" ? m.monto : -m.monto), fondoInicial);
}

export function calcularTotalesPorMetodo(movimientos: MovimientoCaja[]): Record<MetodoPago, number> {
  const totales = Object.fromEntries(METODOS_PAGO.map((m) => [m.valor, 0])) as Record<MetodoPago, number>;
  for (const m of movimientos) {
    totales[m.metodoPago] += m.tipo === "INGRESO" ? m.monto : -m.monto;
  }
  return totales;
}

export function calcularDiferencia(saldoTeorico: number, saldoReal: number): number {
  return saldoReal - saldoTeorico;
}

function nombreAbrePorId(id: string): string {
  return PANEL_EMPLEADOS.find((e) => e.id === id)?.nombre ?? "Dueño";
}

function generarMovimiento(id: string, hora: string, origen: OrigenMovimiento, tipo: TipoMovimiento, monto: number, descripcion: string, metodoPago: MetodoPago): MovimientoCaja {
  return { id, hora, origen, tipo, monto, descripcion, metodoPago };
}

// Turno abierto "hoy", con algunos movimientos ya cargados — sirve
// para mostrar el panel principal con datos sin tener que abrir la
// caja a mano cada vez que se entra a /panel/caja en desarrollo.
export const PANEL_TURNO_ABIERTO: TurnoCaja = {
  id: "turno-abierto-1",
  fechaApertura: `${hoyISO()}T09:00:00`,
  abiertoPor: nombreAbrePorId("emp-2"),
  fondoInicial: 20000,
  movimientos: [
    generarMovimiento("mov-1", "09:00", "APERTURA", "INGRESO", 20000, "Fondo inicial", "EFECTIVO"),
    generarMovimiento("mov-2", "10:15", "VENTA_BUFFET", "INGRESO", 3500, "Venta de buffet — mesa 2", "EFECTIVO"),
    generarMovimiento("mov-3", "11:40", "COBRO_TURNO", "INGRESO", 12000, "Seña cancha 3", "MERCADO_PAGO"),
    generarMovimiento("mov-4", "13:05", "MANUAL", "EGRESO", 4500, "Compra de hielo", "EFECTIVO"),
    generarMovimiento("mov-5", "15:20", "VENTA_BUFFET", "INGRESO", 8200, "Venta de buffet — mostrador", "EFECTIVO"),
  ],
};

function generarTurnoCerrado(id: string, fecha: string, abiertoPorId: string, cerradoPorId: string, rand: () => number): TurnoCaja {
  const fondoInicial = 15000 + Math.round(rand() * 10) * 1000;
  const movimientos: MovimientoCaja[] = [generarMovimiento(`${id}-mov-0`, "09:00", "APERTURA", "INGRESO", fondoInicial, "Fondo inicial", "EFECTIVO")];

  const cantidadMovimientos = 3 + Math.floor(rand() * 5);
  for (let i = 1; i <= cantidadMovimientos; i++) {
    const esIngreso = rand() < 0.75;
    const metodoPago = esIngreso ? METODOS_PAGO[Math.floor(rand() * METODOS_PAGO.length)].valor : "EFECTIVO";
    const origen: OrigenMovimiento = esIngreso ? (rand() < 0.5 ? "VENTA_BUFFET" : "COBRO_TURNO") : "MANUAL";
    const monto = Math.round((esIngreso ? 2000 + rand() * 10000 : 1000 + rand() * 5000) / 100) * 100;
    const hora = `${String(9 + Math.floor((i / cantidadMovimientos) * 10)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}`;
    const descripcion = esIngreso ? (origen === "VENTA_BUFFET" ? "Venta de buffet" : "Cobro de turno") : "Retiro de efectivo";
    movimientos.push(generarMovimiento(`${id}-mov-${i}`, hora, origen, esIngreso ? "INGRESO" : "EGRESO", monto, descripcion, metodoPago));
  }

  const saldoTeorico = calcularSaldoTeorico(fondoInicial, movimientos);
  // La mayoría cierra exacto o con una diferencia chica — un arqueo
  // perfecto todo el tiempo no sería realista.
  const diferenciaSimulada = rand() < 0.55 ? 0 : Math.round((rand() - 0.5) * 2000);
  const saldoReal = Math.max(0, saldoTeorico + diferenciaSimulada);

  return {
    id,
    fechaApertura: `${fecha}T09:00:00`,
    fechaCierre: `${fecha}T21:30:00`,
    abiertoPor: nombreAbrePorId(abiertoPorId),
    cerradoPor: nombreAbrePorId(cerradoPorId),
    fondoInicial,
    movimientos,
    saldoReal,
    observaciones: diferenciaSimulada !== 0 ? "Diferencia menor, sin explicación puntual." : undefined,
  };
}

const randHistorial = crearRand(hashSeed("historial-caja"));
const EMPLEADOS_ACTIVOS = PANEL_EMPLEADOS.filter((e) => e.estado === "activo").map((e) => e.id);

export const PANEL_HISTORIAL_CAJA: TurnoCaja[] = Array.from({ length: 14 }, (_, i) => {
  const fecha = sumarDias(hoyISO(), -(i + 1));
  const abiertoPorId = EMPLEADOS_ACTIVOS[Math.floor(randHistorial() * EMPLEADOS_ACTIVOS.length)];
  const cerradoPorId = EMPLEADOS_ACTIVOS[Math.floor(randHistorial() * EMPLEADOS_ACTIVOS.length)];
  return generarTurnoCerrado(`turno-${i + 1}`, fecha, abiertoPorId, cerradoPorId, randHistorial);
}).sort((a, b) => (a.fechaApertura < b.fechaApertura ? 1 : -1));
