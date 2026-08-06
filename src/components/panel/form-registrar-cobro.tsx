"use client";

import { useState, type FormEvent } from "react";
import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO, type MetodoPago, type Pago } from "@/mocks/pagos";

function chipClase(activo: boolean) {
  return `h-9 rounded-full px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
    activo ? "bg-celeste-suave text-tinta" : "bg-humo text-grafito hover:text-azul"
  }`;
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (valor: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-tinta">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${checked ? "bg-azul" : "bg-borde"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
          aria-hidden
        />
      </button>
    </div>
  );
}

/**
 * Corrige/registra cómo se cobró una reserva. El medio de pago y si
 * generó comisión son dos controles independientes a propósito —
 * elegir Mercado Pago no marca la comisión sola: el dueño puede
 * haberla cobrado con su propio Point, sin pasar por el Split de
 * Saque.
 */
export function FormRegistrarCobro({
  pago,
  onGuardar,
  onCancelar,
}: {
  pago: Pago;
  onGuardar: (metodoPago: MetodoPago, generoComision: boolean) => void;
  onCancelar: () => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPago>(pago.metodoPago);
  const [generoComision, setGeneroComision] = useState(pago.generoComision);

  function guardar(e: FormEvent) {
    e.preventDefault();
    onGuardar(metodo, generoComision);
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="rounded-card bg-humo p-4 text-sm text-grafito">
        Reserva de <span className="font-semibold text-tinta">{pago.clienteNombre}</span> por{" "}
        <span className="font-semibold text-tinta">{formatearPrecio(pago.totalTurno)}</span>.
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Medio de pago</p>
        <div className="flex flex-wrap gap-1.5">
          {METODOS_PAGO.map((m) => (
            <button key={m.valor} type="button" aria-pressed={metodo === m.valor} onClick={() => setMetodo(m.valor)} className={chipClase(metodo === m.valor)}>
              {m.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card bg-humo p-4">
        <Switch checked={generoComision} onChange={setGeneroComision} label="Pasó por el Split de Saque" />
        <p className="mt-2 text-xs text-grafito">
          Independiente del medio: aunque haya sido Mercado Pago, si lo cobraste con tu propio Point no pasa por Saque y no genera comisión.
        </p>
      </div>

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
