import { DIA_SEMANA_A_BACK, DIA_SEMANA_DESDE_BACK, aHoraBack } from "./fechas";
import type { TarifaDto } from "./tipos/canchas";
import type { PrecioPorDuracion } from "@/mocks/canchas";
import type { DiaSemana, Tarifa } from "@/mocks/tarifas";

/**
 * Traducción entre los dos modelos de tarifa.
 *
 * El front piensa "estos días, en esta franja, a este precio" (`dias[]`). El
 * backend guarda UNA fila por día (`TarifaDto.diaSemana`). Una tarifa de lunes
 * a viernes son cinco TarifaDto.
 *
 * Las tarifas viajan DENTRO de CanchaRequest: no hay endpoint granular para
 * editarlas. Cambiar una es leer la cancha, mutar el array y hacer un PUT
 * completo (ver /panel/precios).
 */

/** Orden de la semana, para que los días agrupados salgan siempre igual. */
const ORDEN_DIAS: DiaSemana[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/**
 * Dos filas se agrupan sólo si comparten franja Y precios. Si el sábado sale
 * más caro que el lunes en el mismo horario, son dos tarifas distintas.
 */
function claveDeAgrupacion(dto: TarifaDto): string {
  return [
    dto.horaInicio,
    dto.horaFin,
    dto.precio,
    JSON.stringify(dto.preciosPorDuracion ?? {}),
  ].join("|");
}

function aPrecios(dto: TarifaDto): PrecioPorDuracion[] {
  const mapa = dto.preciosPorDuracion ?? {};
  return Object.entries(mapa)
    .map(([duracion, precio]) => ({ duracionMinutos: Number(duracion), precio }))
    .sort((a, b) => a.duracionMinutos - b.duracionMinutos);
}

export function aTarifasPanel(dtos: TarifaDto[], canchaId: number): Tarifa[] {
  const grupos = new Map<string, { dto: TarifaDto; dias: DiaSemana[] }>();

  for (const dto of dtos) {
    const clave = claveDeAgrupacion(dto);
    const dia = DIA_SEMANA_DESDE_BACK[dto.diaSemana];
    const existente = grupos.get(clave);
    if (existente) {
      existente.dias.push(dia);
    } else {
      grupos.set(clave, { dto, dias: [dia] });
    }
  }

  return [...grupos.values()].map(({ dto, dias }, indice) => ({
    // El backend no expone un id de tarifa dentro de CanchaResponse: TarifaDto
    // no lo trae. El índice alcanza como key de React y para identificar cuál
    // se está editando dentro del array de la cancha.
    id: indice,
    canchaId,
    dias: ORDEN_DIAS.filter((d) => dias.includes(d)),
    horaDesde: dto.horaInicio.slice(0, 5),
    horaHasta: dto.horaFin.slice(0, 5),
    precios: aPrecios(dto),
  }));
}

export function aTarifasDto(tarifas: Tarifa[]): TarifaDto[] {
  return tarifas.flatMap((tarifa) => {
    const preciosPorDuracion = Object.fromEntries(
      tarifa.precios.map((p) => [String(p.duracionMinutos), p.precio]),
    );
    // Igual que en CanchaRequest, el backend pide un `precio` suelto además
    // del map por duración: se usa el del turno más corto.
    const precio =
      tarifa.precios.length > 0
        ? [...tarifa.precios].sort((a, b) => a.duracionMinutos - b.duracionMinutos)[0].precio
        : 0;

    return tarifa.dias.map((dia) => ({
      diaSemana: DIA_SEMANA_A_BACK[dia],
      horaInicio: aHoraBack(tarifa.horaDesde),
      horaFin: aHoraBack(tarifa.horaHasta),
      precio,
      preciosPorDuracion,
    }));
  });
}
