"use client";

import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Listbox propio, no <select> nativo: el control cerrado se puede
 * stylear, pero la lista de opciones abierta la pinta el sistema
 * operativo (letra y colores nativos, sin forma de tocarlos) — se ve
 * ajena al resto de la UI. Mismo patrón que el dropdown de sugerencias
 * de SelectorUbicacion: contenedor relative + click-afuera + lista
 * absoluta con role="listbox".
 */
export type OpcionSelector = {
  valor: string;
  etiqueta: string;
  /** Ícono opcional (mismo lenguaje que lucide). Sin esto, la fila es solo texto. */
  icono?: ComponentType<{ className?: string }>;
};

export function Selector({
  id,
  value,
  onChange,
  opciones,
}: {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: OpcionSelector[];
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const idListbox = useId();

  useEffect(() => {
    function alClickAfuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    return () => document.removeEventListener("mousedown", alClickAfuera);
  }, []);

  const seleccionada = opciones.find((o) => o.valor === value);

  function elegir(valor: string) {
    onChange(valor);
    setAbierto(false);
  }

  return (
    <div ref={contenedorRef} className="relative mt-0.5">
      <button
        type="button"
        id={id}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idListbox}
        className="flex w-full items-center gap-1.5 bg-transparent font-display text-base font-semibold text-tinta focus:outline-none"
      >
        {seleccionada?.icono && <seleccionada.icono className="size-[18px] shrink-0 text-grafito" />}
        <span className="truncate">{seleccionada?.etiqueta ?? ""}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-grafito transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {abierto && (
        <ul
          id={idListbox}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 top-full z-20 mt-2 max-h-64 min-w-[10rem] overflow-auto rounded-card border border-borde bg-white py-1 shadow-lg"
        >
          {opciones.map((o) => (
            <li key={o.valor} role="option" aria-selected={o.valor === value}>
              <button
                type="button"
                onClick={() => elegir(o.valor)}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-humo ${
                  o.valor === value ? "font-semibold text-azul" : "text-tinta"
                }`}
              >
                {o.icono && (
                  <o.icono className={`size-[18px] shrink-0 ${o.valor === value ? "text-azul" : "text-grafito"}`} />
                )}
                <span className="flex-1 truncate">{o.etiqueta}</span>
                {o.valor === value && <Check className="size-4 shrink-0" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
