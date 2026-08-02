import { formatearPrecio } from "@/lib/formato";
import type { ProductoBuffet } from "@/mocks/buffet";

/**
 * Botones grandes, tocables — este es el punto de venta que el
 * empleado usa parado, con gente esperando. Un toque suma una unidad
 * al ticket; si ya no hay más stock disponible (agotado, o el ticket
 * ya tiene todo lo que queda), el botón se deshabilita en vez de
 * dejar seguir sumando de más.
 */
export function GrillaProductosVenta({
  productos,
  cantidadesEnTicket,
  onAgregar,
}: {
  productos: ProductoBuffet[];
  cantidadesEnTicket: Record<number, number>;
  onAgregar: (producto: ProductoBuffet) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {productos.map((producto) => {
        const enTicket = cantidadesEnTicket[producto.id] ?? 0;
        const sinStock = producto.stock === 0 || enTicket >= producto.stock;
        return (
          <button
            key={producto.id}
            type="button"
            disabled={sinStock}
            onClick={() => onAgregar(producto)}
            className={`relative flex flex-col items-start gap-1 rounded-card p-4 text-left transition-colors ${
              sinStock ? "cursor-not-allowed bg-humo/70 opacity-60" : "bg-white hover:bg-celeste-suave/40"
            }`}
          >
            {enTicket > 0 && (
              <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-azul text-xs font-bold text-white">
                {enTicket}
              </span>
            )}
            <span className="pr-6 font-display text-sm font-bold text-tinta">{producto.nombre}</span>
            <span className="text-sm text-grafito">{formatearPrecio(producto.precio)}</span>
            <span className={`mt-1 text-xs font-semibold ${producto.stock === 0 ? "text-cancelado" : "text-grafito"}`}>
              {producto.stock === 0 ? "Sin stock" : `${producto.stock} en stock`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
