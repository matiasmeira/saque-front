"use client";

import { useState, type FormEvent } from "react";
import type { Cancha } from "@/lib/panel/canchas";
import { DIAS_SEMANA, diasEnComun, rangosSeSuperponen, type DiaSemana, type Tarifa } from "@/lib/panel/tarifas";

function chipClase(activo: boolean) {
  return `h-9 w-9 rounded-full text-xs font-semibold transition-colors ${
    activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
  }`;
}

/**
 * Alta y edición de una regla de excepción. La validación central es
 * el solape: dos reglas de la misma cancha no pueden pisarse en un
 * día en común — si no, no habría forma de saber cuál rige.
 */
export function FormTarifa({
  tarifa,
  cancha,
  otrasTarifasDeLaCancha,
  onGuardar,
  onCancelar,
}: {
  tarifa: Tarifa | null;
  cancha: Cancha;
  /** tarifas de esta misma cancha, sin incluir la que se está editando */
  otrasTarifasDeLaCancha: Tarifa[];
  onGuardar: (datos: { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: { duracionMinutos: number; precio: number }[] }) => void;
  onCancelar: () => void;
}) {
  const [dias, setDias] = useState<DiaSemana[]>(tarifa?.dias ?? []);
  const [horaDesde, setHoraDesde] = useState(tarifa?.horaDesde ?? "");
  const [horaHasta, setHoraHasta] = useState(tarifa?.horaHasta ?? "");
  const [precios, setPrecios] = useState<Record<number, number>>(() =>
    Object.fromEntries(cancha.duracionesPermitidas.map((d) => [d, tarifa?.precios.find((p) => p.duracionMinutos === d)?.precio ?? 0])),
  );
  const [error, setError] = useState<string | null>(null);

  function alternarDia(dia: DiaSemana) {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (dias.length === 0) return setError("Elegí al menos un día.");
    if (!horaDesde || !horaHasta || horaDesde >= horaHasta) return setError("El horario \"hasta\" tiene que ser posterior al \"desde\".");
    if (cancha.duracionesPermitidas.some((d) => !precios[d])) return setError("Cargá un precio para cada duración de esta cancha.");

    const solapa = otrasTarifasDeLaCancha.some(
      (t) => diasEnComun(dias, t.dias) && rangosSeSuperponen(horaDesde, horaHasta, t.horaDesde, t.horaHasta),
    );
    if (solapa) return setError("Ese rango se pisa con otra tarifa de esta cancha en algún día en común.");

    setError(null);
    onGuardar({
      dias,
      horaDesde,
      horaHasta,
      precios: cancha.duracionesPermitidas.map((d) => ({ duracionMinutos: d, precio: precios[d] })),
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Días</p>
        <div className="flex flex-wrap gap-1.5">
          {DIAS_SEMANA.map((d) => (
            <button
              key={d.valor}
              type="button"
              aria-pressed={dias.includes(d.valor)}
              aria-label={d.larga}
              onClick={() => alternarDia(d.valor)}
              className={chipClase(dias.includes(d.valor))}
            >
              {d.letra}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tarifa-desde" className="mb-1 block text-xs font-semibold text-grafito">
            Desde
          </label>
          <input
            id="tarifa-desde"
            type="time"
            required
            value={horaDesde}
            onChange={(e) => setHoraDesde(e.target.value)}
            className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          />
        </div>
        <div>
          <label htmlFor="tarifa-hasta" className="mb-1 block text-xs font-semibold text-grafito">
            Hasta
          </label>
          <input
            id="tarifa-hasta"
            type="time"
            required
            min={horaDesde || undefined}
            value={horaHasta}
            onChange={(e) => setHoraHasta(e.target.value)}
            className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Precio en este rango</p>
        <div className="space-y-2">
          {cancha.duracionesPermitidas.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-sm font-semibold text-tinta">{d} min</span>
              <input
                type="number"
                min={0}
                value={precios[d] ?? ""}
                onChange={(e) => setPrecios((prev) => ({ ...prev, [d]: Number(e.target.value) }))}
                placeholder="0"
                aria-label={`Precio para ${d} minutos`}
                className="w-full rounded-input bg-humo px-3 py-2 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
            </div>
          ))}
        </div>
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
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
