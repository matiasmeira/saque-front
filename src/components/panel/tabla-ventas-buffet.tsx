import { Ban } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { etiquetaMetodoPago, iconoMetodoPago } from "@/lib/metodos-pago";
import type { VentaResumenResponse } from "@/lib/api/tipos/buffet";
import { EtiquetaMovil } from "@/components/panel/etiqueta-movil";

/** "29/07 14:30" */
function fechaHoraCorta(fechaHora: string): string {
  return `${fechaHora.slice(8, 10)}/${fechaHora.slice(5, 7)} ${fechaHora.slice(11, 16)}`;
}

const COLUMNAS = "md:grid-cols-[1fr_0.7fr_0.9fr_1.4fr_1fr_1fr_auto]";

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
      <div className={`hidden md:grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
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
            <div key={venta.id} className={`grid grid-cols-2 ${COLUMNAS} gap-3 px-4 py-4 transition-colors hover:bg-humo/60 md:items-center md:px-6`}>
              <span className="text-sm text-grafito max-md:[order:-2]">
                <EtiquetaMovil>Fecha</EtiquetaMovil>
                {fechaHoraCorta(venta.fechaHora)}
              </span>
              <span className="text-sm tabular-nums text-grafito">
                <EtiquetaMovil>Venta</EtiquetaMovil>#{venta.id}
              </span>
              <span className="text-sm text-grafito">
                <EtiquetaMovil>Turno</EtiquetaMovil>
                {venta.reservaId ? `Turno #${venta.reservaId}` : "Suelta"}
              </span>
              <span>
                <EtiquetaMovil>Medio de pago</EtiquetaMovil>
                <span className="flex items-center gap-1.5 text-sm text-tinta">
                  <IconoMetodo className="size-3.5 shrink-0 text-grafito" aria-hidden />
                  {etiquetaMetodoPago(venta.metodoPago)}
                </span>
              </span>
              <span className="max-md:[order:-1] md:contents">
                <EtiquetaMovil>Total</EtiquetaMovil>
                <span className={`text-sm font-semibold ${cancelada ? "text-grafito line-through" : "text-tinta"}`}>
                  {formatearPrecio(venta.total)}
                </span>
              </span>
              <span>
                <EtiquetaMovil>Estado</EtiquetaMovil>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    cancelada ? "bg-cancelado-suave text-cancelado" : "bg-disponible-suave text-disponible"
                  }`}
                >
                  {cancelada ? "Cancelada" : "Confirmada"}
                </span>
              </span>
              <span className="flex justify-end max-md:col-span-2 max-md:empty:hidden">
                {onCancelar && !cancelada && (
                  <button
                    type="button"
                    onClick={() => onCancelar(venta)}
                    aria-label={`Cancelar la venta #${venta.id}`}
                    title="Cancelar la venta y devolver el stock"
                    className="flex size-9 max-md:size-11 items-center justify-center rounded-full text-grafito transition-colors hover:bg-cancelado-suave hover:text-cancelado focus:outline-none focus:ring-2 focus:ring-celeste"
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
