import { diaSemanaBackDeFecha } from "@/lib/api/fechas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

export type RangoHorario = { abre: string; cierra: string };

/**
 * Cuando no hay de dónde sacarlo. Pasa con un EMPLEADO: el perfil le da el
 * `establecimientoId` pero no hay endpoint que devuelva ESE establecimiento
 * (`GET /establecimientos` lista los propios del dueño y no existe
 * `GET /establecimientos/{id}`), así que sus horarios de atención no le llegan.
 */
const POR_DEFECTO: RangoHorario = { abre: "08:00", cierra: "24:00" };

function aMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** Medianoche como CIERRE es el final del día, no el principio. */
function minutosDeCierre(hhmm: string, apertura: number): number {
  const min = aMin(hhmm);
  return min <= apertura ? min + 1440 : min;
}

/**
 * De qué hora a qué hora se dibuja la grilla de la agenda.
 *
 * Antes era una constante del mock: 09 a 24, iguales para todos los complejos y
 * todos los días. Un complejo que abre a las 07 tenía sus primeros turnos
 * dibujados en una fila negativa, o sea invisibles.
 *
 * Se toma la unión de los horarios de atención de los días visibles (en la
 * vista semanal son siete, y no tienen por qué coincidir) y además la de todo
 * lo que haya que dibujar: un turno cargado fuera del horario de atención —
 * pasa, el dueño lo carga a mano — tiene que verse igual. Los extremos se
 * redondean a la hora en punto para que las filas de la grilla cierren.
 */
export function rangoDeAgenda(
  horarios: HorarioAtencionDto[] | null | undefined,
  fechas: string[],
  ocupados: { horaInicio: string; horaFin: string }[],
): RangoHorario {
  let desde: number | null = null;
  let hasta: number | null = null;

  const fold = (inicio: number, fin: number) => {
    desde = desde === null ? inicio : Math.min(desde, inicio);
    hasta = hasta === null ? fin : Math.max(hasta, fin);
  };

  for (const fecha of fechas) {
    const dia = horarios?.find((h) => h.diaSemana === diaSemanaBackDeFecha(fecha));
    if (!dia) continue;
    const apertura = aMin(dia.horaApertura);
    fold(apertura, minutosDeCierre(dia.horaCierre, apertura));
  }

  for (const ocupado of ocupados) {
    const inicio = aMin(ocupado.horaInicio);
    fold(inicio, minutosDeCierre(ocupado.horaFin, inicio));
  }

  if (desde === null || hasta === null) return POR_DEFECTO;

  const abre = Math.floor(desde / 60) * 60;
  const cierra = Math.min(Math.ceil(hasta / 60) * 60, 2880);
  // Un rango degenerado (todo el día cerrado y un solo turno puntual) rompería
  // la grilla: siempre al menos una hora.
  return { abre: aHHMM(abre), cierra: aHHMM(Math.max(cierra, abre + 60)) };
}
