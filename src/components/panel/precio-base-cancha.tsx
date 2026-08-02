"use client";

import { useState } from "react";
import type { Cancha, PrecioPorDuracion } from "@/mocks/canchas";

/**
 * Fila por duración, editable directo (sin drawer — es un dato
 * simple, no una regla). Se remonta con `key={cancha.id}` desde el
 * padre al cambiar de cancha, así el estado local arranca de nuevo
 * sin necesitar un efecto para sincronizarlo.
 */
export function PrecioBaseCancha({ cancha, onGuardar }: { cancha: Cancha; onGuardar: (precios: PrecioPorDuracion[]) => void }) {
  const [precios, setPrecios] = useState<Record<number, number>>(() =>
    Object.fromEntries(cancha.duracionesPermitidas.map((d) => [d, cancha.preciosBase.find((p) => p.duracionMinutos === d)?.precio ?? 0])),
  );
  const [dirty, setDirty] = useState(false);

  function cambiar(duracion: number, valor: number) {
    setPrecios((prev) => ({ ...prev, [duracion]: valor }));
    setDirty(true);
  }

  function guardar() {
    onGuardar(cancha.duracionesPermitidas.map((d) => ({ duracionMinutos: d, precio: precios[d] ?? 0 })));
    setDirty(false);
  }

  return (
    <div className="rounded-card bg-white p-5">
      <h2 className="font-display text-base font-bold text-tinta">Precio base</h2>
      <p className="mt-0.5 text-sm text-grafito">Rige siempre que no haya una tarifa especial aplicable a ese día y horario.</p>

      <div className="mt-4 space-y-2.5">
        {cancha.duracionesPermitidas.map((d) => (
          <div key={d} className="flex items-center justify-between gap-3">
            <label htmlFor={`precio-base-${d}`} className="text-sm font-semibold text-tinta">
              {d} min
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-grafito">$</span>
              <input
                id={`precio-base-${d}`}
                type="number"
                min={0}
                value={precios[d] ?? 0}
                onChange={(e) => cambiar(d, Number(e.target.value))}
                className="w-32 rounded-input border border-borde bg-humo px-3 py-2 text-right text-tinta focus:border-azul focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={guardar}
        disabled={!dirty}
        className="mt-4 flex h-10 items-center justify-center rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        Guardar cambios
      </button>
    </div>
  );
}
