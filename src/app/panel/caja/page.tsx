"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Lock } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { FormAbrirCaja } from "@/components/panel/form-abrir-caja";
import { CardSaldoTeorico } from "@/components/panel/card-saldo-teorico";
import { TotalesPorMetodoCaja } from "@/components/panel/totales-por-metodo-caja";
import { TablaMovimientosCaja } from "@/components/panel/tabla-movimientos-caja";
import { FormMovimientoCaja, type DatosMovimientoCaja } from "@/components/panel/form-movimiento-caja";
import { SkeletonCaja } from "@/components/panel/skeleton-caja";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { useBloqueadoPorCaja, useEmpleadoActual, usePermisos } from "@/lib/permisos";
import { useRolPanel } from "@/lib/rol-panel";
import { abrirCaja, registrarMovimiento, useTurnoAbierto, vaciarCajaAbiertaDemo } from "@/lib/estado-caja";
import { calcularSaldoTeorico, calcularTotalesPorMetodo } from "@/mocks/caja";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import type { TipoMovimiento } from "@/mocks/caja";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "movimiento"; movimiento: TipoMovimiento } | null;

export default function PanelCaja() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const empleadoActual = useEmpleadoActual();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const puedeGestionarCaja = tienePermiso("gestionar_caja");

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);

  const nombreActual = rol === "dueno" ? "Dueño" : (empleadoActual?.nombre ?? "Dueño");

  useEffect(() => {
    if (!bloqueadoPorCaja && !puedeGestionarCaja) router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, puedeGestionarCaja, router]);

  useEffect(() => {
    if (mockVacio) vaciarCajaAbiertaDemo();
  }, [mockVacio]);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => setResuelto({ clave, error: mockError }), 500);
    return () => clearTimeout(id);
  }, [clave, mockError]);

  const turno = useTurnoAbierto();

  if (bloqueadoPorCaja || !puedeGestionarCaja) return <div className="min-h-dvh bg-humo" />;

  const saldoTeorico = turno ? calcularSaldoTeorico(turno.fondoInicial, turno.movimientos) : 0;
  const totalesPorMetodo = turno ? calcularTotalesPorMetodo(turno.movimientos) : null;

  function confirmarMovimiento(datos: DatosMovimientoCaja) {
    if (panelAbierto?.tipo !== "movimiento") return;
    registrarMovimiento(panelAbierto.movimiento, datos.monto, datos.descripcion);
    setPanelAbierto(null);
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Caja</h1>
            {turno && (
              <button
                type="button"
                onClick={() => router.push("/panel/caja/cerrar")}
                className="flex h-10 items-center gap-1.5 rounded-full bg-tinta px-4 font-display text-sm font-bold text-white transition-colors hover:bg-tinta/90 focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Lock className="size-4" aria-hidden />
                Cerrar caja
              </button>
            )}
          </div>

          {estadoCarga === "cargando" && <SkeletonCaja />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la caja.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && !turno && (
            <div className="py-8">
              <FormAbrirCaja onAbrir={(fondoInicial) => abrirCaja(fondoInicial, nombreActual)} />
            </div>
          )}

          {estadoCarga === "listo" && turno && totalesPorMetodo && (
            <div className="space-y-6">
              <CardSaldoTeorico saldoTeorico={saldoTeorico} fondoInicial={turno.fondoInicial} />

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Totales por método de pago</p>
                <TotalesPorMetodoCaja totales={totalesPorMetodo} />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPanelAbierto({ tipo: "movimiento", movimiento: "INGRESO" })}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  <ArrowUpCircle className="size-4 text-disponible" aria-hidden />
                  Registrar ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setPanelAbierto({ tipo: "movimiento", movimiento: "EGRESO" })}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  <ArrowDownCircle className="size-4 text-cancelado" aria-hidden />
                  Registrar retiro
                </button>
                {rol === "dueno" && (
                  <button
                    type="button"
                    onClick={() => router.push("/panel/caja/historial")}
                    className="ml-auto flex h-10 items-center gap-1.5 rounded-full text-sm font-semibold text-grafito transition-colors hover:text-azul focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    <History className="size-4" aria-hidden />
                    Ver historial de caja
                  </button>
                )}
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Movimientos del turno</p>
                <TablaMovimientosCaja movimientos={turno.movimientos} />
              </div>
            </div>
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "movimiento" && (
        <DrawerPanel titulo={panelAbierto.movimiento === "INGRESO" ? "Registrar ingreso" : "Registrar retiro"} onClose={() => setPanelAbierto(null)}>
          <FormMovimientoCaja tipo={panelAbierto.movimiento} onGuardar={confirmarMovimiento} onCancelar={() => setPanelAbierto(null)} />
        </DrawerPanel>
      )}
    </div>
  );
}
