"use client";

import { useState, type FormEvent } from "react";
import type { ProductoBuffetResponse as ProductoBuffet } from "@/lib/api/tipos/buffet";

/** "Llegó mercadería" — siempre suma, nunca reemplaza el número (eso evita que alguien borre stock por accidente tipeando de más). */
export function ModalAjustarStock({ producto, onGuardar, onCancelar }: { producto: ProductoBuffet; onGuardar: (cantidad: number) => void; onCancelar: () => void }) {
  const [cantidad, setCantidad] = useState(24);
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (cantidad <= 0) return setError("Ingresá una cantidad mayor a 0.");
    setError(null);
    onGuardar(cantidad);
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <p className="text-sm text-grafito">
        Stock actual de <span className="font-semibold text-tinta">{producto.nombre}</span>: <span className="font-semibold text-tinta">{producto.stock}</span>
      </p>

      <div>
        <label htmlFor="cantidad-sumar" className="mb-1 block text-xs font-semibold text-grafito">
          Unidades que llegaron
        </label>
        <input
          id="cantidad-sumar"
          type="number"
          min={1}
          required
          autoFocus
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
        <p className="mt-1 text-xs text-grafito">
          Queda en {Math.max(0, producto.stock + (Number.isFinite(cantidad) ? cantidad : 0))} unidades.
        </p>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
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
          Sumar stock
        </button>
      </div>
    </form>
  );
}
