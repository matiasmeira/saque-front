import Link from "next/link";
import { formatearPrecio } from "@/lib/formato";
import type { TurnoCajaResumenResponse } from "@/lib/api/tipos/caja";
import { EtiquetaMovil } from "@/components/panel/etiqueta-movil";

const COLUMNAS = "md:grid-cols-[1fr_1.4fr_1fr_1fr_1fr]";

function fechaCorta(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;
}

/**
 * El resumen del backend ya trae `diferencia` calculada; el saldo teórico no
 * viene en el listado (está en el detalle del turno). Se muestra el real y la
 * diferencia, que es lo que importa para escanear el historial.
 */
export function TablaHistorialCaja({ turnos }: { turnos: TurnoCajaResumenResponse[] }) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`hidden md:grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Abrió</span>
        <span>Fondo</span>
        <span>Real</span>
        <span>Diferencia</span>
      </div>

      <div className="divide-y divide-borde/60">
        {turnos.map((turno) => {
          const diferencia = turno.diferencia ?? 0;
          const colorDiferencia = diferencia > 0 ? "text-disponible" : diferencia < 0 ? "text-cancelado" : "text-grafito";
          return (
            <Link
              key={turno.id}
              href={`/panel/caja/historial/${turno.id}`}
              className={`grid grid-cols-2 ${COLUMNAS} gap-3 px-4 py-4 transition-colors hover:bg-humo/60 md:items-center md:px-6`}
            >
              <span className="text-sm text-tinta max-md:[order:-2]">
                <EtiquetaMovil>Fecha</EtiquetaMovil>
                {fechaCorta(turno.fechaApertura)}
              </span>
              <span className="min-w-0 truncate text-sm text-grafito">
                <EtiquetaMovil>Abrió</EtiquetaMovil>
                {turno.usuarioAperturaNombre}
              </span>
              <span className="text-sm text-tinta">
                <EtiquetaMovil>Fondo</EtiquetaMovil>
                {formatearPrecio(turno.fondoInicial)}
              </span>
              <span className="text-sm text-tinta">
                <EtiquetaMovil>Real</EtiquetaMovil>
                {formatearPrecio(turno.saldoRealContado ?? 0)}
              </span>
              <span className={`text-sm font-semibold tabular-nums max-md:[order:-1] ${colorDiferencia}`}>
                <EtiquetaMovil>Diferencia</EtiquetaMovil>
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
