"use client";

import { useState, type FormEvent } from "react";
import { textoPoliticaCancelacion, type PoliticaCancelacion } from "@/mocks/config";

/** Un solo número, con vista previa del texto exacto que ve el jugador en el checkout — así el dueño no adivina cómo queda redactado. */
export function FormPoliticaCancelacion({
  politica,
  onGuardar,
}: {
  politica: PoliticaCancelacion;
  onGuardar: (politica: PoliticaCancelacion) => void;
}) {
  const [horasLimite, setHorasLimite] = useState(politica.horasLimite);
  const [error, setError] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!Number.isInteger(horasLimite) || horasLimite < 0) return setError("Ingresá un número entero de horas, 0 o más.");
    setError(null);
    onGuardar({ horasLimite });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="config-horas-limite" className="mb-1 block text-xs font-semibold text-grafito">
          Horas antes del turno para cancelar con reembolso de seña
        </label>
        <input
          id="config-horas-limite"
          type="number"
          min={0}
          required
          value={horasLimite}
          onChange={(e) => setHorasLimite(Number(e.target.value))}
          className="w-32 rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
      </div>

      <div className="rounded-input bg-humo p-3.5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-grafito">Así lo ve el jugador</p>
        <p className="text-sm text-tinta">{textoPoliticaCancelacion(horasLimite)}</p>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
      >
        Guardar política
      </button>
    </form>
  );
}
