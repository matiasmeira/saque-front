import { formatearPrecio } from "@/lib/formato";
import type { ProductoMasVendidoResponse } from "@/lib/api/tipos/buffet";

/**
 * Ranking de productos del buffet en el período, ordenado por unidades.
 *
 * Es lo que reemplaza a la columna "Productos" que tenía la tabla de ventas: el
 * listado del backend no trae el desglose por ítem de cada venta, pero las
 * métricas sí traen el agregado. Para "qué se vende acá" el agregado sirve
 * mejor que leer venta por venta.
 *
 * Sólo cuenta ventas CONFIRMADA.
 */
export function ProductosMasVendidos({ productos }: { productos: ProductoMasVendidoResponse[] }) {
  const maximo = Math.max(...productos.map((p) => p.cantidadVendida), 1);

  return (
    <ol className="space-y-2.5">
      {productos.map((p) => (
        <li key={p.productoId} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm font-semibold text-tinta" title={p.productoNombre}>
            {p.productoNombre}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-humo">
            <div className="h-full rounded-full bg-azul" style={{ width: `${(p.cantidadVendida / maximo) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-sm tabular-nums text-tinta">{p.cantidadVendida}u</span>
          <span className="w-24 shrink-0 text-right text-sm tabular-nums text-grafito">{formatearPrecio(p.ingresoGenerado)}</span>
        </li>
      ))}
    </ol>
  );
}
