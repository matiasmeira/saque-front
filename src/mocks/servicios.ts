/** Servicios que puede ofrecer un complejo, mostrados en su ficha (A3). */
export type Servicio = {
  valor: string;
  etiqueta: string;
};

export const SERVICIOS: Servicio[] = [
  { valor: "vestuario", etiqueta: "Vestuario" },
  { valor: "parrilla", etiqueta: "Parrilla" },
  { valor: "estacionamiento", etiqueta: "Estacionamiento" },
  { valor: "buffet", etiqueta: "Buffet" },
  { valor: "wifi", etiqueta: "Wi-Fi" },
];
