import type { Deporte } from "@/lib/api/tipos/comunes";

/**
 * Catálogo de presentación de los 29 valores del enum `Deporte` del backend.
 *
 * La modalidad/cantidad de jugadores ya viene incluida en el propio valor del
 * enum (ej. `FUTBOL_5` vs `FUTBOL_7`), no se deriva de ningún otro campo:
 * la cancha ya no tiene `capacidad`, el deporte granular es la única fuente
 * de verdad para la etiqueta que se muestra ("Fútbol 5").
 */
export const DEPORTES: { valor: Deporte; etiqueta: string; abreviatura: string }[] = [
  { valor: "PADEL", etiqueta: "Pádel", abreviatura: "PAD" },
  { valor: "FUTBOL_4", etiqueta: "Fútbol 4", abreviatura: "FU4" },
  { valor: "FUTBOL_5", etiqueta: "Fútbol 5", abreviatura: "FU5" },
  { valor: "FUTBOL_6", etiqueta: "Fútbol 6", abreviatura: "FU6" },
  { valor: "FUTBOL_7", etiqueta: "Fútbol 7", abreviatura: "FU7" },
  { valor: "FUTBOL_8", etiqueta: "Fútbol 8", abreviatura: "FU8" },
  { valor: "FUTBOL_9", etiqueta: "Fútbol 9", abreviatura: "FU9" },
  { valor: "FUTBOL_10", etiqueta: "Fútbol 10", abreviatura: "F10" },
  { valor: "FUTBOL_11", etiqueta: "Fútbol 11", abreviatura: "F11" },
  { valor: "TENIS", etiqueta: "Tenis", abreviatura: "TEN" },
  { valor: "BASQUET_3VS3", etiqueta: "Básquet 3vs3", abreviatura: "BQ3" },
  { valor: "BASQUET_5VS5", etiqueta: "Básquet 5vs5", abreviatura: "BQ5" },
  { valor: "HOCKEY", etiqueta: "Hockey", abreviatura: "HOC" },
  { valor: "FUTGOLF", etiqueta: "Futgolf", abreviatura: "FGO" },
  { valor: "GOLF_VIRTUAL", etiqueta: "Golf Virtual", abreviatura: "GVI" },
  { valor: "PING_PONG", etiqueta: "Ping Pong", abreviatura: "PPO" },
  { valor: "VOLEY", etiqueta: "Vóley", abreviatura: "VOL" },
  { valor: "FRONTON", etiqueta: "Frontón", abreviatura: "FRO" },
  { valor: "SQUASH", etiqueta: "Squash", abreviatura: "SQU" },
  { valor: "PADBOL", etiqueta: "Padbol", abreviatura: "PDB" },
  { valor: "BEACH_TENIS", etiqueta: "Beach Tenis", abreviatura: "BTE" },
  { valor: "FUTVOLEY", etiqueta: "Futvóley", abreviatura: "FVO" },
  { valor: "HANDBALL", etiqueta: "Handball", abreviatura: "HAN" },
  { valor: "NATACION", etiqueta: "Natación", abreviatura: "NAT" },
  { valor: "SURF", etiqueta: "Surf", abreviatura: "SUR" },
  { valor: "PICKLEBALL", etiqueta: "Pickleball", abreviatura: "PIC" },
  { valor: "PADEL_SINGLE", etiqueta: "Pádel Individual", abreviatura: "PSI" },
  { valor: "BEACH_VOLLEY", etiqueta: "Beach Vóley", abreviatura: "BVO" },
  { valor: "PATINAJE", etiqueta: "Patinaje", abreviatura: "PAT" },
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
