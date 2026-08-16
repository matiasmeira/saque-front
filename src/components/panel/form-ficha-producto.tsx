"use client";

import { useState, type FormEvent } from "react";
import { UMBRAL_STOCK_BAJO_POR_DEFECTO } from "@/lib/stock";
import type { ProductoBuffetResponse as ProductoBuffet } from "@/lib/api/tipos/buffet";

export type DatosProducto = { nombre: string; descripcion: string; precio: number; stock?: number; umbralAlerta: number };

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Alta y edición comparten el mismo form (mismo patrón que
 * FormCancha/FormFichaEmpleado). El stock inicial solo se pide al dar
 * de alta — después se toca con "Ajustar stock" (+N unidades) desde
 * la tabla, nunca reescribiendo el número acá: así queda claro que
 * llegó mercadería nueva, en vez de "corregir" un número a mano.
 */
export function FormFichaProducto({
  producto,
  onGuardar,
  onCancelar,
}: {
  /** null = alta de un producto nuevo */
  producto: ProductoBuffet | null;
  onGuardar: (datos: DatosProducto) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto?.precio ?? 0);
  const [stock, setStock] = useState(0);
  const [umbralAlerta, setUmbralAlerta] = useState(producto?.umbralAlerta ?? UMBRAL_STOCK_BAJO_POR_DEFECTO);
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre.");
    if (umbralAlerta < 0) return setError("El umbral de alerta no puede ser negativo.");
    if (precio <= 0) return setError("El precio tiene que ser mayor a 0.");
    setError(null);
    onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), precio, stock: producto ? undefined : stock, umbralAlerta });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="producto-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre
        </label>
        <input id="producto-nombre" required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="producto-descripcion" className="mb-1 block text-xs font-semibold text-grafito">
          Descripción (opcional)
        </label>
        <input id="producto-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="producto-precio" className="mb-1 block text-xs font-semibold text-grafito">
          Precio
        </label>
        <input
          id="producto-precio"
          type="number"
          min={0}
          required
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          className={campoClase}
        />
      </div>

      {!producto && (
        <div>
          <label htmlFor="producto-stock" className="mb-1 block text-xs font-semibold text-grafito">
            Stock inicial
          </label>
          <input
            id="producto-stock"
            type="number"
            min={0}
            required
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className={campoClase}
          />
        </div>
      )}

      <div>
        <label htmlFor="producto-umbral" className="mb-1 block text-xs font-semibold text-grafito">
          Umbral de alerta
        </label>
        <input
          id="producto-umbral"
          type="number"
          min={0}
          required
          value={umbralAlerta}
          onChange={(e) => setUmbralAlerta(Number(e.target.value))}
          className={campoClase}
        />
        <p className="mt-1 text-xs text-grafito">
          Con stock igual o menor a este número, el producto se marca &ldquo;Stock bajo&rdquo;.
        </p>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
