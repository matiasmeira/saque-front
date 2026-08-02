"use client";

import { useState } from "react";
import { X } from "lucide-react";

/**
 * Hoja de filtros — desde abajo en mobile, nunca barra lateral
 * (Parte 9, A2). Los controles son reales pero locales: todavía no
 * hay backend que filtre por precio, superficie o servicios, así
 * que no tocan el listado. Se marca explícitamente más abajo.
 */
// TODO backend: conectar estos filtros a la búsqueda real (precio,
// superficie, techada, servicios). Hoy solo cambian su propio
// estado local dentro de la hoja.
const ORDENES = ["Más cerca", "Más barato", "Mejor puntuado"];
const SUPERFICIES = ["Sintético", "Cemento", "Polvo de ladrillo"];
const SERVICIOS = ["Vestuario", "Parrilla", "Estacionamiento", "Buffet", "Alquiler de paletas"];

function ChipToggle({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
        activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [orden, setOrden] = useState(ORDENES[0]);
  const [precioMax, setPrecioMax] = useState(25000);
  const [superficies, setSuperficies] = useState<string[]>([]);
  const [techada, setTechada] = useState(false);
  const [servicios, setServicios] = useState<string[]>([]);

  function alternar(lista: string[], valor: string, setLista: (v: string[]) => void) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar filtros"
        onClick={onClose}
        className="absolute inset-0 bg-tinta/40"
      />

      <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-card bg-white p-6 sm:max-w-md sm:rounded-card">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-tinta">Más filtros</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="divide-y divide-borde">
          <div className="pb-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-grafito">Ordenar</p>
            <div className="flex flex-wrap gap-2">
              {ORDENES.map((o) => (
                <ChipToggle key={o} activo={orden === o} onClick={() => setOrden(o)}>
                  {o}
                </ChipToggle>
              ))}
            </div>
          </div>

          <div className="py-6">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-grafito">Precio</p>
              <p className="font-display text-sm font-bold text-tinta">hasta ${precioMax.toLocaleString("es-AR")}</p>
            </div>
            <input
              type="range"
              min={5000}
              max={50000}
              step={1000}
              value={precioMax}
              onChange={(e) => setPrecioMax(Number(e.target.value))}
              className="w-full accent-azul"
            />
          </div>

          <div className="py-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-grafito">Superficie</p>
            <div className="flex flex-wrap gap-2">
              {SUPERFICIES.map((s) => (
                <ChipToggle key={s} activo={superficies.includes(s)} onClick={() => alternar(superficies, s, setSuperficies)}>
                  {s}
                </ChipToggle>
              ))}
            </div>
          </div>

          <div className="py-6">
            <label className="flex items-center gap-3 text-sm font-semibold text-tinta">
              <input
                type="checkbox"
                checked={techada}
                onChange={(e) => setTechada(e.target.checked)}
                className="size-5 accent-azul"
              />
              Techada
            </label>
          </div>

          <div className="pt-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-grafito">Servicios</p>
            <div className="flex flex-wrap gap-2">
              {SERVICIOS.map((s) => (
                <ChipToggle key={s} activo={servicios.includes(s)} onClick={() => alternar(servicios, s, setServicios)}>
                  {s}
                </ChipToggle>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
