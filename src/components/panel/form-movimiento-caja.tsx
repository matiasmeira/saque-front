"use client";

import { useState, type FormEvent } from "react";
import type { TipoMovimiento } from "@/mocks/caja";

export type DatosMovimientoCaja = { monto: number; descripcion: string };

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/** Retiro e ingreso comparten el mismo form — la prop tipo solo cambia el copy. Siempre efectivo: es plata que entra o sale físicamente del cajón. */
export function FormMovimientoCaja({
  tipo,
  onGuardar,
  onCancelar,
}: {
  tipo: TipoMovimiento;
  onGuardar: (datos: DatosMovimientoCaja) => void;
  onCancelar: () => void;
}) {
  const [monto, setMonto] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (monto <= 0) return setError("El monto tiene que ser mayor a 0.");
    if (!descripcion.trim()) return setError("Falta la descripción.");
    setError(null);
    onGuardar({ monto, descripcion: descripcion.trim() });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="movimiento-monto" className="mb-1 block text-xs font-semibold text-grafito">
          Monto
        </label>
        <input
          id="movimiento-monto"
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
        <label htmlFor="movimiento-descripcion" className="mb-1 block text-xs font-semibold text-grafito">
          Descripción
        </label>
        <input id="movimiento-descripcion" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={campoClase} />
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
          {tipo === "INGRESO" ? "Registrar ingreso" : "Registrar retiro"}
        </button>
      </div>
    </form>
  );
}
