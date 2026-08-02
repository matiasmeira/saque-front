import type { OcupacionCancha } from "@/mocks/reportes";

/** Cuál cancha trabaja más — barras simples, sin necesitar recharts para algo tan directo. */
export function OcupacionPorCancha({ datos }: { datos: OcupacionCancha[] }) {
  return (
    <ul className="space-y-2.5">
      {datos.map((c) => (
        <li key={c.canchaId} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm font-semibold text-tinta">{c.canchaNombre}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div className="h-full rounded-full bg-azul" style={{ width: `${c.porcentaje}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-sm tabular-nums text-grafito">{c.porcentaje}%</span>
        </li>
      ))}
    </ul>
  );
}
