import type { Deporte } from "@/lib/api/tipos/comunes";

/**
 * Catálogo de presentación de los 6 valores del enum `Deporte` del backend.
 *
 * Reemplaza al del mock, que NO era el mismo: subdividía fútbol por cantidad de
 * jugadores (`futbol-5` / `futbol-7` / `futbol-11`, en minúsculas) y no tenía
 * hockey. El backend tiene un único `FUTBOL` y sí tiene `HOCKEY`, así que la
 * variante se deriva de `capacidad` de la cancha, no del deporte.
 *
 * La diferencia no era cosmética: el formulario de canchas armaba
 * `CanchaRequest.deportes` con esos valores del mock y el backend los rechaza,
 * porque no existen en el enum.
 */
export const DEPORTES: { valor: Deporte; etiqueta: string; abreviatura: string }[] = [
  { valor: "FUTBOL", etiqueta: "Fútbol", abreviatura: "FUT" },
  { valor: "PADEL", etiqueta: "Pádel", abreviatura: "PAD" },
  { valor: "TENIS", etiqueta: "Tenis", abreviatura: "TEN" },
  { valor: "BASQUET", etiqueta: "Básquet", abreviatura: "BAS" },
  { valor: "VOLEY", etiqueta: "Vóley", abreviatura: "VOL" },
  { valor: "HOCKEY", etiqueta: "Hockey", abreviatura: "HOC" },
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
