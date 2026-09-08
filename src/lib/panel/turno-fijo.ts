import { sumarDias } from "@/lib/fecha";
import { aHHMM, aMin, minutosDeCierre } from "@/lib/horarios";
import { diaSemanaBackDeFecha, type DiaSemanaBack, type FechaISO, type HoraISO } from "@/lib/api/fechas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

/**
 * Aritmética del turno fijo semanal: qué fechas genera un período y hasta dónde
 * puede llegar. Vive acá y no dentro del componente porque es lo único de esta
 * pantalla que se puede testear — el front todavía no tiene setup de tests de
 * componentes — y porque es donde estarían los bugs: bordes de año, la primera
 * ocurrencia, y la medianoche como cierre.
 *
 * Cada función espeja una regla del backend (ver ReservaService.crearReservaSemanal).
 * Espejar no es duplicar la validación: el back sigue siendo el que decide, y estas
 * funciones existen para que el formulario no deje ARMAR un pedido que el back va a
 * rechazar. Si alguna vez divergen, gana el back y el usuario ve su mensaje de error.
 */

const PASO_MINUTOS = 30;
const MINUTOS_POR_DIA = 1440;

/**
 * Última marca ofrecible como hora de fin. No es cosmético: el back recibe un
 * LocalTime (24:00 no existe) y crearReservaSemanal arma inicio y fin sobre la
 * MISMA fecha exigiendo horaInicio < horaFin, así que un turno fijo no puede
 * terminar a medianoche por más que el complejo cierre ahí.
 */
const ULTIMA_MARCA_MINUTOS = MINUTOS_POR_DIA - PASO_MINUTOS;

/**
 * Hasta cuándo puede llegar el período. Espeja
 * ReservaService.validarPeriodoDentroDelAnio: un turno fijo se carga por año
 * calendario y se renueva. Alimenta el `max` del datepicker, así el dueño no
 * puede ni elegir una fecha que el back va a rechazar.
 */
export function topeDelPeriodo(fechaInicioISO: FechaISO): FechaISO {
  return `${fechaInicioISO.slice(0, 4)}-12-31`;
}

/**
 * Las fechas que va a generar el turno fijo. Espeja
 * ReservaService.generarFechasDelPeriodo: arranca en la primera fecha >= inicio
 * que cae en el día pedido (nextOrSame, o sea que el propio inicio cuenta) y
 * avanza de a una semana, con el fin incluido.
 *
 * Se usa para mostrar cuántos turnos se van a crear ANTES de guardar. Con un
 * alta todo-o-nada de hasta 52 reservas, el dueño tiene que ver a qué se está
 * comprometiendo antes de apretar el botón.
 *
 * La comparación de fechas es lexicográfica sobre YYYY-MM-DD, que para ese
 * formato coincide con la cronológica y evita construir Date por iteración.
 */
export function ocurrenciasDelPeriodo(
  desdeISO: FechaISO,
  hastaISO: FechaISO,
  diaSemana: DiaSemanaBack,
): FechaISO[] {
  let fecha = desdeISO;
  while (fecha <= hastaISO && diaSemanaBackDeFecha(fecha) !== diaSemana) {
    fecha = sumarDias(fecha, 1);
  }

  const fechas: FechaISO[] = [];
  while (fecha <= hastaISO) {
    fechas.push(fecha);
    fecha = sumarDias(fecha, 7);
  }
  return fechas;
}

/**
 * Qué ocurrencias se van a dar de baja si se cancela la serie desde `desdeISO`. Espeja el
 * corte del backend: fechaHoraInicio > max(ahora, desde a las 00:00). Se usa para que el
 * diálogo diga cuántos turnos se dan de baja ANTES de confirmar.
 *
 * No filtra por estado: el backend omite las FINALIZADA y AUSENTE y lo informa en el
 * resumen de la respuesta. Acá el conteo es del alcance del corte, no del resultado.
 */
export function ocurrenciasACancelar(
  ocurrenciasISO: string[],
  desdeISO: FechaISO,
  ahoraISO: string,
): string[] {
  const corte = ahoraISO > `${desdeISO}T00:00:00` ? ahoraISO : `${desdeISO}T00:00:00`;
  return ocurrenciasISO.filter((fecha) => fecha > corte);
}

/**
 * Desde cuándo arranca la serie renovada. Espeja TurnoFijoService.renovar: el 1 de enero del
 * año siguiente, o max(ese 1 de enero, hoy) si ya pasó — y si hoy es el mismo día de semana
 * de la serie y la hora del turno ya pasó, mañana en vez de hoy. Sin esa última regla, renovar
 * tarde en el día pediría como primera ocurrencia una fecha ya vencida, y el alta (todo-o-nada)
 * se caería entera por esa sola fecha.
 */
export function inicioDeRenovacion(
  fechaFinPeriodoISO: FechaISO,
  diaSemana: DiaSemanaBack,
  horaInicio: HoraISO,
  ahoraISO: string,
): FechaISO {
  const hoy = ahoraISO.slice(0, 10);
  const primeroDeEnero = `${Number(fechaFinPeriodoISO.slice(0, 4)) + 1}-01-01`;
  if (primeroDeEnero > hoy) return primeroDeEnero;

  const horaYaPaso = diaSemanaBackDeFecha(hoy) === diaSemana && `${hoy}T${horaInicio}` <= ahoraISO;
  return horaYaPaso ? sumarDias(hoy, 1) : hoy;
}

/**
 * Marcas de media hora ofrecibles para un día, acotadas al horario de atención.
 * Un día sin horario cargado (el complejo no abre) no ofrece ninguna.
 *
 * Reusa minutosDeCierre de lib/horarios para que medianoche signifique lo mismo
 * acá que en la grilla de la agenda: el final del día, no el principio.
 */
export function horariosPosiblesDelDia(horario: HorarioAtencionDto | null | undefined): string[] {
  if (!horario) return [];

  const apertura = aMin(horario.horaApertura);
  const cierre = Math.min(minutosDeCierre(horario.horaCierre, apertura), ULTIMA_MARCA_MINUTOS);

  const marcas: string[] = [];
  for (let minuto = apertura; minuto <= cierre; minuto += PASO_MINUTOS) {
    marcas.push(aHHMM(minuto));
  }
  return marcas;
}
