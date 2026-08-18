import { Ban } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { etiquetaMetodoPago, iconoMetodoPago } from "@/lib/metodos-pago";
import type { VentaResumenResponse } from "@/lib/api/tipos/buffet";

/** "29/07 14:30" */
function fechaHoraCorta(fechaHora: string): string {
  return `${fechaHora.slice(8, 10)}/${fechaHora.slice(5, 7)} ${fechaHora.slice(11, 16)}`;
}

const COLUMNAS = "grid-cols-[1fr_0.7fr_0.9fr_1.4fr_1fr_1fr_auto]";

/**
 * Detalle de ventas del buffet.
 *
 * El listado del backend (`VentaResumenResponse`) NO trae el desglose por ítem
 * — sólo el total de cada venta. Por eso la columna "Productos" que tenía el
 * mock ya no está: lo más parecido que existe es el ranking agregado del
 * período, que la pantalla muestra aparte. Acá va el número de venta, que es
 * con lo que se la busca contra el ticket.
 */
export function TablaVentasBuffet({
  ventas,
  onCancelar,
}: {
  ventas: VentaResumenResponse[];
  onCancelar?: (venta: VentaResumenResponse) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Venta</span>
        <span>Turno</span>
        <span>Medio de pago</span>
        <span>Total</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {ventas.map((venta) => {
          const IconoMetodo = iconoMetodoPago(venta.metodoPago);
          const cancelada = venta.estado === "CANCELADA";
          return (
            <div key={venta.id} className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4 transition-colors hover:bg-humo/60`}>
              <span className="text-sm text-grafito">{fechaHoraCorta(venta.fechaHora)}</span>
              <span className="text-sm tabular-nums text-grafito">#{venta.id}</span>
              <span className="text-sm text-grafito">{venta.reservaId ? `Turno #${venta.reservaId}` : "Suelta"}</span>
              <span className="flex items-center gap-1.5 text-sm text-tinta">
                <IconoMetodo className="size-3.5 shrink-0 text-grafito" aria-hidden />
                {etiquetaMetodoPago(venta.metodoPago)}
              </span>
              <span className={`text-sm font-semibold ${cancelada ? "text-grafito line-through" : "text-tinta"}`}>{formatearPrecio(venta.total)}</span>
              <span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    cancelada ? "bg-cancelado-suave text-cancelado" : "bg-disponible-suave text-disponible"
                  }`}
                >
                  {cancelada ? "Cancelada" : "Confirmada"}
                </span>
              </span>
              <span className="flex justify-end">
                {onCancelar && !cancelada && (
                  <button
                    type="button"
                    onClick={() => onCancelar(venta)}
                    aria-label={`Cancelar la venta #${venta.id}`}
                    title="Cancelar la venta y devolver el stock"
                    className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-cancelado-suave hover:text-cancelado focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    <Ban className="size-4" aria-hidden />
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
