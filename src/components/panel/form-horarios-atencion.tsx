"use client";

import { useState } from "react";
import { DIAS_SEMANA } from "@/mocks/tarifas";
import type { HorarioDia } from "@/mocks/config";

/**
 * Por día de la semana, no un solo horario general — alimenta
 * disponibilidad (agenda) y el % de ocupación de Reportes, así que
 * tiene que poder distinguir, por ejemplo, un domingo cerrado.
 * Valida que abre < cierra en cada día abierto antes de guardar.
 */
export function FormHorariosAtencion({ horarios, onGuardar }: { horarios: HorarioDia[]; onGuardar: (horarios: HorarioDia[]) => void }) {
  const [dias, setDias] = useState<HorarioDia[]>(horarios);
  const [error, setError] = useState<string | null>(null);

  function actualizar(dia: HorarioDia["dia"], cambios: Partial<HorarioDia>) {
    setDias((prev) => prev.map((d) => (d.dia === dia ? { ...d, ...cambios } : d)));
  }

  function guardar() {
    for (const d of dias) {
      if (!d.cerrado && d.abre >= d.cierra) {
        const etiqueta = DIAS_SEMANA.find((x) => x.valor === d.dia)?.larga ?? d.dia;
        setError(`${etiqueta}: el horario de cierre tiene que ser después del de apertura.`);
        return;
      }
    }
    setError(null);
    onGuardar(dias);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {dias.map((d) => {
          const etiqueta = DIAS_SEMANA.find((x) => x.valor === d.dia)?.larga ?? d.dia;
          return (
            <div key={d.dia} className="flex flex-wrap items-center gap-3 rounded-input bg-humo px-3.5 py-2.5">
              <span className="w-24 shrink-0 text-sm font-semibold text-tinta">{etiqueta}</span>
              <label className="flex items-center gap-1.5 text-xs text-grafito">
                <input
                  type="checkbox"
                  checked={d.cerrado}
                  onChange={(e) => actualizar(d.dia, { cerrado: e.target.checked })}
                  className="size-4 rounded border-borde accent-azul"
                />
                Cerrado
              </label>
              {!d.cerrado && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={d.abre}
                    onChange={(e) => actualizar(d.dia, { abre: e.target.value })}
                    aria-label={`Hora de apertura del ${etiqueta}`}
                    className="rounded-input bg-white px-2 py-1.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                  />
                  <span className="text-xs text-grafito">a</span>
                  <input
                    type="time"
                    value={d.cierra}
                    onChange={(e) => actualizar(d.dia, { cierra: e.target.value })}
                    aria-label={`Hora de cierre del ${etiqueta}`}
                    className="rounded-input bg-white px-2 py-1.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={guardar}
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
      >
        Guardar horarios
      </button>
    </div>
  );
}
