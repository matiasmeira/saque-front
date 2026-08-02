/**
 * Entidad Tarifa del backend: reglas de excepción sobre el
 * precioBase de una cancha (que ya vive en Cancha.preciosBase, ver
 * canchas.ts — no se duplica el tipo del precio por duración, se
 * reutiliza PrecioPorDuracion). Cada Tarifa es "estos días, en este
 * rango horario, el precio es otro" — fuera de sus reglas, rige el
 * precio base. Se cargan por cancha, una por una.
 */
import type { Cancha, PrecioPorDuracion } from "@/mocks/canchas";

export type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export const DIAS_SEMANA: { valor: DiaSemana; letra: string; corta: string; larga: string }[] = [
  { valor: "lun", letra: "L", corta: "Lun", larga: "Lunes" },
  { valor: "mar", letra: "M", corta: "Mar", larga: "Martes" },
  { valor: "mie", letra: "M", corta: "Mié", larga: "Miércoles" },
  { valor: "jue", letra: "J", corta: "Jue", larga: "Jueves" },
  { valor: "vie", letra: "V", corta: "Vie", larga: "Viernes" },
  { valor: "sab", letra: "S", corta: "Sáb", larga: "Sábado" },
  { valor: "dom", letra: "D", corta: "Dom", larga: "Domingo" },
];

export type Tarifa = {
  id: number;
  canchaId: number;
  dias: DiaSemana[];
  horaDesde: string;
  horaHasta: string;
  precios: PrecioPorDuracion[];
};

// Pádel D tiene la tarifa "rica" (dos duraciones) para que la
// pantalla arranque mostrando precio base + tarifa especial sin
// tener que cambiar de cancha. Cancha A muestra el caso simple, de
// una sola duración.
export const PANEL_TARIFAS: Tarifa[] = [
  {
    id: 1,
    canchaId: 1,
    dias: ["vie", "sab"],
    horaDesde: "20:00",
    horaHasta: "23:00",
    precios: [{ duracionMinutos: 60, precio: 28000 }],
  },
  {
    id: 2,
    canchaId: 5,
    dias: ["sab", "dom"],
    horaDesde: "18:00",
    horaHasta: "23:00",
    precios: [
      { duracionMinutos: 60, precio: 20000 },
      { duracionMinutos: 90, precio: 27000 },
    ],
  },
];

/** "Sáb, Dom" */
export function etiquetaDias(dias: DiaSemana[]): string {
  return dias.map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.corta ?? d).join(", ");
}

const DIAS_POR_INDICE: DiaSemana[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

/** Para calcular el precio real de un turno generado en la agenda (C2), según qué día de la semana cae su fecha. */
export function diaSemanaDeFecha(fechaISO: string): DiaSemana {
  return DIAS_POR_INDICE[new Date(`${fechaISO}T00:00:00`).getDay()];
}

export function diasEnComun(a: DiaSemana[], b: DiaSemana[]): boolean {
  return a.some((d) => b.includes(d));
}

export function rangosSeSuperponen(aDesde: string, aHasta: string, bDesde: string, bHasta: string): boolean {
  return aDesde < bHasta && aHasta > bDesde;
}

/**
 * Precio real de un turno: la primera tarifa especial de la cancha
 * cuyos días y horario incluyen este turno, o si ninguna aplica, el
 * precio base de esa duración. La validación de alta de tarifa evita
 * que dos reglas de la misma cancha se solapen, así que como mucho
 * matchea una.
 */
export function calcularPrecio(
  cancha: Cancha,
  tarifas: Tarifa[],
  dia: DiaSemana,
  hora: string,
  duracionMinutos: number,
): { precio: number; tarifa: Tarifa | null } {
  const match = tarifas.find((t) => t.canchaId === cancha.id && t.dias.includes(dia) && hora >= t.horaDesde && hora < t.horaHasta);
  const precioTarifa = match?.precios.find((p) => p.duracionMinutos === duracionMinutos)?.precio;
  if (match && precioTarifa !== undefined) {
    return { precio: precioTarifa, tarifa: match };
  }
  const base = cancha.preciosBase.find((p) => p.duracionMinutos === duracionMinutos)?.precio ?? 0;
  return { precio: base, tarifa: null };
}
