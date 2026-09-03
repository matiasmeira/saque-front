import { aMinutos } from "@/lib/disponibilidad";
import { partirFechaHora } from "@/lib/api/fechas";
import type { RangoHorario } from "@/lib/horarios";
import type { SlotDisponibleResponse } from "@/lib/api/tipos/disponibilidad";

/**
 * Matemática pura para dibujar la grilla horizontal de horarios (A3): a
 * partir de los horarios de INICIO libres que manda el backend —ya cruzados
 * contra horario de atención, bloqueos y reservas— reconstruye, por cancha,
 * los tramos ocupados (fondo gris/verde) y las franjas clickeables (hover).
 *
 * Todo en minutos desde la medianoche de `rango.abre`, con la misma
 * convención que `rangoDeAgenda`/`timeline-agenda.tsx`: un horario que cruza
 * medianoche se representa sumando 1440, nunca con `% 24`.
 */

export type TramoOcupado = { desde: number; hasta: number; propia: boolean };

export type FranjaReservable = {
  desde: number;
  hasta: number;
  inicioISO: string;
  finISO: string;
};

/** Ubica la hora de un ISO datetime en la línea de tiempo extendida de `rango`. */
function minutoDelSlot(iso: string, abreMin: number): number {
  const min = aMinutos(partirFechaHora(iso).hora);
  return min < abreMin ? min + 1440 : min;
}

/**
 * Corta `[desde, hasta)` contra los rangos de reserva propia que se
 * solapan, tagueando cada sub-tramo resultante `propia: true/false`. Un
 * tramo ocupado que sólo colisiona a medias con una reserva propia queda
 * gris-verde-gris.
 */
function cortarTramo(
  desde: number,
  hasta: number,
  propias: { desde: number; hasta: number }[],
): TramoOcupado[] {
  const puntos = new Set<number>([desde, hasta]);
  for (const p of propias) {
    if (p.hasta > desde && p.desde < hasta) {
      puntos.add(Math.max(p.desde, desde));
      puntos.add(Math.min(p.hasta, hasta));
    }
  }
  const ordenados = [...puntos].sort((a, b) => a - b);
  const tramos: TramoOcupado[] = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const d = ordenados[i];
    const h = ordenados[i + 1];
    if (h <= d) continue;
    const propia = propias.some((p) => p.desde <= d && p.hasta >= h);
    tramos.push({ desde: d, hasta: h, propia });
  }
  return tramos;
}

export function agendaDeCancha(
  slotsLibres: SlotDisponibleResponse[],
  duracionMin: number,
  rango: RangoHorario,
  /** En minutos desde medianoche, sin normalizar contra `rango.abre`: la función se encarga. */
  reservasPropias: { desde: number; hasta: number }[],
): { ocupados: TramoOcupado[]; franjas: FranjaReservable[] } {
  const abreMin = aMinutos(rango.abre);
  const cierraMinCrudo = aMinutos(rango.cierra);
  const cierraMin = cierraMinCrudo <= abreMin ? cierraMinCrudo + 1440 : cierraMinCrudo;

  const slots = slotsLibres
    .map((s) => ({ desde: minutoDelSlot(s.inicio, abreMin), inicioISO: s.inicio, finISO: s.fin }))
    .filter((s) => s.desde >= abreMin && s.desde < cierraMin)
    .sort((a, b) => a.desde - b.desde);

  /**
   * Ancho de cada franja clickeable: no siempre es `duracionMin`. El paso
   * entre horarios de inicio puede ser 30 o 60 (según `permiteInicioMediaHora`
   * de cada cancha), así que con una duración mayor al paso, dos slots
   * consecutivos se solapan en el tiempo (ej. duración 90, paso 30: 09:00 y
   * 09:30 comparten media hora). Pintar un rectángulo del ancho completo de
   * la duración por cada slot los dejaría superpuestos en el DOM, y sólo el
   * de más arriba en el z-order sería hoverable. Se recorta al hueco real
   * hasta el próximo inicio para que las franjas nunca se pisen.
   */
  const franjas: FranjaReservable[] = slots
    .map((s, i) => {
      const siguiente = slots[i + 1];
      const ancho = siguiente ? Math.min(duracionMin, siguiente.desde - s.desde) : duracionMin;
      return {
        desde: s.desde,
        hasta: Math.min(s.desde + ancho, cierraMin),
        inicioISO: s.inicioISO,
        finISO: s.finISO,
      };
    })
    .filter((f) => f.hasta > f.desde);

  // Tramos libres reales (para invertirlos a ocupados): unión de [inicio, inicio+duración).
  const libres: [number, number][] = [];
  for (const s of slots) {
    const hasta = Math.min(s.desde + duracionMin, cierraMin);
    const ultimo = libres[libres.length - 1];
    if (ultimo && s.desde <= ultimo[1]) {
      ultimo[1] = Math.max(ultimo[1], hasta);
    } else {
      libres.push([s.desde, hasta]);
    }
  }

  const ocupadosBase: [number, number][] = [];
  let cursor = abreMin;
  for (const [d, h] of libres) {
    if (d > cursor) ocupadosBase.push([cursor, d]);
    cursor = Math.max(cursor, h);
  }
  if (cursor < cierraMin) ocupadosBase.push([cursor, cierraMin]);

  const propiasNormalizadas = reservasPropias.map((p) => {
    const delta = p.desde < abreMin ? 1440 : 0;
    return { desde: p.desde + delta, hasta: p.hasta + delta };
  });

  const ocupados = ocupadosBase.flatMap(([d, h]) => cortarTramo(d, h, propiasNormalizadas));

  return { ocupados, franjas };
}
