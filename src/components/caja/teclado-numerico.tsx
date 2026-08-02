"use client";

import { Delete } from "lucide-react";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "borrar"] as const;

/**
 * Teclado numérico grande, pensado para el dedo — botones de 20
 * unidades de alto, sin hover que dependa de mouse. Los puntitos de
 * arriba muestran cuántos dígitos van, nunca el PIN en texto: es la
 * única confirmación visual, no hace falta un botón "Confirmar"
 * aparte, verifica solo al llegar al cuarto dígito.
 */
export function TecladoNumerico({
  valor,
  longitud = 4,
  deshabilitado,
  onDigito,
  onBorrar,
}: {
  valor: string;
  longitud?: number;
  deshabilitado?: boolean;
  onDigito: (digito: string) => void;
  onBorrar: () => void;
}) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-4" role="status" aria-label={`${valor.length} de ${longitud} dígitos ingresados`}>
        {Array.from({ length: longitud }).map((_, i) => (
          <span key={i} className={`size-4 rounded-full transition-colors ${i < valor.length ? "bg-celeste" : "bg-white/15"}`} aria-hidden />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TECLAS.map((tecla, i) => {
          if (tecla === "") return <div key={`vacio-${i}`} aria-hidden />;
          if (tecla === "borrar") {
            return (
              <button
                key="borrar"
                type="button"
                onClick={onBorrar}
                disabled={deshabilitado || valor.length === 0}
                aria-label="Borrar último dígito"
                className="flex h-20 items-center justify-center rounded-card bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Delete className="size-7" aria-hidden />
              </button>
            );
          }
          return (
            <button
              key={tecla}
              type="button"
              onClick={() => onDigito(tecla)}
              disabled={deshabilitado || valor.length >= longitud}
              aria-label={`Dígito ${tecla}`}
              className="flex h-20 items-center justify-center rounded-card bg-white/10 font-display text-3xl font-bold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {tecla}
            </button>
          );
        })}
      </div>
    </div>
  );
}
