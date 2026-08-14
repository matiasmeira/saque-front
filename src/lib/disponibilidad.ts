/**
 * Matemática de horarios sobre rangos ocupados + duración del turno.
 *
 * La zona pública YA NO usa esto: /complejo/[slug] consume la grilla real de
 * GET /publico/complejos/{slug}/disponibilidad, que el backend devuelve
 * cruzada contra horarios de atención, días no laborables, bloqueos y
 * reservas. Lo que queda acá sólo lo consume el panel (form-turno-rapido,
 * timeline-agenda y el generador de mocks/agenda), y se va cuando la agenda
 * se migre en la Fase 4.
 */
export type RangoOcupado = { desde: string; hasta: string };

export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function aHHMM(minutosDesdeMedianoche: number): string {
  const total = ((minutosDesdeMedianoche % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizarRango(desde: number, hasta: number): [number, number] {
  return hasta <= desde ? [desde, hasta + 1440] : [desde, hasta];
}

export type Segmento = { desde: number; hasta: number; libre: boolean };

/**
 * Fusiona los rangos ocupados que se solapan o se tocan y devuelve
 * la secuencia completa de segmentos libres/ocupados entre "abre" y
 * "cierra" (en minutos desde medianoche, "cierra" puede cruzar el
 * día). Es lo que dibuja cada barra de la grilla: un tramo reservado
 * corrido es un solo segmento "ocupado", no uno por hora.
 */
export function segmentosDelDia(ocupado: RangoOcupado[], abre: string, cierra: string): Segmento[] {
  const abreMin = aMinutos(abre);
  const [, cierraMin] = normalizarRango(abreMin, aMinutos(cierra));

  const fusionados: [number, number][] = [];
  const rangos = ocupado
    .map((r) => normalizarRango(aMinutos(r.desde), aMinutos(r.hasta)))
    .map(([d, h]) => [Math.max(d, abreMin), Math.min(h, cierraMin)] as [number, number])
    .filter(([d, h]) => h > d)
    .sort((a, b) => a[0] - b[0]);

  for (const rango of rangos) {
    const ultimo = fusionados[fusionados.length - 1];
    if (ultimo && rango[0] <= ultimo[1]) {
      ultimo[1] = Math.max(ultimo[1], rango[1]);
    } else {
      fusionados.push([...rango]);
    }
  }

  const segmentos: Segmento[] = [];
  let cursor = abreMin;
  for (const [d, h] of fusionados) {
    if (d > cursor) segmentos.push({ desde: cursor, hasta: d, libre: true });
    segmentos.push({ desde: d, hasta: h, libre: false });
    cursor = h;
  }
  if (cursor < cierraMin) segmentos.push({ desde: cursor, hasta: cierraMin, libre: true });
  return segmentos;
}

/**
 * Horarios de inicio reservables: cada "paso" minutos, dentro de un
 * segmento libre lo bastante largo para la duración del turno.
 */
export function horariosLibres(
  ocupado: RangoOcupado[],
  duracionMin: number,
  abre: string,
  cierra: string,
  paso = 30,
): string[] {
  const horarios: string[] = [];
  for (const s of segmentosDelDia(ocupado, abre, cierra)) {
    if (!s.libre) continue;
    for (let t = s.desde; t + duracionMin <= s.hasta; t += paso) {
      horarios.push(aHHMM(t));
    }
  }
  return horarios;
}
