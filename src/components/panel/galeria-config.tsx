"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { FOTOS_MINIMO_RECOMENDADO, type FotoComplejo } from "@/mocks/config";

/**
 * Mismo placeholder que la galería pública (Parte 4: nunca un
 * rectángulo gris) — hoy no hay subida real de archivos, cada foto
 * es una etiqueta. Reordenar/eliminar es inmediato, sin "Guardar"
 * aparte: son ítems de una lista, no campos de un form.
 */
export function GaleriaConfig({
  fotos,
  onAgregar,
  onEliminar,
  onMover,
}: {
  fotos: FotoComplejo[];
  onAgregar: (etiqueta: string) => void;
  onEliminar: (id: string) => void;
  onMover: (id: string, direccion: -1 | 1) => void;
}) {
  const [etiquetaNueva, setEtiquetaNueva] = useState("");

  function agregar(e: FormEvent) {
    e.preventDefault();
    if (!etiquetaNueva.trim()) return;
    onAgregar(etiquetaNueva.trim());
    setEtiquetaNueva("");
  }

  return (
    <div className="space-y-4">
      {fotos.length < FOTOS_MINIMO_RECOMENDADO && (
        <div className="flex items-start gap-2 rounded-input bg-pendiente-suave px-3.5 py-2.5 text-sm text-pendiente">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Recomendamos al menos {FOTOS_MINIMO_RECOMENDADO} fotos — con menos, el complejo se ve incompleto en el
            marketplace.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((foto, i) => (
          <div key={foto.id} className="relative aspect-video overflow-hidden rounded-input bg-tinta">
            <LineasDeCancha className="opacity-[0.16]" />
            <div className="absolute inset-0 flex items-center justify-center px-2">
              <span className="truncate rounded-full bg-tinta/60 px-2.5 py-1 text-xs text-white/90">{foto.etiqueta}</span>
            </div>
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onMover(foto.id, -1)}
                  disabled={i === 0}
                  aria-label={`Mover ${foto.etiqueta} antes`}
                  className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowLeft className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onMover(foto.id, 1)}
                  disabled={i === fotos.length - 1}
                  aria-label={`Mover ${foto.etiqueta} después`}
                  className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onEliminar(foto.id)}
                aria-label={`Eliminar ${foto.etiqueta}`}
                className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-cancelado"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={agregar} className="flex gap-2">
        <input
          value={etiquetaNueva}
          onChange={(e) => setEtiquetaNueva(e.target.value)}
          placeholder="Ej: Cancha techada"
          aria-label="Descripción de la foto nueva"
          className="w-full rounded-input bg-humo px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
        <button
          type="submit"
          disabled={!etiquetaNueva.trim()}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          <Plus className="size-4" aria-hidden />
          Agregar
        </button>
      </form>
      {/* TODO backend: subida real de archivos — hoy cada foto es solo una etiqueta de texto, sin imagen. */}
    </div>
  );
}
