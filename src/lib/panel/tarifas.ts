import type { PrecioPorDuracion } from "@/lib/panel/canchas";

/**
 * La forma con la que trabaja la pantalla de precios del panel.
 *
 * NO es el DTO: `TarifaDto` tiene UN `diaSemana` en mayúsculas, así que una
 * tarifa de acá con cinco días son cinco `TarifaDto`. La expansión (y el
 * agrupado a la vuelta) están en `src/lib/api/tarifas.ts`. Además las tarifas
 * viajan DENTRO de `CanchaRequest`: no hay endpoint granular.
 *
 * Era `src/mocks/tarifas.ts`, que además traía tarifas de ejemplo y un
 * `calcularPrecio()` que no reproducía al del backend. El precio lo fija el
 * backend y vuelve en `ReservaResponse.precioTotal`.
 */
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

/** "Estos días, en esta franja, el precio es otro". Fuera de sus reglas rige el precio base de la cancha. */
export type Tarifa = {
  id: number;
  canchaId: number;
  dias: DiaSemana[];
  horaDesde: string;
  horaHasta: string;
  precios: PrecioPorDuracion[];
};

/** "Sáb, Dom" */
export function etiquetaDias(dias: DiaSemana[]): string {
  return dias.map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.corta ?? d).join(", ");
}

export function diasEnComun(a: DiaSemana[], b: DiaSemana[]): boolean {
  return a.some((d) => b.includes(d));
}

export function rangosSeSuperponen(aDesde: string, aHasta: string, bDesde: string, bHasta: string): boolean {
  return aDesde < bHasta && aHasta > bDesde;
}
