/** "$24.000" — separador de miles es-AR, sin decimales. Se repetía suelto en cada componente. */
export function formatearPrecio(monto: number) {
  return `$${monto.toLocaleString("es-AR")}`;
}

/**
 * "43%", "0,5%" — porcentajes de los reportes, que llegan del backend en escala
 * 0–100 con dos decimales.
 *
 * Redondear siempre a entero convertiría un 0,46% real en "0%", que se lee como
 * "no hubo nada" cuando sí hubo: dos turnos en un mes de 434 horas disponibles
 * dan exactamente eso. Por debajo de 10 se muestra un decimal.
 */
export function formatearPorcentaje(valor: number): string {
  if (valor !== 0 && Math.abs(valor) < 10) {
    return `${valor.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
  }
  return `${Math.round(valor)}%`;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "Sábado 26 de julio" — fecha completa para el resumen del checkout. */
export function fechaLarga(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

/** "25 de diciembre de 2026" — sin día de la semana, con año (días no laborables pueden estar a meses de distancia). */
export function fechaCompleta(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}
