"use client";

import { useState, type FormEvent } from "react";

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

export function FormAbrirCaja({ onAbrir }: { onAbrir: (fondoInicial: number) => void }) {
  const [fondoInicial, setFondoInicial] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function abrir(e: FormEvent) {
    e.preventDefault();
    if (fondoInicial < 0) return setError("El fondo inicial no puede ser negativo.");
    setError(null);
    onAbrir(fondoInicial);
  }

  return (
    <form onSubmit={abrir} className="mx-auto w-full max-w-sm space-y-4 rounded-card bg-white p-8 shadow-card">
      <div>
        <h1 className="font-display text-xl font-extrabold text-tinta">Abrir caja</h1>
        <p className="mt-1 text-sm text-grafito">Registrá el efectivo con el que arranca el turno de mostrador.</p>
      </div>

      <div>
        <label htmlFor="fondo-inicial" className="mb-1 block text-xs font-semibold text-grafito">
          Fondo inicial
        </label>
        <input
          id="fondo-inicial"
          type="number"
          min={0}
          required
          autoFocus
          value={fondoInicial}
          onChange={(e) => setFondoInicial(Number(e.target.value))}
          className={campoClase}
        />
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
      >
        Abrir caja
      </button>
    </form>
  );
}
