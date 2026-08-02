"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Panel lateral compartido por "Nuevo turno" y el detalle de un
 * turno ocupado — mismo mecanismo de apertura/cierre, distinto
 * contenido adentro. Header tinta: es el único elemento del diseño
 * anterior que se conserva a propósito (Parte 9 lo pide así).
 */
export function DrawerPanel({
  titulo,
  subtitulo,
  onClose,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-tinta/40" />

      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 bg-tinta px-6 py-5 text-white">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 truncate text-sm text-[#9DB6D6]">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
