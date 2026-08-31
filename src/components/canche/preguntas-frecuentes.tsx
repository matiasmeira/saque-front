"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Nota: no hay una pregunta sobre "cómo pago la reserva" a propósito.
 * Hoy el jugador no puede pagar/confirmar online (ver B1 en
 * PLAN_CONEXION.md del backend) — prometerlo acá sería mentirle al
 * usuario. Se agrega cuando el pago online exista de verdad.
 */
const PREGUNTAS = [
  {
    pregunta: "¿Puedo cancelar mi turno?",
    respuesta:
      "Sí, podés cancelar desde tu perfil. Revisá la política de cancelación del complejo para saber con cuánta anticipación podés hacerlo sin costo.",
  },
  {
    pregunta: "¿Qué pasa si llueve?",
    respuesta:
      "Para canchas descubiertas, la decisión de suspender por lluvia depende del complejo. Te va a avisar si el turno se cancela para reprogramarlo o devolverte la seña.",
  },
  {
    pregunta: "¿Necesito crear una cuenta para reservar?",
    respuesta:
      "Sí, hace falta una cuenta gratuita. Así podemos gestionar tus reservas, mandarte confirmaciones y guardar tu historial de partidos.",
  },
  {
    pregunta: "¿Tienen promociones o descuentos?",
    respuesta: "Cada complejo maneja sus propias promociones: las vas a ver reflejadas en el precio al buscar horarios.",
  },
] as const;

export function PreguntasFrecuentes() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <section className="border-t border-borde bg-humo px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl text-tinta sm:text-4xl">Preguntas frecuentes</h2>

        <div className="mt-10 flex flex-col gap-3">
          {PREGUNTAS.map((item, indice) => {
            const abierto = abierta === indice;
            return (
              <div key={item.pregunta} className="overflow-hidden rounded-card border border-borde bg-white">
                <button
                  type="button"
                  onClick={() => setAbierta(abierto ? null : indice)}
                  aria-expanded={abierto}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="font-display text-lg font-bold text-tinta">{item.pregunta}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-grafito transition-transform ${abierto ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {abierto && (
                  <div className="border-t border-borde px-6 pb-4 pt-4 text-grafito">{item.respuesta}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
