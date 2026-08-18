import { formatearPorcentaje } from "@/lib/formato";
import type { OcupacionPorCanchaDto } from "@/lib/api/tipos/reportes";

/**
 * Cuál cancha trabaja más — barras simples, sin necesitar recharts para algo
 * tan directo.
 *
 * El backend devuelve las canchas en su orden natural, no por ocupación: el
 * ranking es una decisión de presentación y se ordena acá.
 */
export function OcupacionPorCancha({ datos }: { datos: OcupacionPorCanchaDto[] }) {
  const ordenadas = [...datos].sort(
    (a, b) => b.porcentajeOcupacion.actual - a.porcentajeOcupacion.actual,
  );

  return (
    <ul className="space-y-2.5">
      {ordenadas.map((c) => (
        <li key={c.canchaId} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm font-semibold text-tinta">{c.canchaNombre}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div
              className="h-full rounded-full bg-azul"
              style={{ width: `${Math.min(c.porcentajeOcupacion.actual, 100)}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-grafito">
            {formatearPorcentaje(c.porcentajeOcupacion.actual)}
          </span>
        </li>
      ))}
    </ul>
  );
}
