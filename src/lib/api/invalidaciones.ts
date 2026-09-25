import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalida las dos grillas de disponibilidad de slots.
 *
 * Son dos invalidateQueries y no uno porque cuelgan de prefijos de key que no
 * se contienen entre sí: `keys.disponibilidad(estId, ...)` vive bajo
 * ["disponibilidad"] (grilla del panel / form de carga rápida) y
 * `keys.publico.disponibilidad(slug, ...)` vive bajo ["publico","complejo",
 * slug,...] (ficha pública). No hay forma de cubrir ambas con un solo
 * invalidateQueries por prefijo sin tocar keys.ts — no lo "simplifiques" a
 * una sola llamada.
 *
 * Se invoca desde cualquier mutación que ocupe, libere o redefina un slot:
 * altas/bajas de reservas y turnos fijos, bloqueos de cancha, alta/edición/
 * baja de canchas, horarios de atención y días no laborables.
 */
export function invalidarDisponibilidad(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["disponibilidad"] });
  queryClient.invalidateQueries({ queryKey: ["publico", "complejo"] });
}
