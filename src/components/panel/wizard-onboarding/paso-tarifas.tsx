"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ListaTarifas } from "@/components/panel/lista-tarifas";
import { FormTarifa } from "@/components/panel/form-tarifa";
import { etiquetaDias, type DiaSemana, type Tarifa } from "@/lib/panel/tarifas";
import type { PrecioPorDuracion } from "@/lib/panel/canchas";
import type { Cancha } from "@/lib/panel/canchas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; tarifaId: number } | null;
export type DatosTarifaForm = { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] };

/**
 * Paso 5, opcional. `PrecioBaseCancha` no se reutiliza acá (Ruling 2 del
 * plan): ese componente siempre es editable y este paso lo necesita de sólo
 * lectura, así que el precio base se muestra en un bloque estático propio.
 */
export function PasoTarifas({
  canchas,
  tarifasPorCancha,
  error,
  onCrearTarifa,
  onEditarTarifa,
  onQuitarTarifa,
  onAtras,
  onContinuar,
}: {
  canchas: Cancha[];
  tarifasPorCancha: Record<number, Tarifa[]>;
  error: string | null;
  onCrearTarifa: (canchaId: number, datos: DatosTarifaForm) => void;
  onEditarTarifa: (canchaId: number, tarifaId: number, datos: DatosTarifaForm) => void;
  onQuitarTarifa: (canchaId: number, tarifa: Tarifa) => void;
  onAtras: () => void;
  onContinuar: () => void;
}) {
  const [canchaId, setCanchaId] = useState<number | null>(canchas[0]?.id ?? null);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);

  const cancha = canchas.find((c) => c.id === canchaId) ?? canchas[0];
  const tarifasDeCancha = cancha ? (tarifasPorCancha[cancha.id] ?? []) : [];
  const tarifaEnEdicion =
    panelAbierto?.tipo === "editar" ? tarifasDeCancha.find((t) => t.id === panelAbierto.tarifaId) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Tarifas</h2>
        <p className="mt-1 text-sm text-grafito">
          Opcional: cargá reglas de precio distinto por día y horario. Sin ninguna, rige el precio base de cada
          cancha.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Cancha a tarifar">
        {canchas.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === cancha?.id}
            onClick={() => setCanchaId(c.id)}
            className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
              c.id === cancha?.id
                ? "bg-azul text-white"
                : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {cancha && (
        <>
          <div className="rounded-card border border-borde p-4">
            <p className="text-xs font-semibold text-grafito">Precio base — ya cargado en el paso anterior</p>
            <div className="mt-2 space-y-1">
              {cancha.preciosBase.map((p) => (
                <p key={p.duracionMinutos} className="text-sm text-tinta">
                  {p.duracionMinutos} min — ${p.precio}
                </p>
              ))}
            </div>
          </div>

          <ListaTarifas
            tarifas={tarifasDeCancha}
            onAgregar={() => setPanelAbierto({ tipo: "nueva" })}
            onEditar={(tarifa) => setPanelAbierto({ tipo: "editar", tarifaId: tarifa.id })}
            onQuitar={(tarifa) => onQuitarTarifa(cancha.id, tarifa)}
          />
        </>
      )}

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onContinuar}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {cancha && panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva tarifa" subtitulo={cancha.nombre} onClose={() => setPanelAbierto(null)}>
          <FormTarifa
            tarifa={null}
            cancha={cancha}
            otrasTarifasDeLaCancha={tarifasDeCancha}
            onGuardar={(datos) => {
              onCrearTarifa(cancha.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {cancha && tarifaEnEdicion && (
        <DrawerPanel
          titulo="Editar tarifa"
          subtitulo={`${cancha.nombre} · ${etiquetaDias(tarifaEnEdicion.dias)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <FormTarifa
            tarifa={tarifaEnEdicion}
            cancha={cancha}
            otrasTarifasDeLaCancha={tarifasDeCancha.filter((t) => t.id !== tarifaEnEdicion.id)}
            onGuardar={(datos) => {
              onEditarTarifa(cancha.id, tarifaEnEdicion.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}
    </div>
  );
}
