import type { Deporte } from "@/lib/api/tipos/comunes";

/**
 * Modo de un slot de la grilla: reservable (lleva a `/reservar/{slug}`) o
 * sólo lectura (vista previa del panel/admin, sin slug público todavía). La
 * unión obliga a que el slug viaje siempre junto con el modo reservable —
 * no puede quedar un slug suelto y opcional sin relación con el modo.
 */
export type ModoGrilla = { soloLectura: true } | { soloLectura?: false; slug: string };

export type DatosSlot = {
  canchaId: number;
  inicioISO: string;
  finISO: string;
  deporte: Deporte;
};

/**
 * `null` en sólo lectura: no hay ruta a la que navegar. En modo reservable,
 * la URL exacta que espera /reservar/[id] — inicio y fin viajan tal cual,
 * sin recalcular (ver comentario en grilla-disponibilidad.tsx).
 */
export function hrefDeSlot(modo: ModoGrilla, slot: DatosSlot): string | null {
  if (modo.soloLectura) return null;
  return `/reservar/${modo.slug}?cancha=${slot.canchaId}&inicio=${slot.inicioISO}&fin=${slot.finISO}&deporte=${slot.deporte}`;
}

/**
 * En sólo lectura el slot no es una acción: la etiqueta describe el estado
 * ("libre de X a Y"), no invita a reservar.
 */
export function etiquetaSlot(
  modo: ModoGrilla,
  canchaNombre: string,
  horaInicio: string,
  horaFin: string,
): string {
  return modo.soloLectura
    ? `${canchaNombre}: libre de ${horaInicio} a ${horaFin}`
    : `Reservar ${canchaNombre} de ${horaInicio} a ${horaFin}`;
}
