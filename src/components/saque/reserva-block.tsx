"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { proximosDias } from "@/components/saque/selector-fecha";
import { Selector } from "@/components/saque/selector";
import { TimeChip } from "@/components/saque/time-chip";
import { formatearPrecio } from "@/lib/formato";
import { horariosLibres } from "@/lib/disponibilidad";
import { DEPORTES } from "@/mocks/deportes";
import type { Complejo } from "@/mocks/complejos";

/**
 * El bloque de reserva de A3. Dos representaciones del mismo estado,
 * no dos componentes: en desktop es aside sticky lateral, en mobile
 * es barra fija abajo — nunca al revés (Parte 9, A3). Cambiar de
 * cancha resetea la hora elegida y recalcula precio/seña sin
 * recargar, porque todo vive en useState de este mismo componente.
 */
export function ReservaBlock({ complejo }: { complejo: Complejo }) {
  const router = useRouter();
  const dias = proximosDias(7);

  const [fecha, setFecha] = useState(dias[0].valor);
  const [canchaId, setCanchaId] = useState(complejo.canchas[0].id);
  const [hora, setHora] = useState<string | null>(null);

  const cancha = complejo.canchas.find((c) => c.id === canchaId) ?? complejo.canchas[0];

  const horarioHoy = complejo.horarioAtencion[0];
  const [desdeStr, hastaStr] = horarioHoy.horario.split(" a ").map((s) => s.trim());
  const horarios = horariosLibres(
    cancha.ocupado,
    cancha.duracionMin,
    `${desdeStr.padStart(2, "0")}:00`,
    `${hastaStr.padStart(2, "0")}:00`,
  );
  const sinTurnos = horarios.length === 0;

  const opcionesCanchas = complejo.canchas.map((c) => ({
    valor: c.id,
    etiqueta: `${c.nombre} (${DEPORTES.find((d) => d.valor === c.deporte)?.abreviatura ?? c.deporte})`,
  }));

  function elegirCancha(id: string) {
    setCanchaId(id);
    setHora(null);
  }

  function reservar() {
    if (!hora) return;
    router.push(`/reservar/${complejo.id}?cancha=${cancha.id}&fecha=${fecha}&hora=${hora}`);
  }

  return (
    <>
      {/* Desktop: sticky lateral, adentro del grid de contenido. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-card bg-white p-6">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-grafito">Reservar</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="reserva-fecha" className="mb-1 block text-xs font-semibold text-grafito">
                Fecha
              </label>
              <div className="rounded-input border border-borde bg-humo px-3 py-2">
                <Selector id="reserva-fecha" value={fecha} onChange={setFecha} opciones={dias} />
              </div>
            </div>

            <div>
              <label htmlFor="reserva-cancha" className="mb-1 block text-xs font-semibold text-grafito">
                Cancha
              </label>
              <div className="rounded-input border border-borde bg-humo px-3 py-2">
                <Selector id="reserva-cancha" value={canchaId} onChange={elegirCancha} opciones={opcionesCanchas} />
              </div>
            </div>
          </div>

          <div className="mt-5">
            {sinTurnos ? (
              <p className="rounded-input bg-humo px-3 py-3 text-sm text-grafito">
                Sin turnos libres en esta cancha para hoy. Probá otra cancha o cambiá la fecha.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {horarios.map((h) => (
                  <TimeChip key={h} hora={h} seleccionado={hora === h} onClick={() => setHora(h)} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-borde pt-4">
            <div>
              <p className="text-xs text-grafito">Total</p>
              <p className="font-display text-lg font-bold text-tinta">{formatearPrecio(cancha.precio)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-grafito">Seña</p>
              <p className="font-display text-base font-semibold text-azul">{formatearPrecio(cancha.senia)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={reservar}
            disabled={!hora}
            className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-azul font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
          >
            {hora ? `Reservar ${hora}` : "Elegí un horario"}
          </button>
        </div>
      </aside>

      {/* Mobile: barra fija abajo. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-white p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-[110px] flex-1 rounded-input border border-borde bg-humo px-3 py-2">
            <Selector id="reserva-fecha-m" value={fecha} onChange={setFecha} opciones={dias} />
          </div>
          <div className="min-w-[110px] flex-1 rounded-input border border-borde bg-humo px-3 py-2">
            <Selector id="reserva-cancha-m" value={canchaId} onChange={elegirCancha} opciones={opcionesCanchas} />
          </div>
        </div>

        <div className="mt-3">
          {sinTurnos ? (
            <p className="text-sm text-grafito">Sin turnos libres en esta cancha para hoy.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {horarios.map((h) => (
                <TimeChip key={h} hora={h} seleccionado={hora === h} onClick={() => setHora(h)} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-grafito">Total</p>
              <p className="font-display text-base font-bold text-tinta">{formatearPrecio(cancha.precio)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-grafito">Seña</p>
              <p className="font-display text-base font-bold text-azul">{formatearPrecio(cancha.senia)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={reservar}
            disabled={!hora}
            className="flex h-12 shrink-0 items-center justify-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
          >
            Reservar
          </button>
        </div>
      </div>
    </>
  );
}
