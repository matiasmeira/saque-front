/**
 * C9 — Configuración del establecimiento. Todo acá es del complejo
 * en su conjunto (no de una cancha puntual, eso vive en canchas.ts) y
 * es lo que alimenta tanto el marketplace (fotos, horarios, política
 * de cancelación) como el cobro de señas (MercadoPago).
 *
 * TODO backend: alta/edición de estos datos, subida real de fotos y
 * el estado de KYC de MercadoPago vienen de la API — acá todo es
 * mock editable en memoria, se pierde al refrescar.
 */
import type { DiaSemana } from "@/mocks/tarifas";
import { DIAS_SEMANA } from "@/mocks/tarifas";

export type DatosComplejo = {
  nombre: string;
  direccion: string;
  telefono: string;
  cuit: string;
  /** true = CUIT ya lo confirmó D3 (verificación) — a partir de ahí es de solo lectura */
  cuitVerificado: boolean;
  /** valores de DEPORTES */
  deportes: string[];
};

export type FotoComplejo = { id: string; etiqueta: string };

export const FOTOS_MINIMO_RECOMENDADO = 3;

export type HorarioDia = { dia: DiaSemana; cerrado: boolean; abre: string; cierra: string };

export type PoliticaCancelacion = { horasLimite: number };

export type EstadoMercadoPago = "conectado" | "pendiente" | "no_conectado";

export type CuentaMercadoPago = {
  estado: EstadoMercadoPago;
  emailConectado?: string;
  fechaConexion?: string;
};

export const PANEL_DATOS_COMPLEJO: DatosComplejo = {
  nombre: "Arena Sport Club",
  direccion: "Av. Hipólito Yrigoyen 1540, José C. Paz",
  telefono: "11 4000-1234",
  cuit: "30-71234567-9",
  cuitVerificado: true,
  deportes: ["futbol-5", "futbol-7"],
};

export const PANEL_FOTOS: FotoComplejo[] = [
  { id: "foto-1", etiqueta: "Cancha principal" },
  { id: "foto-2", etiqueta: "Vestuarios" },
  { id: "foto-3", etiqueta: "Estacionamiento" },
];

// Domingo cerrado a propósito: deja ver el estado "cerrado" del
// formulario sin tener que tocar nada al abrir la pantalla.
export const PANEL_HORARIOS_ATENCION: HorarioDia[] = DIAS_SEMANA.map(({ valor }) => ({
  dia: valor,
  cerrado: valor === "dom",
  abre: valor === "sab" ? "09:00" : "08:00",
  cierra: valor === "sab" ? "23:00" : "23:00",
}));

export const PANEL_POLITICA_CANCELACION: PoliticaCancelacion = { horasLimite: 24 };

export const PANEL_MERCADOPAGO: CuentaMercadoPago = {
  estado: "conectado",
  emailConectado: "pagos@arenasportclub.com.ar",
  fechaConexion: "2026-06-02",
};

/** Mismo texto que ve el jugador en el checkout — para que el dueño lo revise antes de guardar. */
export function textoPoliticaCancelacion(horasLimite: number): string {
  if (horasLimite === 0) return "La seña no se reembolsa ante cancelaciones, sin importar la anticipación.";
  return `Podés cancelar tu reserva sin cargo hasta ${horasLimite} horas antes del turno. Pasado ese plazo, la seña no se reembolsa.`;
}
