"use client";

import { useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";

/**
 * Galería de fotos de la ficha (A3). Placeholder tinta + líneas de
 * cancha en cada foto — todavía no hay fotos reales cargadas para
 * ningún complejo mock (Parte 4: nunca un rectángulo gris).
 *
 * Accesible por teclado de verdad: flechas para navegar con el
 * carrusel enfocado, más los botones prev/siguiente/puntos, cada
 * uno un control real y tabulable. Sin auto-avance — un carrusel
 * que se mueve solo sin control de pausa es una barrera de acceso
 * (WCAG 2.2.2), así que no lo repetimos de la referencia.
 */
export function GaleriaFotos({ fotos, nombreComplejo }: { fotos: string[]; nombreComplejo: string }) {
  const [indice, setIndice] = useState(0);

  function ir(nuevo: number) {
    setIndice((nuevo + fotos.length) % fotos.length);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      ir(indice - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      ir(indice + 1);
    }
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label={`Fotos de ${nombreComplejo}`}
      className="relative h-[300px] overflow-hidden bg-tinta focus:outline-none focus-visible:outline-2 focus-visible:outline-celeste md:h-[500px]"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${indice * 100}%)` }}
      >
        {fotos.map((foto, i) => (
          <div
            key={foto}
            role="group"
            aria-roledescription="foto"
            aria-label={`${i + 1} de ${fotos.length}: ${foto}`}
            aria-hidden={i !== indice}
            className="relative h-full w-full shrink-0"
          >
            <LineasDeCancha className="opacity-[0.16]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-tinta/60 px-4 py-1.5 text-sm text-white/80">{foto}</span>
            </div>
          </div>
        ))}
      </div>

      {fotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(indice - 1)}
            aria-label="Foto anterior"
            className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => ir(indice + 1)}
            aria-label="Foto siguiente"
            className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {fotos.map((foto, i) => (
              <button
                key={foto}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ir a la foto ${i + 1}`}
                aria-current={i === indice}
                className={`size-2 rounded-full transition-opacity ${i === indice ? "bg-white opacity-100" : "bg-white opacity-40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
