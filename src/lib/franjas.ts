/**
 * Franjas horarias para el campo "Franja" del buscador.
 *
 * Se busca por franja, no por hora exacta: con "20:00" el sistema
 * devuelve pocos complejos y el jugador se frustra. Con "Noche"
 * devuelve muchos y elige. Noche es el default porque es cuando
 * más se juega.
 */
export type Franja = {
  valor: string;
  etiqueta: string;
  rango: string;
};

export const FRANJAS: Franja[] = [
  { valor: "manana", etiqueta: "Mañana", rango: "6 a 12" },
  { valor: "tarde", etiqueta: "Tarde", rango: "12 a 18" },
  { valor: "noche", etiqueta: "Noche", rango: "18 a 24" },
];
