import { formatearPrecio } from "@/lib/formato";
import { ETIQUETA_ORIGEN } from "@/lib/caja";
import { partirFechaHora } from "@/lib/api/fechas";
import type { MovimientoCajaResponse as MovimientoCaja } from "@/lib/api/tipos/caja";
import { EtiquetaMovil } from "@/components/panel/etiqueta-movil";

const COLUMNAS = "md:grid-cols-[auto_1fr_2fr_auto]";

export function TablaMovimientosCaja({ movimientos }: { movimientos: MovimientoCaja[] }) {
  if (movimientos.length === 0) {
    return (
      <div className="rounded-card bg-white py-16 text-center text-sm text-grafito shadow-card">Todavía no hay movimientos en este turno.</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`hidden md:grid ${COLUMNAS} gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Hora</span>
        <span>Origen</span>
        <span>Descripción</span>
        <span className="text-right">Monto</span>
      </div>

      <div className="divide-y divide-borde/60">
        {[...movimientos].reverse().map((mov) => (
          <div key={mov.id} className={`grid grid-cols-2 ${COLUMNAS} gap-3 px-4 py-4 md:items-center md:px-6`}>
            <span className="text-sm tabular-nums text-grafito max-md:[order:-2]">
              <EtiquetaMovil>Hora</EtiquetaMovil>
              {partirFechaHora(mov.fechaHora).hora}
            </span>
            <span className="text-sm text-tinta">
              <EtiquetaMovil>Origen</EtiquetaMovil>
              {ETIQUETA_ORIGEN[mov.origen]}
            </span>
            <span className="min-w-0 truncate text-sm text-tinta max-md:col-span-2 max-md:whitespace-normal">
              <EtiquetaMovil>Descripción</EtiquetaMovil>
              {mov.descripcion}
            </span>
            <span className={`text-right text-sm font-semibold tabular-nums max-md:[order:-1] ${mov.tipo === "INGRESO" ? "text-disponible" : "text-cancelado"}`}>
              <EtiquetaMovil>Monto</EtiquetaMovil>
              {mov.tipo === "INGRESO" ? "+" : "−"}
              {formatearPrecio(mov.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
