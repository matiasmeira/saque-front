import { useSyncExternalStore } from "react";
import { PANEL_HISTORIAL_CAJA, PANEL_TURNO_ABIERTO, type MovimientoCaja, type TipoMovimiento, type TurnoCaja } from "@/mocks/caja";

/**
 * Estado del turno de caja actualmente abierto, simulado en memoria
 * del cliente — sobrevive a la navegación entre /panel/caja,
 * /panel/caja/cerrar y /panel/caja/cerrado/[turnoId] porque el App
 * Router no recarga la página entre rutas (mismo mecanismo que
 * useSyncExternalStore en sesion-caja.ts, pero en memoria en vez de
 * localStorage: no hace falta sobrevivir a un refresh, igual que el
 * resto de los mocks del panel que se reinician al recargar).
 *
 * TODO backend: esto pasa a ser
 *   GET  /caja/abierta, POST /caja/abrir,
 *   POST /caja/movimientos, POST /caja/{turnoId}/cerrar
 * (ver mocks/caja.ts para el detalle de cada endpoint).
 */
let turnoAbierto: TurnoCaja | null = PANEL_TURNO_ABIERTO;
let historialCerrados: TurnoCaja[] = PANEL_HISTORIAL_CAJA;
let proximoIdMovimiento = 1000;
let proximoIdTurno = 1000;

const listeners = new Set<() => void>();
function notificar() {
  for (const l of listeners) l();
}
function suscribirse(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useTurnoAbierto(): TurnoCaja | null {
  return useSyncExternalStore(
    suscribirse,
    () => turnoAbierto,
    () => turnoAbierto,
  );
}

export function useHistorialCaja(): TurnoCaja[] {
  return useSyncExternalStore(
    suscribirse,
    () => historialCerrados,
    () => historialCerrados,
  );
}

function horaActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Solo para los query params ?mockVacio=1 — simula "todavía no se abrió la caja hoy". */
export function vaciarCajaAbiertaDemo() {
  turnoAbierto = null;
  notificar();
}

export function abrirCaja(fondoInicial: number, abiertoPor: string) {
  turnoAbierto = {
    id: `turno-${proximoIdTurno++}`,
    fechaApertura: new Date().toISOString(),
    abiertoPor,
    fondoInicial,
    movimientos: [
      { id: `mov-${proximoIdMovimiento++}`, hora: horaActual(), origen: "APERTURA", tipo: "INGRESO", monto: fondoInicial, descripcion: "Fondo inicial", metodoPago: "EFECTIVO" },
    ],
  };
  notificar();
}

export function registrarMovimiento(tipo: TipoMovimiento, monto: number, descripcion: string) {
  if (!turnoAbierto) return;
  const movimiento: MovimientoCaja = { id: `mov-${proximoIdMovimiento++}`, hora: horaActual(), origen: "MANUAL", tipo, monto, descripcion, metodoPago: "EFECTIVO" };
  turnoAbierto = { ...turnoAbierto, movimientos: [...turnoAbierto.movimientos, movimiento] };
  notificar();
}

export function cerrarCaja(saldoRealContado: number, observaciones: string, cerradoPor: string): TurnoCaja | null {
  if (!turnoAbierto) return null;
  const cerrado: TurnoCaja = {
    ...turnoAbierto,
    fechaCierre: new Date().toISOString(),
    cerradoPor,
    saldoReal: saldoRealContado,
    observaciones: observaciones.trim() || undefined,
  };
  historialCerrados = [cerrado, ...historialCerrados];
  turnoAbierto = null;
  notificar();
  return cerrado;
}

export function buscarTurnoCerradoPorId(turnoId: string): TurnoCaja | undefined {
  return historialCerrados.find((t) => t.id === turnoId);
}
