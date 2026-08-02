import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";

function etiquetaMetodo(metodo: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? metodo;
}

/** Facturación por método real de pago — reemplaza la vieja distinción online/mostrador, que no existe en el backend. */
export function DesglosePorMetodo({ datos }: { datos: { metodo: MetodoPago; monto: number }[] }) {
  const total = datos.reduce((acc, d) => acc + d.monto, 0) || 1;

  return (
    <ul className="space-y-2.5">
      {datos.map((d) => (
        <li key={d.metodo} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm font-semibold text-tinta">{etiquetaMetodo(d.metodo)}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div className="h-full rounded-full bg-azul" style={{ width: `${(d.monto / total) * 100}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-grafito">{formatearPrecio(d.monto)}</span>
        </li>
      ))}
    </ul>
  );
}
