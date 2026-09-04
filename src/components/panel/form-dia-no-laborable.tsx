"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { hoyISO } from "@/lib/fecha";
import type { DiaNoLaborableRequest } from "@/lib/api/tipos/establecimientos";

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";
const MOTIVO_MAXIMO = 255;

/** Alta de un día no laborable. Sin edición: para cambiar uno se borra y se crea de nuevo. */
export function FormDiaNoLaborable({
  guardando,
  onAgregar,
}: {
  guardando: boolean;
  onAgregar: (datos: DiaNoLaborableRequest) => void;
}) {
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(hoy);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function agregar(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return setError("Falta la fecha.");
    if (fecha < hoy) return setError("La fecha no puede ser pasada.");
    if (motivo.length > MOTIVO_MAXIMO) return setError(`El motivo puede tener hasta ${MOTIVO_MAXIMO} caracteres.`);
    setError(null);
    onAgregar({ fecha, motivo: motivo.trim() || undefined });
  }

  return (
    <form onSubmit={agregar} noValidate className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <label htmlFor="dia-no-laborable-fecha" className="mb-1 block text-xs font-semibold text-grafito">
            Fecha
          </label>
          <input
            id="dia-no-laborable-fecha"
            type="date"
            required
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={campoClase}
          />
        </div>

        <div className="flex-1">
          <label htmlFor="dia-no-laborable-motivo" className="mb-1 block text-xs font-semibold text-grafito">
            Motivo (opcional)
          </label>
          <input
            id="dia-no-laborable-motivo"
            value={motivo}
            maxLength={MOTIVO_MAXIMO}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Navidad"
            className={campoClase}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {guardando ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-cancelado">
          {error}
        </p>
      )}
    </form>
  );
}
