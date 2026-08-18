import { DoorOpen, Flame, ParkingCircle, ShowerHead, Store, UtensilsCrossed, Wifi } from "lucide-react";
import type { Servicio } from "@/lib/api/tipos/comunes";

/**
 * Catálogo de presentación de los 7 valores del enum `Servicio` del backend.
 *
 * Vive acá y no dentro de una pantalla porque lo usan las dos puntas: el dueño
 * los elige en Configuración y el jugador los ve en la ficha del complejo. Si
 * la etiqueta o el ícono se definieran dos veces, el chip que tilda el dueño y
 * el que ve el jugador podrían dejar de ser el mismo.
 *
 * El orden importa: es el orden en que se muestran los chips.
 */
export const SERVICIOS: { valor: Servicio; etiqueta: string; Icono: typeof ShowerHead }[] = [
  { valor: "VESTUARIOS", etiqueta: "Vestuarios", Icono: DoorOpen },
  { valor: "DUCHAS", etiqueta: "Duchas", Icono: ShowerHead },
  { valor: "PARRILLA", etiqueta: "Parrilla", Icono: Flame },
  { valor: "ESTACIONAMIENTO", etiqueta: "Estacionamiento", Icono: ParkingCircle },
  { valor: "BUFFET", etiqueta: "Buffet", Icono: UtensilsCrossed },
  { valor: "KIOSCO", etiqueta: "Kiosco", Icono: Store },
  { valor: "WIFI", etiqueta: "WiFi", Icono: Wifi },
];

const POR_VALOR = new Map(SERVICIOS.map((s) => [s.valor, s]));

export function servicio(valor: Servicio) {
  return POR_VALOR.get(valor);
}
