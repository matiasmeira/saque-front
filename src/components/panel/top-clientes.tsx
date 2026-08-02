import type { TopCliente } from "@/mocks/reportes";

export function TopClientes({ clientes }: { clientes: TopCliente[] }) {
  return (
    <ol className="space-y-2">
      {clientes.map((c, i) => (
        <li key={c.nombre} className="flex items-center gap-3 rounded-input bg-humo p-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-tinta">{i + 1}</span>
          <span className="flex-1 truncate text-sm font-semibold text-tinta">{c.nombre}</span>
          <span className="text-sm tabular-nums text-grafito">{c.reservas} reservas</span>
        </li>
      ))}
    </ol>
  );
}
