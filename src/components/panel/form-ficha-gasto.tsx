"use client";

import { useState, type FormEvent } from "react";
import { hoyISO } from "@/lib/fecha";
import { CATEGORIAS_GASTO, type CategoriaGasto, type Gasto } from "@/mocks/gastos";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import type { MetodoPago } from "@/lib/api/tipos/comunes";

export type DatosGasto = {
  fecha: string;
  monto: number;
  categoria: CategoriaGasto;
  descripcion: string;
  metodoPago: MetodoPago;
  comprobanteUrl?: string;
};

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/** Alta y edición comparten el mismo form (mismo patrón que FormFichaProducto). */
export function FormFichaGasto({
  gasto,
  onGuardar,
  onCancelar,
}: {
  /** null = alta de un gasto nuevo */
  gasto: Gasto | null;
  onGuardar: (datos: DatosGasto) => void;
  onCancelar: () => void;
}) {
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoyISO());
  const [monto, setMonto] = useState(gasto?.monto ?? 0);
  const [categoria, setCategoria] = useState<CategoriaGasto>(gasto?.categoria ?? "OTROS");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(gasto?.metodoPago ?? "EFECTIVO");
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? "");
  const [comprobanteUrl, setComprobanteUrl] = useState(gasto?.comprobanteUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return setError("Falta la fecha.");
    if (monto <= 0) return setError("El monto tiene que ser mayor a 0.");
    if (!descripcion.trim()) return setError("Falta la descripción.");
    setError(null);
    onGuardar({ fecha, monto, categoria, metodoPago, descripcion: descripcion.trim(), comprobanteUrl: comprobanteUrl.trim() || undefined });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="gasto-fecha" className="mb-1 block text-xs font-semibold text-grafito">
          Fecha
        </label>
        <input id="gasto-fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="gasto-monto" className="mb-1 block text-xs font-semibold text-grafito">
          Monto
        </label>
        <input
          id="gasto-monto"
          type="number"
          min={0}
          required
          autoFocus
          value={monto}
          onChange={(e) => setMonto(Number(e.target.value))}
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="gasto-categoria" className="mb-1 block text-xs font-semibold text-grafito">
          Categoría
        </label>
        <select id="gasto-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)} className={campoClase}>
          {CATEGORIAS_GASTO.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gasto-metodo-pago" className="mb-1 block text-xs font-semibold text-grafito">
          Método de pago
        </label>
        <select id="gasto-metodo-pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPago)} className={campoClase}>
          {METODOS_PAGO.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gasto-descripcion" className="mb-1 block text-xs font-semibold text-grafito">
          Descripción
        </label>
        <input id="gasto-descripcion" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="gasto-comprobante" className="mb-1 block text-xs font-semibold text-grafito">
          Comprobante (URL, opcional)
        </label>
        <input id="gasto-comprobante" value={comprobanteUrl} onChange={(e) => setComprobanteUrl(e.target.value)} className={campoClase} />
        <p className="mt-1 text-xs text-grafito">Todavía no hay subida de foto del ticket — pegá el link si ya tenés uno.</p>
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
