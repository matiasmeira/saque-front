import { formatearPrecio } from "@/lib/formato";
import { etiquetaCategoriaGasto, type CategoriaGasto } from "@/lib/panel/gastos";

/** Bar-list manual, mismo patrón que DesglosePorMetodo (facturación). */
export function DesgloseGastosCategoria({ datos }: { datos: { categoria: CategoriaGasto; monto: number }[] }) {
  const total = datos.reduce((acc, d) => acc + d.monto, 0) || 1;

  return (
    <ul className="space-y-2.5">
      {datos.map((d) => (
        <li key={d.categoria} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm font-semibold text-tinta">{etiquetaCategoriaGasto(d.categoria)}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div className="h-full rounded-full bg-azul" style={{ width: `${(d.monto / total) * 100}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-grafito">{formatearPrecio(d.monto)}</span>
        </li>
      ))}
    </ul>
  );
}
