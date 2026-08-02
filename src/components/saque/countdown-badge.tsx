"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

/**
 * El cartel del cronómetro: turno congelado, visible en todo A4 y
 * reutilizado en el checkout (A7). Nunca redirección silenciosa al
 * vencer — siempre el mensaje claro más "Buscar otro horario"
 * (Parte 9, A4).
 */
function formatearRestante(ms: number) {
  const totalSeg = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeg / 60);
  const s = totalSeg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CountdownBadge({
  deadline,
  etiquetaTurno,
  hrefBuscarOtro = "/buscar",
  onVencido,
}: {
  /** epoch ms — cuándo se libera el turno */
  deadline: number;
  /** ej. "sábado 20:00" */
  etiquetaTurno: string;
  hrefBuscarOtro?: string;
  onVencido?: () => void;
}) {
  const [restante, setRestante] = useState(() => deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRestante(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    if (restante <= 0) onVencido?.();
  }, [restante, onVencido]);

  if (restante <= 0) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-cancelado px-4 py-3 text-center text-sm text-white">
        <span>Se venció el tiempo para reservar el {etiquetaTurno}.</span>
        <Link href={hrefBuscarOtro} className="font-semibold underline underline-offset-2">
          Buscar otro horario
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-tinta px-4 py-3 text-center text-sm text-white">
      <Clock className="size-4 shrink-0 text-celeste" aria-hidden />
      <span>
        Te guardamos el turno del {etiquetaTurno} por{" "}
        <span className="font-display font-bold tabular-nums text-celeste">{formatearRestante(restante)}</span>
      </span>
    </div>
  );
}
