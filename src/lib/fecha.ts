/**
 * Aritmética de fechas en horario local para el panel — todo en
 * formato YYYY-MM-DD, sin librería externa (date-fns es de más para
 * sumar/restar días y encontrar el lunes de la semana).
 */
function formatearISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hoyISO(): string {
  return formatearISO(new Date());
}

export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return formatearISO(d);
}

/** Cantidad de días entre dos fechas, inclusive — "01/07 al 07/07" son 7 días. Para C8: define cuántos días tiene el período anterior a comparar. */
export function diasEntre(desdeISO: string, hastaISO: string): number {
  const d1 = new Date(`${desdeISO}T00:00:00`);
  const d2 = new Date(`${hastaISO}T00:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
}

/** Lunes de la semana que contiene fechaISO. */
export function inicioSemana(fechaISO: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  const diaSemana = d.getDay(); // 0 = domingo
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  return sumarDias(fechaISO, offset);
}

/** Domingo de la semana que contiene fechaISO. */
export function finSemana(fechaISO: string): string {
  return sumarDias(inicioSemana(fechaISO), 6);
}

/** Primer día del mes que contiene fechaISO — para el selector de período de C7. */
export function inicioMes(fechaISO: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Último día del mes que contiene fechaISO. */
export function finMes(fechaISO: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
}

/** Los 7 días a mostrar según la vista — un único elemento en Día. */
export function diasVisibles(fechaISO: string, vista: "dia" | "semana"): string[] {
  if (vista === "dia") return [fechaISO];
  const inicio = inicioSemana(fechaISO);
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
}

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export function diaCorto(fechaISO: string): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  return DIAS_CORTOS[d.getDay()];
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "20 al 26 de julio" — encabezado de la vista semana. */
export function rangoSemanaLabel(inicioISO: string): string {
  const finISO = sumarDias(inicioISO, 6);
  const di = new Date(`${inicioISO}T00:00:00`);
  const df = new Date(`${finISO}T00:00:00`);
  if (di.getMonth() === df.getMonth()) {
    return `${di.getDate()} al ${df.getDate()} de ${MESES_CORTOS[di.getMonth()]}`;
  }
  return `${di.getDate()} de ${MESES_CORTOS[di.getMonth()]} al ${df.getDate()} de ${MESES_CORTOS[df.getMonth()]}`;
}
