import { ArrowDown, ArrowUp } from "lucide-react";

/**
 * Un número solo no motiva — siempre va con la comparación contra
 * el período anterior. Verde/rojo son colores de estado (mismo
 * "disponible"/"cancelado" que el resto del panel), no de marca:
 * más que antes es una buena noticia, menos es una mala, y el
 * ícono + texto lo dicen siempre, nunca solo el color.
 */
export function MetricaComparada({
  etiqueta,
  valor,
  nota,
  variacionPct,
  grande,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
  /** null cuando no hay base para comparar (ej. período anterior en $0) */
  variacionPct: number | null;
  grande?: boolean;
}) {
  return (
    <div className="rounded-card bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className={`mt-1 font-display font-extrabold tabular-nums text-tinta ${grande ? "text-4xl" : "text-2xl"}`}>{valor}</p>
      {variacionPct !== null && (
        <p className={`mt-1.5 flex items-center gap-1 text-sm font-semibold ${variacionPct >= 0 ? "text-disponible" : "text-cancelado"}`}>
          {variacionPct >= 0 ? <ArrowUp className="size-3.5 shrink-0" aria-hidden /> : <ArrowDown className="size-3.5 shrink-0" aria-hidden />}
          <span className="tabular-nums">{Math.abs(Math.round(variacionPct))}%</span>
          <span className="font-normal text-grafito">vs. período anterior</span>
        </p>
      )}
      {nota && <p className="mt-1 text-xs text-grafito">{nota}</p>}
    </div>
  );
}

/** % de variación entre dos valores — null si no hay base (evita dividir por 0 y mostrar un "Infinity%" sin sentido). */
export function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}
