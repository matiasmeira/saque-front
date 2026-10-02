const ZONA_AR = "America/Argentina/Buenos_Aires";

/** YYYY-MM-DD de mañana en hora argentina (nunca un turno del día que ya pasó). */
export function mananaISO(ahora: Date = new Date()): string {
  const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_AR }).format(manana);
}
