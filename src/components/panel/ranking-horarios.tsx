import { DIAS_SEMANA } from "@/mocks/tarifas";
import type { HorarioPedido } from "@/mocks/reportes";

function etiquetaDia(dia: string): string {
  return DIAS_SEMANA.find((d) => d.valor === dia)?.larga ?? dia;
}

/** Le sirve al dueño para decidir dónde poner precio premium — se conecta directo con las tarifas especiales de C4. */
export function RankingHorarios({ horarios }: { horarios: HorarioPedido[] }) {
  if (horarios.length === 0) return null;
  const primero = horarios[0];

  return (
    <div>
      <p className="mb-3 text-sm text-grafito">
        Tu horario más pedido: <span className="font-semibold text-tinta">{etiquetaDia(primero.dia)} {primero.hora}</span>
      </p>
      <ol className="space-y-2">
        {horarios.map((h, i) => (
          <li key={`${h.dia}-${h.hora}`} className="flex items-center gap-3 rounded-input bg-humo p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-tinta">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-semibold text-tinta">
              {etiquetaDia(h.dia)} {h.hora}
            </span>
            <span className="text-sm tabular-nums text-grafito">{h.reservas} reservas</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
