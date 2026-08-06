import { PackagePlus, Pencil } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { estadoStock, type EstadoStock, type ProductoBuffet } from "@/mocks/buffet";

const ESTILO_ESTADO: Record<EstadoStock, string> = {
  ok: "bg-disponible-suave text-disponible",
  bajo: "bg-pendiente-suave text-pendiente",
  agotado: "bg-cancelado-suave text-cancelado",
};

const ETIQUETA_ESTADO: Record<EstadoStock, string> = {
  ok: "OK",
  bajo: "Stock bajo",
  agotado: "Agotado",
};

const COLUMNAS = "grid-cols-[2fr_1fr_1fr_1.2fr_auto]";

/** Gestión (editar / ajustar stock) es solo dueño — con ver_stock_buffet un empleado ve esta misma tabla pero sin esas acciones (ver page.tsx). */
export function TablaProductosBuffet({
  productos,
  puedeGestionar,
  onEditar,
  onAjustarStock,
}: {
  productos: ProductoBuffet[];
  puedeGestionar: boolean;
  onEditar: (producto: ProductoBuffet) => void;
  onAjustarStock: (producto: ProductoBuffet) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {productos.map((producto) => {
          const estado = estadoStock(producto);
          return (
            <div
              key={producto.id}
              className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4 transition-colors hover:bg-humo/60`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-tinta">{producto.nombre}</span>
                {producto.descripcion && <span className="block truncate text-xs text-grafito">{producto.descripcion}</span>}
              </span>
              <span className="text-sm text-tinta">{formatearPrecio(producto.precio)}</span>
              <span className="text-sm text-tinta">{producto.stock}</span>
              <span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_ESTADO[estado]}`}>
                  {ETIQUETA_ESTADO[estado]}
                </span>
              </span>
              <span className="flex items-center justify-end gap-1">
                {puedeGestionar && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAjustarStock(producto)}
                      aria-label={`Ajustar stock de ${producto.nombre}`}
                      title="Ajustar stock"
                      className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                    >
                      <PackagePlus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditar(producto)}
                      aria-label={`Editar ${producto.nombre}`}
                      title="Editar"
                      className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
