import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";
import type { Venta } from "@/mocks/buffet";

const ICONO_METODO: Record<MetodoPago, typeof Banknote> = {
  EFECTIVO: Banknote,
  TRANSFERENCIA: Landmark,
  MERCADO_PAGO: Wallet,
  TARJETA_DEBITO: CreditCard,
  TARJETA_CREDITO: CreditCard,
};

function etiquetaMetodo(metodo: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? metodo;
}

/** "29/07 14:30" */
function fechaHoraCorta(fechaHora: string): string {
  return `${fechaHora.slice(8, 10)}/${fechaHora.slice(5, 7)} ${fechaHora.slice(11, 16)}`;
}

function resumenProductos(venta: Venta): string {
  return venta.detalles.map((d) => `${d.cantidad}× ${d.productoNombre}`).join(", ");
}

const COLUMNAS = "grid-cols-[1fr_2.2fr_1fr_1.3fr_1fr_1fr]";

/** Detalle de ventas del buffet — separado de TablaPagos a propósito: es otra entidad (Venta, no Pago), nunca tiene comisión de Saque. */
export function TablaVentasBuffet({ ventas }: { ventas: Venta[] }) {
  return (
    <div className="overflow-hidden rounded-card bg-white">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Productos</span>
        <span>Turno</span>
        <span>Medio de pago</span>
        <span>Total</span>
        <span>Estado</span>
      </div>

      {ventas.map((venta, indice) => {
        const IconoMetodo = ICONO_METODO[venta.metodoPago];
        const cancelada = venta.estado === "CANCELADA";
        return (
          <div
            key={venta.id}
            className={`grid ${COLUMNAS} items-center gap-3 px-4 py-3 ${indice % 2 === 1 ? "bg-humo/50" : "bg-white"}`}
          >
            <span className="text-sm text-grafito">{fechaHoraCorta(venta.fechaHora)}</span>
            <span className={`truncate text-sm ${cancelada ? "text-grafito line-through" : "text-tinta"}`} title={resumenProductos(venta)}>
              {resumenProductos(venta)}
            </span>
            <span className="text-sm text-grafito">{venta.reservaId ? "Con turno" : "Suelta"}</span>
            <span className="flex items-center gap-1.5 text-sm text-tinta">
              <IconoMetodo className="size-3.5 shrink-0 text-grafito" aria-hidden />
              {etiquetaMetodo(venta.metodoPago)}
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
          </div>
        );
      })}
    </div>
  );
}
