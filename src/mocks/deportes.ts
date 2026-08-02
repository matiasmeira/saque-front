/**
 * Deportes que se pueden reservar en la plataforma.
 * Fútbol 5 va primero: es el que más recorta la búsqueda y el
 * que el jugador tiene más claro al entrar.
 */

// TODO backend: esta lista sale hoy fija; en algún momento va a
// depender de qué deportes ofrece al menos un complejo publicado.
export type Deporte = {
  valor: string;
  etiqueta: string;
  /** Para el badge chico de la tarjeta de resultado: "F5", "Pádel". */
  abreviatura: string;
};

export const DEPORTES: Deporte[] = [
  { valor: "futbol-5", etiqueta: "Fútbol 5", abreviatura: "F5" },
  { valor: "futbol-7", etiqueta: "Fútbol 7", abreviatura: "F7" },
  { valor: "futbol-11", etiqueta: "Fútbol 11", abreviatura: "F11" },
  { valor: "padel", etiqueta: "Pádel", abreviatura: "Pádel" },
  { valor: "tenis", etiqueta: "Tenis", abreviatura: "Tenis" },
  { valor: "basquet", etiqueta: "Básquet", abreviatura: "Básquet" },
  { valor: "voley", etiqueta: "Vóley", abreviatura: "Vóley" },
];
