import { formatearPrecio } from "@/lib/formato";
import { etiquetaMetodoPago } from "@/lib/metodos-pago";
import type { DesglosePorMetodoPagoDto } from "@/lib/api/tipos/reportes";

/**
 * Facturación por método real de pago — reemplaza la vieja distinción
 * online/mostrador, que no existe en el backend.
 *
 * El backend manda SÓLO los métodos que tuvieron movimiento en el período (dos
 * filas si se cobró en efectivo y por Mercado Pago, no las cinco), cada uno con
 * su comparativo. Acá se muestra el período actual: la comparación por método
 * sería ruido dentro de una barra, y el número contra el período anterior ya
 * está arriba, en la KPI de facturación total.
 */
export function DesglosePorMetodo({ datos }: { datos: DesglosePorMetodoPagoDto[] }) {
  const visibles = [...datos].sort((a, b) => b.monto.actual - a.monto.actual);
  const total = visibles.reduce((acc, d) => acc + d.monto.actual, 0) || 1;

  return (
    <ul className="space-y-2.5">
      {visibles.map((d) => (
        <li key={d.metodoPago} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm font-semibold text-tinta">{etiquetaMetodoPago(d.metodoPago)}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div className="h-full rounded-full bg-azul" style={{ width: `${(d.monto.actual / total) * 100}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-grafito">{formatearPrecio(d.monto.actual)}</span>
        </li>
      ))}
    </ul>
  );
}
