/**
 * Zonas para el campo "Dónde" del buscador.
 *
 * "Cerca mío" va primero y es el valor por defecto: la home nunca
 * pide permiso de geolocalización ni muestra un estado de carga
 * para resolverlo. Funciona igual con o sin permiso.
 */

// TODO backend: reemplazar por geolocalización real (reverse
// geocoding a partir de las coordenadas del navegador), con
// fallback a "José C. Paz" cuando no hay permiso o falla.
export type Zona = {
  valor: string;
  etiqueta: string;
};

export const ZONAS: Zona[] = [
  { valor: "cerca", etiqueta: "Cerca mío" },
  { valor: "jose-c-paz", etiqueta: "José C. Paz" },
  { valor: "san-miguel", etiqueta: "San Miguel" },
  { valor: "malvinas-argentinas", etiqueta: "Malvinas Argentinas" },
  { valor: "pilar", etiqueta: "Pilar" },
];
