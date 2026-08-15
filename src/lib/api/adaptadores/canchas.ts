import type { Bloqueo, Cancha as CanchaPanel, PrecioPorDuracion } from "@/mocks/canchas";
import type { Deporte } from "@/lib/api/tipos/comunes";
import type {
  BloqueoCanchaResponse,
  CanchaRequest,
  CanchaResponse,
} from "@/lib/api/tipos/canchas";

/**
 * Traducción entre el contrato del backend y la forma que usan los formularios
 * del panel.
 *
 * Existe por una razón concreta: form-cancha.tsx concentra la validación más
 * rica del proyecto (pool de canchas, precio por cada duración, solapes) y
 * trabaja con `preciosBase` como ARRAY ORDENADO, que es lo natural para
 * renderizar un formulario. El backend usa un Map. Adaptar en el borde
 * conserva esa validación en vez de reescribir 410 líneas.
 *
 * Los cuatro renombres que traduce:
 *   preciosBase: {duracionMinutos, precio}[]  ↔  preciosPorDuracion: Record<string, number>
 *   canchasFisicas: number[]                  ↔  canchasFisicasIds: number[]
 *   canchasNecesarias                         ↔  cantidadCanchasNecesarias
 *   mantenimientos: Bloqueo[]                 ↔  (endpoints aparte de bloqueos)
 */

/** Datos que emite form-cancha al guardar. */
export type DatosCancha = {
  nombre: string;
  deportes: string[];
  capacidad: number;
  isActive: boolean;
  preciosBase: PrecioPorDuracion[];
  montoSena: number;
  duracionesPermitidas: number[];
  permiteInicioMediaHora: boolean;
  canchasFisicas: number[];
  canchasNecesarias: number | null;
};

/**
 * `mantenimientos` llega vacío: los bloqueos viven en endpoints propios y la
 * pantalla los pide aparte para la cancha que se está editando.
 */
export function aCanchaPanel(cancha: CanchaResponse): CanchaPanel {
  return {
    id: cancha.id,
    nombre: cancha.nombre,
    deportes: cancha.deportes,
    capacidad: cancha.capacidad,
    isActive: cancha.isActive,
    canchasFisicas: cancha.canchasFisicasIds,
    canchasNecesarias: cancha.cantidadCanchasNecesarias,
    preciosBase: cancha.duracionesPermitidas.map((duracionMinutos) => ({
      duracionMinutos,
      // Las claves de un objeto JSON son strings, aunque en Java sea
      // Map<Integer, BigDecimal>.
      precio: cancha.preciosPorDuracion[String(duracionMinutos)] ?? 0,
    })),
    montoSena: cancha.montoSena ?? 0,
    duracionesPermitidas: cancha.duracionesPermitidas,
    permiteInicioMediaHora: cancha.permiteInicioMediaHora,
    mantenimientos: [],
  };
}

export function aCanchaRequest(datos: DatosCancha): CanchaRequest {
  const preciosPorDuracion = Object.fromEntries(
    datos.preciosBase.map((p) => [String(p.duracionMinutos), p.precio]),
  );

  // El backend exige precioBase (@NotNull @Positive) ADEMÁS del map por
  // duración; el formulario sólo pide precio por duración. Se deriva del
  // turno más corto, que es el precio "desde" que el complejo publica.
  const precioBase =
    datos.preciosBase.length > 0
      ? [...datos.preciosBase].sort((a, b) => a.duracionMinutos - b.duracionMinutos)[0].precio
      : 0;

  return {
    nombre: datos.nombre,
    deportes: datos.deportes as Deporte[],
    capacidad: datos.capacidad,
    precioBase,
    montoSena: datos.montoSena,
    duracionesPermitidas: datos.duracionesPermitidas,
    preciosPorDuracion,
    permiteInicioMediaHora: datos.permiteInicioMediaHora,
    canchasFisicasIds: datos.canchasFisicas,
    cantidadCanchasNecesarias: datos.canchasNecesarias,
    // Las tarifas viajan dentro de CanchaRequest, pero se editan en
    // /panel/precios. Omitirlas acá las deja intactas: el backend sólo las
    // reemplaza si la clave viene presente.
  };
}

/** El mock usa "YYYY-MM-DDTHH:MM" (lo que produce un input datetime-local). */
export function aBloqueoPanel(bloqueo: BloqueoCanchaResponse): Bloqueo {
  return {
    desde: bloqueo.fechaInicio.slice(0, 16),
    hasta: bloqueo.fechaFin.slice(0, 16),
    motivo: bloqueo.motivo ?? undefined,
  };
}

/** Un datetime-local no trae segundos y el backend espera LocalDateTime. */
export function aFechaHoraBloqueo(datetimeLocal: string): string {
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}
