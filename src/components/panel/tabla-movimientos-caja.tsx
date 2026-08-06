import { formatearPrecio } from "@/lib/formato";
import { ETIQUETA_ORIGEN, type MovimientoCaja } from "@/mocks/caja";

const COLUMNAS = "grid-cols-[auto_1fr_2fr_auto]";

export function TablaMovimientosCaja({ movimientos }: { movimientos: MovimientoCaja[] }) {
  if (movimientos.length === 0) {
    return (
      <div className="rounded-card bg-white py-16 text-center text-sm text-grafito shadow-card">Todavía no hay movimientos en este turno.</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Hora</span>
        <span>Origen</span>
        <span>Descripción</span>
        <span className="text-right">Monto</span>
      </div>

      <div className="divide-y divide-borde/60">
        {[...movimientos].reverse().map((mov) => (
          <div key={mov.id} className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4`}>
            <span className="text-sm tabular-nums text-grafito">{mov.hora}</span>
            <span className="text-sm text-tinta">{ETIQUETA_ORIGEN[mov.origen]}</span>
            <span className="min-w-0 truncate text-sm text-tinta">{mov.descripcion}</span>
            <span className={`text-right text-sm font-semibold tabular-nums ${mov.tipo === "INGRESO" ? "text-disponible" : "text-cancelado"}`}>
              {mov.tipo === "INGRESO" ? "+" : "−"}
              {formatearPrecio(mov.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
