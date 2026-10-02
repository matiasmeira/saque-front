/**
 * Decisiones puras del alta de turno en la agenda: si se puede abrir el
 * formulario y con qué cancha arranca. Un turno (suelto o fijo) necesita al
 * menos una cancha, y el formulario no tiene nada que mostrar sin ella.
 */

export type MotivoSinAlta = "cargando" | "error" | "sin-canchas";

export type PuedeCrearTurno = { puede: true } | { puede: false; motivo: MotivoSinAlta; texto: string };

const TEXTOS: Record<MotivoSinAlta, string> = {
  cargando: "Cargando las canchas…",
  error: "No pudimos cargar las canchas. Reintentá en un momento.",
  "sin-canchas": "Cargá una cancha primero",
};

/**
 * `cargando` y `hayError` vienen del estado de la consulta de canchas al
 * server, no de estado local. Mientras carga no se habilita (evita que el botón
 * parpadee habilitado en un complejo sin canchas).
 */
export function puedeCrearTurno(
  canchas: readonly unknown[],
  estado: { cargando: boolean; hayError: boolean },
): PuedeCrearTurno {
  if (estado.cargando) return { puede: false, motivo: "cargando", texto: TEXTOS.cargando };
  if (estado.hayError && canchas.length === 0) return { puede: false, motivo: "error", texto: TEXTOS.error };
  if (canchas.length === 0) return { puede: false, motivo: "sin-canchas", texto: TEXTOS["sin-canchas"] };
  return { puede: true };
}

/**
 * Cancha con la que arranca el formulario: la pedida si existe; si no (por
 * ejemplo `canchaId: 0` desde "Nueva reserva" de la ficha de un cliente), la
 * primera. `null` si no hay ninguna.
 */
export function canchaInicialId(canchas: readonly { id: number }[], canchaId: number): number | null {
  return canchas.find((c) => c.id === canchaId)?.id ?? canchas[0]?.id ?? null;
}
