"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Check } from "lucide-react";

/**
 * Estado vacío genérico: título + salidas concretas, nunca solo un
 * cartel de "no hay resultados". "use client" porque el CTA final
 * (ej. "Avisame si se libera") necesita responder al toque.
 */
type Salida = { label: string; href: string };

export function EmptyState({
  titulo,
  descripcion,
  salidas,
  ctaLabel,
}: {
  titulo: string;
  descripcion?: string;
  salidas: Salida[];
  ctaLabel?: string;
}) {
  const [avisado, setAvisado] = useState(false);

  return (
    <div className="rounded-card bg-white px-6 py-10 text-center sm:px-10">
      <h2 className="font-display text-xl font-bold text-tinta">{titulo}</h2>
      {descripcion && <p className="mt-2 text-grafito">{descripcion}</p>}

      {salidas.length > 0 && (
        <ul className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-left">
          {salidas.map((salida) => (
            <li key={salida.href}>
              <Link
                href={salida.href}
                className="flex items-center justify-between gap-3 rounded-input border border-borde px-4 py-3 text-sm font-semibold text-tinta transition-colors hover:border-azul hover:text-azul"
              >
                {salida.label}
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ctaLabel && (
        <button
          type="button"
          onClick={() => setAvisado(true)}
          disabled={avisado}
          className={`mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 font-display text-sm font-bold transition-colors ${
            avisado ? "bg-humo text-grafito" : "bg-azul text-white hover:bg-azul-oscuro"
          }`}
        >
          {avisado ? <Check className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
          {avisado ? "Te avisamos" : ctaLabel}
        </button>
      )}
    </div>
  );
}
