import type { ComponentType } from "react";
import { Flag, Hand, Waves } from "lucide-react";
import type { Deporte } from "@/lib/api/tipos/comunes";
import {
  IconoBasquet,
  IconoFutbol,
  IconoHockey,
  IconoPatinaje,
  IconoPingPong,
  IconoRaqueta,
  IconoSurf,
  IconoVoley,
} from "@/components/canche/iconos-deporte";

type IconoDeporte = ComponentType<{ className?: string }>;

/**
 * Catálogo de presentación de los 29 valores del enum `Deporte` del backend.
 *
 * La modalidad/cantidad de jugadores ya viene incluida en el propio valor del
 * enum (ej. `FUTBOL_5` vs `FUTBOL_7`), no se deriva de ningún otro campo:
 * la cancha ya no tiene `capacidad`, el deporte granular es la única fuente
 * de verdad para la etiqueta que se muestra ("Fútbol 5").
 *
 * `icono` es un componente, no un string: varios deportes (todos los
 * Fútbol N, los de raqueta, los de vóley) comparten el mismo dibujo a
 * propósito — no hay forma de distinguir visualmente "Fútbol 7" de
 * "Fútbol 8" con un ícono, así que comparten la pelota y la etiqueta
 * hace el resto.
 */
export const DEPORTES: { valor: Deporte; etiqueta: string; abreviatura: string; icono: IconoDeporte }[] = [
  { valor: "PADEL", etiqueta: "Pádel", abreviatura: "PAD", icono: IconoRaqueta },
  { valor: "FUTBOL_4", etiqueta: "Fútbol 4", abreviatura: "FU4", icono: IconoFutbol },
  { valor: "FUTBOL_5", etiqueta: "Fútbol 5", abreviatura: "FU5", icono: IconoFutbol },
  { valor: "FUTBOL_6", etiqueta: "Fútbol 6", abreviatura: "FU6", icono: IconoFutbol },
  { valor: "FUTBOL_7", etiqueta: "Fútbol 7", abreviatura: "FU7", icono: IconoFutbol },
  { valor: "FUTBOL_8", etiqueta: "Fútbol 8", abreviatura: "FU8", icono: IconoFutbol },
  { valor: "FUTBOL_9", etiqueta: "Fútbol 9", abreviatura: "FU9", icono: IconoFutbol },
  { valor: "FUTBOL_10", etiqueta: "Fútbol 10", abreviatura: "F10", icono: IconoFutbol },
  { valor: "FUTBOL_11", etiqueta: "Fútbol 11", abreviatura: "F11", icono: IconoFutbol },
  { valor: "TENIS", etiqueta: "Tenis", abreviatura: "TEN", icono: IconoRaqueta },
  { valor: "BASQUET_3VS3", etiqueta: "Básquet 3vs3", abreviatura: "BQ3", icono: IconoBasquet },
  { valor: "BASQUET_5VS5", etiqueta: "Básquet 5vs5", abreviatura: "BQ5", icono: IconoBasquet },
  { valor: "HOCKEY", etiqueta: "Hockey", abreviatura: "HOC", icono: IconoHockey },
  { valor: "FUTGOLF", etiqueta: "Futgolf", abreviatura: "FGO", icono: Flag },
  { valor: "GOLF_VIRTUAL", etiqueta: "Golf Virtual", abreviatura: "GVI", icono: Flag },
  { valor: "PING_PONG", etiqueta: "Ping Pong", abreviatura: "PPO", icono: IconoPingPong },
  { valor: "VOLEY", etiqueta: "Vóley", abreviatura: "VOL", icono: IconoVoley },
  { valor: "FRONTON", etiqueta: "Frontón", abreviatura: "FRO", icono: IconoRaqueta },
  { valor: "SQUASH", etiqueta: "Squash", abreviatura: "SQU", icono: IconoRaqueta },
  { valor: "PADBOL", etiqueta: "Padbol", abreviatura: "PDB", icono: Hand },
  { valor: "BEACH_TENIS", etiqueta: "Beach Tenis", abreviatura: "BTE", icono: IconoRaqueta },
  { valor: "FUTVOLEY", etiqueta: "Futvóley", abreviatura: "FVO", icono: IconoVoley },
  { valor: "HANDBALL", etiqueta: "Handball", abreviatura: "HAN", icono: Hand },
  { valor: "NATACION", etiqueta: "Natación", abreviatura: "NAT", icono: Waves },
  { valor: "SURF", etiqueta: "Surf", abreviatura: "SUR", icono: IconoSurf },
  { valor: "PICKLEBALL", etiqueta: "Pickleball", abreviatura: "PIC", icono: IconoPingPong },
  { valor: "PADEL_SINGLE", etiqueta: "Pádel Individual", abreviatura: "PSI", icono: IconoRaqueta },
  { valor: "BEACH_VOLLEY", etiqueta: "Beach Vóley", abreviatura: "BVO", icono: IconoVoley },
  { valor: "PATINAJE", etiqueta: "Patinaje", abreviatura: "PAT", icono: IconoPatinaje },
];

export function etiquetaDeporte(valor: string): string {
  return DEPORTES.find((d) => d.valor === valor)?.etiqueta ?? valor;
}

export function abreviaturaDeporte(valor: string): string {
  return DEPORTES.find((d) => d.valor === valor)?.abreviatura ?? valor;
}

/** `true` si el string es uno de los valores del enum del backend. */
export function esDeporte(valor: string | undefined): valor is Deporte {
  return DEPORTES.some((d) => d.valor === valor);
}
