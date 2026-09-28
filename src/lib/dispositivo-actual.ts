import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";

/**
 * ¿Esta fila de la tabla de dispositivos es la PC desde la que se está
 * mirando Configuración? Sólo se puede saber si ESTE navegador guardó el id
 * al emparejarse (ver `guardarDispositivo` en `sesion-caja.ts`) — un
 * navegador emparejado antes de ese cambio, o por el link de emparejamiento
 * (que el backend no le devuelve el id), no tiene forma de reconocerse.
 */
export function esEstaComputadora(dispositivo: DispositivoCajaResponse, idGuardado: number | null): boolean {
  return idGuardado !== null && dispositivo.id === idGuardado;
}
