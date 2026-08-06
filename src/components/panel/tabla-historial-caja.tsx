import Link from "next/link";
import { formatearPrecio } from "@/lib/formato";
import { calcularDiferencia, calcularSaldoTeorico, type TurnoCaja } from "@/mocks/caja";

const COLUMNAS = "grid-cols-[1fr_1.4fr_1fr_1fr_1fr_1fr]";

function fechaCorta(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;
}

export function TablaHistorialCaja({ turnos }: { turnos: TurnoCaja[] }) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Abrió / cerró</span>
        <span>Fondo</span>
        <span>Teórico</span>
        <span>Real</span>
        <span>Diferencia</span>
      </div>

      <div className="divide-y divide-borde/60">
        {turnos.map((turno) => {
          const saldoTeorico = calcularSaldoTeorico(turno.fondoInicial, turno.movimientos);
          const diferencia = turno.saldoReal !== undefined ? calcularDiferencia(saldoTeorico, turno.saldoReal) : 0;
          const colorDiferencia = diferencia > 0 ? "text-disponible" : diferencia < 0 ? "text-cancelado" : "text-grafito";
          return (
            <Link
              key={turno.id}
              href={`/panel/caja/historial/${turno.id}`}
              className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4 transition-colors hover:bg-humo/60`}
            >
              <span className="text-sm text-tinta">{fechaCorta(turno.fechaApertura)}</span>
              <span className="min-w-0 truncate text-sm text-grafito">
                {turno.abiertoPor}
                {turno.cerradoPor && turno.cerradoPor !== turno.abiertoPor ? ` / ${turno.cerradoPor}` : ""}
              </span>
              <span className="text-sm text-tinta">{formatearPrecio(turno.fondoInicial)}</span>
              <span className="text-sm text-tinta">{formatearPrecio(saldoTeorico)}</span>
              <span className="text-sm text-tinta">{formatearPrecio(turno.saldoReal ?? 0)}</span>
              <span className={`text-sm font-semibold tabular-nums ${colorDiferencia}`}>
                {diferencia > 0 ? "+" : ""}
                {formatearPrecio(diferencia)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
