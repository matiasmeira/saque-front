/** "$24.000" — separador de miles es-AR, sin decimales. Se repetía suelto en cada componente. */
export function formatearPrecio(monto: number) {
  return `$${monto.toLocaleString("es-AR")}`;
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
