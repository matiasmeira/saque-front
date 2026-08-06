"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { buscarTurnoCerradoPorId } from "@/lib/estado-caja";
import { calcularDiferencia, calcularSaldoTeorico } from "@/mocks/caja";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { fechaLarga, formatearPrecio } from "@/lib/formato";

function Dato({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: "negativo" | "destacado" }) {
  const color = tono === "negativo" ? "text-cancelado" : tono === "destacado" ? "text-disponible" : "text-tinta";
  return (
    <div className="flex items-center justify-between border-b border-borde/60 py-3 text-sm last:border-0">
      <span className="text-grafito">{etiqueta}</span>
      <span className={`font-display font-bold tabular-nums ${color}`}>{valor}</span>
    </div>
  );
}

// TODO backend: turno cerrado vendría de GET /caja/turnos/{turnoId} en vez de leerse del estado en memoria.
export default function ResumenCierreCaja({ params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = use(params);
  const router = useRouter();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const puedeGestionarCaja = tienePermiso("gestionar_caja");
  const turno = buscarTurnoCerradoPorId(turnoId);

  useEffect(() => {
    if (!bloqueadoPorCaja && !puedeGestionarCaja) router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, puedeGestionarCaja, router]);

  if (bloqueadoPorCaja || !puedeGestionarCaja) return <div className="min-h-dvh bg-humo" />;

  if (!turno) {
    return (
      <div className="flex h-dvh bg-humo">
        <SidebarPanel />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <p className="text-sm text-grafito">No encontramos ese turno de caja.</p>
          </main>
        </div>
      </div>
    );
  }

  const ingresos = turno.movimientos.filter((m) => m.tipo === "INGRESO" && m.metodoPago === "EFECTIVO").reduce((acc, m) => acc + m.monto, 0);
  const egresos = turno.movimientos.filter((m) => m.tipo === "EGRESO" && m.metodoPago === "EFECTIVO").reduce((acc, m) => acc + m.monto, 0);
  const saldoTeorico = calcularSaldoTeorico(turno.fondoInicial, turno.movimientos);
  const diferencia = turno.saldoReal !== undefined ? calcularDiferencia(saldoTeorico, turno.saldoReal) : 0;

  return (
    <div className="flex h-dvh bg-humo print:h-auto print:bg-white">
      <div className="print:hidden">
        <SidebarPanel />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8 print:overflow-visible print:px-0 print:py-0">
          <div className="mx-auto max-w-lg space-y-6">
            <div className="flex items-center justify-between print:hidden">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Caja cerrada</h1>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </button>
            </div>

            <div className="rounded-card bg-white p-6 shadow-card print:rounded-none print:p-0 print:shadow-none">
              <p className="mb-1 font-display text-lg font-extrabold text-tinta">{PANEL_COMPLEJO.nombre}</p>
              <p className="mb-4 text-sm text-grafito">
                {fechaLarga(turno.fechaApertura.slice(0, 10))} — {turno.abiertoPor}
                {turno.cerradoPor && turno.cerradoPor !== turno.abiertoPor ? ` (cerró ${turno.cerradoPor})` : ""}
              </p>

              <Dato etiqueta="Fondo inicial" valor={formatearPrecio(turno.fondoInicial)} />
              <Dato etiqueta="Ingresos en efectivo" valor={`+${formatearPrecio(ingresos)}`} tono="destacado" />
              <Dato etiqueta="Egresos en efectivo" valor={`−${formatearPrecio(egresos)}`} tono="negativo" />
              <Dato etiqueta="Saldo teórico" valor={formatearPrecio(saldoTeorico)} />
              <Dato etiqueta="Efectivo real contado" valor={formatearPrecio(turno.saldoReal ?? 0)} />
              <Dato
                etiqueta={diferencia > 0 ? "Sobrante" : diferencia < 0 ? "Faltante" : "Diferencia"}
                valor={`${diferencia > 0 ? "+" : ""}${formatearPrecio(diferencia)}`}
                tono={diferencia > 0 ? "destacado" : diferencia < 0 ? "negativo" : undefined}
              />

              {turno.observaciones && (
                <div className="mt-4 border-t border-borde/60 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Observaciones</p>
                  <p className="mt-1 text-sm text-tinta">{turno.observaciones}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/panel/caja")}
              className="flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste print:hidden"
            >
              Volver a Caja
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
