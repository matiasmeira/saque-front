import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { etiquetaCategoriaGasto, type Gasto } from "@/lib/panel/gastos";
import { EtiquetaMovil } from "@/components/panel/etiqueta-movil";

const COLUMNAS = "md:grid-cols-[1fr_1fr_2fr_1fr_auto]";

export function TablaGastos({
  gastos,
  onEditar,
  onEliminar,
}: {
  gastos: Gasto[];
  onEditar: (gasto: Gasto) => void;
  onEliminar: (gasto: Gasto) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`hidden md:grid ${COLUMNAS} gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Categoría</span>
        <span>Descripción</span>
        <span>Monto</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {gastos.map((gasto) => (
          <div key={gasto.id} className={`grid grid-cols-2 ${COLUMNAS} gap-3 px-4 py-4 transition-colors hover:bg-humo/60 md:items-center md:px-6`}>
            <span className="text-sm text-tinta max-md:[order:-2]">
              <EtiquetaMovil>Fecha</EtiquetaMovil>
              {fechaLarga(gasto.fecha)}
            </span>
            <span>
              <EtiquetaMovil>Categoría</EtiquetaMovil>
              <span className="inline-flex items-center rounded-full bg-celeste-suave px-2.5 py-1 text-xs font-semibold text-azul">
                {etiquetaCategoriaGasto(gasto.categoria)}
              </span>
            </span>
            <span className="min-w-0 truncate text-sm text-tinta max-md:col-span-2 max-md:whitespace-normal">
              <EtiquetaMovil>Descripción</EtiquetaMovil>
              {gasto.descripcion}
            </span>
            <span className="text-sm font-semibold text-tinta max-md:[order:-1]">
              <EtiquetaMovil>Monto</EtiquetaMovil>
              {formatearPrecio(gasto.monto)}
            </span>
            <span className="flex items-center justify-end gap-1 max-md:col-span-2">
              {gasto.comprobanteUrl && (
                <a
                  href={gasto.comprobanteUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ver comprobante de ${gasto.descripcion}`}
                  title="Ver comprobante"
                  className="flex size-8 max-md:size-11 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  <Paperclip className="size-4" aria-hidden />
                </a>
              )}
              <button
                type="button"
                onClick={() => onEditar(gasto)}
                aria-label={`Editar ${gasto.descripcion}`}
                title="Editar"
                className="flex size-8 max-md:size-11 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(gasto)}
                aria-label={`Eliminar ${gasto.descripcion}`}
                title="Eliminar"
                className="flex size-8 max-md:size-11 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
