"use client";

import { useState } from "react";
import { SERVICIOS } from "@/lib/servicios";
import type { Servicio } from "@/lib/api/tipos/comunes";

/**
 * Los 7 servicios del enum del backend, como chips.
 *
 * Ojo con el contrato del PUT: `servicios == null` significa "no modificar" y
 * `[]` significa "borrar todos" (está documentado en `EstablecimientoRequest`).
 * Este formulario SIEMPRE manda la lista, así que destildar todo los borra —
 * que es exactamente lo que la persona pidió. La distinción importa para las
 * otras secciones de la pantalla, que no mandan el campo.
 */
export function FormServicios({
  servicios,
  guardando,
  onGuardar,
}: {
  servicios: Servicio[];
  guardando: boolean;
  onGuardar: (servicios: Servicio[]) => void;
}) {
  const [elegidos, setElegidos] = useState<Servicio[]>(servicios);

  function alternar(valor: Servicio) {
    setElegidos((prev) => (prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SERVICIOS.map(({ valor, etiqueta, Icono }) => {
          const activo = elegidos.includes(valor);
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alternar(valor)}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                activo
                  ? "bg-celeste-suave text-tinta"
                  : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
              }`}
            >
              <Icono className="size-4 shrink-0" aria-hidden />
              {etiqueta}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onGuardar(elegidos)}
        disabled={guardando}
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar servicios"}
      </button>
    </div>
  );
}
