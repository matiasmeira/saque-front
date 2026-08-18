import { UserX } from "lucide-react";
import type { TopClienteDto } from "@/lib/api/tipos/reportes";

/**
 * Top clientes por reservas FINALIZADA en el período.
 *
 * `ausencias` viene en el DTO y no se mostraba: es justo el dato que hace
 * accionable la lista, porque distingue al cliente que más juega del que más
 * veces no apareció. Sólo se muestra cuando hay alguna.
 */
export function TopClientes({ clientes }: { clientes: TopClienteDto[] }) {
  return (
    <ol className="space-y-2">
      {clientes.map((c, i) => (
        <li key={c.jugadorId} className="flex items-center gap-3 rounded-input bg-humo p-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-tinta">{i + 1}</span>
          <span className="flex-1 truncate text-sm font-semibold text-tinta">{c.nombre}</span>
          {c.ausencias > 0 && (
            <span className="flex items-center gap-1 text-sm tabular-nums text-pendiente" title={`${c.ausencias} ausencias en el período`}>
              <UserX className="size-3.5 shrink-0" aria-hidden />
              {c.ausencias}
            </span>
          )}
          <span className="text-sm tabular-nums text-grafito">
            {c.cantidadReservas} {c.cantidadReservas === 1 ? "reserva" : "reservas"}
          </span>
        </li>
      ))}
    </ol>
  );
}
