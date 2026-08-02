"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { CodigoQR } from "@/components/panel/codigo-qr";

/** "9:58" — mm:ss, siempre dos dígitos de segundos. */
function formatearCuentaRegresiva(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Nunca se renderiza en el servidor — solo se monta dentro de un
 * modal que abre un click, así que leer window acá adentro es
 * seguro (no hay hidratación de la que preocuparse).
 */
export function GenerarLinkCaja({ token, expiraEn }: { token: string; expiraEn: string }) {
  const [origen] = useState(() => window.location.origin);
  const link = `${origen}/caja/emparejar/${token}`;

  const [segundosRestantes, setSegundosRestantes] = useState(() => Math.max(0, Math.round((new Date(expiraEn).getTime() - Date.now()) / 1000)));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const id = setTimeout(() => setSegundosRestantes(segundosRestantes - 1), 1000);
    return () => clearTimeout(id);
  }, [segundosRestantes]);

  const vencido = segundosRestantes <= 0;

  function copiar() {
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CodigoQR valor={link} />

      <div className="w-full rounded-input bg-humo p-3">
        <p className="break-all text-sm text-tinta">{link}</p>
      </div>

      <button
        type="button"
        onClick={copiar}
        disabled={vencido}
        className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copiado ? <Check className="size-4 text-disponible" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copiado ? "Copiado" : "Copiar link"}
      </button>

      <p className={`font-display text-lg font-bold ${vencido ? "text-cancelado" : "text-tinta"}`}>
        {vencido ? "Link vencido" : `Vence en ${formatearCuentaRegresiva(segundosRestantes)}`}
      </p>

      <p className="text-xs text-grafito">Un solo uso — caduca en 10 minutos si nadie lo abre antes.</p>
    </div>
  );
}
