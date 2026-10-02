"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogoAccesible } from "@/hooks/use-dialogo-accesible";

/**
 * Centrado, no lateral — a diferencia de DrawerPanel (que es para
 * editar una entidad con varios campos), esto es para una decisión
 * puntual y corta: invitar a alguien, confirmar una baja. Mismo
 * lenguaje visual (header tinta) para que se sienta parte del mismo
 * panel.
 */
export function ModalPanel({
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
  const ref = useRef<HTMLDivElement>(null);
  const { idTitulo } = useDialogoAccesible({ ref, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" tabIndex={-1} aria-hidden onClick={onClose} className="absolute inset-0 bg-tinta/40" />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-card bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 bg-tinta px-6 py-5 text-white">
          <div className="min-w-0">
            <h2 id={idTitulo} className="truncate font-display text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-[#9DB6D6]">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-dialogo-cerrar=""
            className="flex size-9 max-md:size-11 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
