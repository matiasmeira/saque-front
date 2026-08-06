import { formatearPrecio } from "@/lib/formato";

/** Card grande con el saldo teórico en efectivo — fondo inicial + movimientos en efectivo, recalculado en vivo en el padre. */
export function CardSaldoTeorico({ saldoTeorico, fondoInicial }: { saldoTeorico: number; fondoInicial: number }) {
  return (
    <div className="rounded-card bg-tinta p-8 text-white shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9DB6D6]">Saldo teórico en efectivo</p>
      <p className="mt-2 font-display text-4xl font-extrabold tabular-nums">{formatearPrecio(saldoTeorico)}</p>
      <p className="mt-2 text-sm text-[#9DB6D6]">Fondo inicial: {formatearPrecio(fondoInicial)}</p>
    </div>
  );
}
