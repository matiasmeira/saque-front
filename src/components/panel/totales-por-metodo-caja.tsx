import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import type { MetodoPago } from "@/lib/api/tipos/comunes";

/** Totales informativos por método de pago del turno — no afecta el saldo teórico (solo efectivo). */
export function TotalesPorMetodoCaja({ totales }: { totales: Record<MetodoPago, number> }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {METODOS_PAGO.map((m) => (
        <div key={m.valor} className="rounded-card bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{m.etiqueta}</p>
          <p className="mt-2 font-display text-lg font-extrabold tabular-nums text-tinta">{formatearPrecio(totales[m.valor])}</p>
        </div>
      ))}
    </div>
  );
}
