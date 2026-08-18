import { DIA_SEMANA_DESDE_BACK } from "@/lib/api/fechas";
import { DIAS_SEMANA } from "@/lib/panel/tarifas";
import type { HorarioPedidoDto } from "@/lib/api/tipos/reportes";
import type { DiaSemanaBack } from "@/lib/api/tipos/comunes";

function etiquetaDia(dia: DiaSemanaBack): string {
  const corto = DIA_SEMANA_DESDE_BACK[dia];
  return DIAS_SEMANA.find((d) => d.valor === corto)?.larga ?? dia;
}

/**
 * `20` → `"20:00"`. El backend manda la hora como entero, no como LocalTime, y
 * agrupa por hora entera: un turno que arranca 21:30 cae en el bucket 21. La
 * etiqueta nombra la franja de una hora, no el minuto exacto de inicio.
 */
function etiquetaHora(hora: number): string {
  return `${String(hora).padStart(2, "0")}:00`;
}

/** Le sirve al dueño para decidir dónde poner precio premium — se conecta directo con las tarifas especiales de C4. */
export function RankingHorarios({ horarios }: { horarios: HorarioPedidoDto[] }) {
  if (horarios.length === 0) return null;
  const primero = horarios[0];

  return (
    <div>
      <p className="mb-3 text-sm text-grafito">
        Tu horario más pedido:{" "}
        <span className="font-semibold text-tinta">
          {etiquetaDia(primero.diaSemana)} {etiquetaHora(primero.hora)}
        </span>
      </p>
      <ol className="space-y-2">
        {horarios.map((h, i) => (
          <li key={`${h.diaSemana}-${h.hora}`} className="flex items-center gap-3 rounded-input bg-humo p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-tinta">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-semibold text-tinta">
              {etiquetaDia(h.diaSemana)} {etiquetaHora(h.hora)}
            </span>
            <span className="text-sm tabular-nums text-grafito">
              {h.cantidadReservas} {h.cantidadReservas === 1 ? "reserva" : "reservas"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
