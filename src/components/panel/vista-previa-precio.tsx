"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import type { Cancha } from "@/mocks/canchas";
import { calcularPrecio, DIAS_SEMANA, etiquetaDias, type DiaSemana, type Tarifa } from "@/mocks/tarifas";

/**
 * Calculadora de "qué precio le queda a este turno" — para que el
 * dueño pueda confirmar que sus reglas hacen lo que espera antes de
 * enterarse por un reclamo de un jugador. Se remonta con
 * `key={cancha.id}` desde el padre, así el ejemplo no arrastra un
 * día/hora que no tenga sentido para la cancha nueva.
 */
export function VistaPreviaPrecio({ cancha, tarifas }: { cancha: Cancha; tarifas: Tarifa[] }) {
  const [dia, setDia] = useState<DiaSemana>("sab");
  const [hora, setHora] = useState("20:00");
  const [duracion, setDuracion] = useState(cancha.duracionesPermitidas[0]);

  const resultado = calcularPrecio(cancha, tarifas, dia, hora, duracion);

  return (
    <div className="rounded-card bg-celeste-suave p-5">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-tinta">
        <Calculator className="size-[18px] shrink-0" aria-hidden />
        Vista previa
      </h2>
      <p className="mt-0.5 text-sm text-grafito">Probá un turno de ejemplo para confirmar que las reglas hacen lo que esperás.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="preview-dia" className="mb-1 block text-xs font-semibold text-grafito">
            Día
          </label>
          <select
            id="preview-dia"
            value={dia}
            onChange={(e) => setDia(e.target.value as DiaSemana)}
            className="h-10 rounded-input border border-borde bg-white px-3 text-sm text-tinta focus:border-azul focus:outline-none"
          >
            {DIAS_SEMANA.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.larga}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="preview-hora" className="mb-1 block text-xs font-semibold text-grafito">
            Hora
          </label>
          <input
            id="preview-hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="h-10 rounded-input border border-borde bg-white px-3 text-sm text-tinta focus:border-azul focus:outline-none"
          />
        </div>

        {cancha.duracionesPermitidas.length > 1 && (
          <div>
            <label htmlFor="preview-duracion" className="mb-1 block text-xs font-semibold text-grafito">
              Duración
            </label>
            <select
              id="preview-duracion"
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className="h-10 rounded-input border border-borde bg-white px-3 text-sm text-tinta focus:border-azul focus:outline-none"
            >
              {cancha.duracionesPermitidas.map((min) => (
                <option key={min} value={min}>
                  {min} min
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-tinta">{formatearPrecio(resultado.precio)}</p>
      <p className="text-sm text-grafito">
        {resultado.tarifa
          ? `Con la tarifa especial de ${etiquetaDias(resultado.tarifa.dias)}, ${resultado.tarifa.horaDesde}–${resultado.tarifa.horaHasta}.`
          : "Precio base — ninguna tarifa especial aplica a ese día y horario."}
      </p>
    </div>
  );
}
