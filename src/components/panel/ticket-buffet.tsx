import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import type { MetodoPago } from "@/lib/api/tipos/comunes";
import type { ProductoBuffetResponse as ProductoBuffet } from "@/lib/api/tipos/buffet";

export type LineaTicket = { producto: ProductoBuffet; cantidad: number; subtotal: number };

function chipClase(activo: boolean) {
  return `h-9 rounded-full px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
    activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
  }`;
}

/**
 * El ticket es la mitad del punto de venta que no se toca con las
 * manos llenas: sumar viene de la grilla (más toques ahí, es lo que
 * se repite), acá solo se corrige o se cierra. "Cargar a un turno" y
 * el medio de pago quedan siempre visibles, no atrás de un paso
 * extra — es lo último que se toca antes de cobrar.
 */
export function TicketBuffet({
  lineas,
  total,
  turnos,
  turnoId,
  onCambiarTurno,
  metodoPago,
  onCambiarMetodo,
  onIncrementar,
  onDecrementar,
  onQuitar,
  onCobrar,
  avisoUltimaVenta,
}: {
  lineas: LineaTicket[];
  total: number;
  turnos: { id: string; label: string }[];
  turnoId: string;
  onCambiarTurno: (id: string) => void;
  metodoPago: MetodoPago | null;
  onCambiarMetodo: (metodo: MetodoPago) => void;
  onIncrementar: (productoId: number) => void;
  onDecrementar: (productoId: number) => void;
  onQuitar: (productoId: number) => void;
  onCobrar: () => void;
  avisoUltimaVenta: number | null;
}) {
  const puedeCobrar = lineas.length > 0 && metodoPago !== null;

  return (
    <div className="flex h-full flex-col rounded-card bg-white p-6 shadow-card">
      <p className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-tinta">
        <ShoppingCart className="size-4 shrink-0" aria-hidden />
        Ticket
      </p>

      {avisoUltimaVenta !== null && (
        <div className="mb-3 rounded-input bg-disponible-suave px-3 py-2 text-sm font-semibold text-disponible">
          Venta registrada — {formatearPrecio(avisoUltimaVenta)}
        </div>
      )}

      {lineas.length === 0 ? (
        <p className="flex-1 text-sm text-grafito">Tocá un producto para empezar a cargar el ticket.</p>
      ) : (
        <ul className="flex-1 space-y-2 overflow-y-auto">
          {lineas.map((l) => (
            <li key={l.producto.id} className="rounded-input bg-humo p-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-semibold text-tinta">{l.producto.nombre}</span>
                <button type="button" onClick={() => onQuitar(l.producto.id)} aria-label={`Quitar ${l.producto.nombre} del ticket`} className="shrink-0 text-grafito hover:text-cancelado">
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDecrementar(l.producto.id)}
                    aria-label={`Restar una unidad de ${l.producto.nombre}`}
                    className="flex size-6 items-center justify-center rounded-full bg-white text-tinta transition-colors hover:bg-borde"
                  >
                    <Minus className="size-3" aria-hidden />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-tinta">{l.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => onIncrementar(l.producto.id)}
                    disabled={l.cantidad >= l.producto.stock}
                    aria-label={`Sumar una unidad de ${l.producto.nombre}`}
                    className="flex size-6 items-center justify-center rounded-full bg-white text-tinta transition-colors hover:bg-borde disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-3" aria-hidden />
                  </button>
                </div>
                <span className="text-sm font-semibold text-tinta">{formatearPrecio(l.subtotal)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 space-y-3 border-t border-humo pt-3">
        <div>
          <label htmlFor="ticket-turno" className="mb-1 block text-xs font-semibold text-grafito">
            ¿Cargar a un turno?
          </label>
          <select
            id="ticket-turno"
            value={turnoId}
            onChange={(e) => onCambiarTurno(e.target.value)}
            className="w-full rounded-input bg-humo px-3.5 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            <option value="">Venta suelta (sin turno)</option>
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-grafito">Medio de pago</p>
          <div className="flex flex-wrap gap-1.5">
            {METODOS_PAGO.map((m) => (
              <button key={m.valor} type="button" aria-pressed={metodoPago === m.valor} onClick={() => onCambiarMetodo(m.valor)} className={chipClase(metodoPago === m.valor)}>
                {m.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-grafito">Total</span>
          <span className="font-display text-3xl font-extrabold tabular-nums text-tinta">{formatearPrecio(total)}</span>
        </div>

        <button
          type="button"
          onClick={onCobrar}
          disabled={!puedeCobrar}
          className="flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          Cobrar {lineas.length > 0 && formatearPrecio(total)}
        </button>
      </div>
    </div>
  );
}
