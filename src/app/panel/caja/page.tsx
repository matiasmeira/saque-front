"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { useRolPanel } from "@/lib/rol-panel";
import { useAccionesCaja, useCajaAbierta } from "@/hooks/api/use-caja";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import type { MetodoPago } from "@/lib/api/tipos/comunes";
import type { TipoMovimiento } from "@/mocks/caja";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "movimiento"; movimiento: TipoMovimiento } | null;

export default function PanelCaja() {
  const router = useRouter();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const puedeGestionarCaja = tienePermiso("OPERAR_CAJA");

  const { establecimientoId } = useEstablecimientoActivo();
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  useEffect(() => {
    if (!bloqueadoPorCaja && !puedeGestionarCaja) router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, puedeGestionarCaja, router]);

  const { caja, movimientos, puedeVerMovimientos, cargando, error, refetch } =
    useCajaAbierta(establecimientoId);
  const acciones = useAccionesCaja(establecimientoId);

  const estadoCarga: EstadoCarga = cargando ? "cargando" : error ? "error" : "listo";

  if (bloqueadoPorCaja || !puedeGestionarCaja) return <div className="min-h-dvh bg-humo" />;

  // El saldo teórico y los totales por método los calcula el BACKEND: dejaron de
  // derivarse en el cliente a partir de la lista de movimientos.
  const turno = caja?.turno ?? null;
  const saldoTeorico = caja?.saldoTeoricoEfectivo ?? 0;
  // El backend sólo incluye los métodos que TUVIERON movimiento; el panel de
  // totales espera los cinco, así que se completan en cero.
  const totalesPorMetodo = caja
    ? (Object.fromEntries(
        METODOS_PAGO.map((m) => [m.valor, caja.totalIngresosPorMetodoPago[m.valor] ?? 0]),
      ) as Record<MetodoPago, number>)
    : null;

  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  async function confirmarMovimiento(datos: DatosMovimientoCaja) {
    if (panelAbierto?.tipo !== "movimiento") return;
    setErrorAccion(null);
    try {
      await acciones.registrarMovimiento.mutateAsync({
        tipo: panelAbierto.movimiento,
        monto: datos.monto,
        descripcion: datos.descripcion,
      });
      setPanelAbierto(null);
    } catch (e) {
      alFallar(e, "No pudimos registrar el movimiento.");
    }
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

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

          {errorAccion && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonCaja />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la caja.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && !turno && (
            <div className="py-8">
              <FormAbrirCaja onAbrir={(fondoInicial) => acciones.abrir.mutate({ fondoInicial })} />
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
                {puedeVerMovimientos ? (
                  <TablaMovimientosCaja movimientos={movimientos} />
                ) : (
                  /* El detalle con los movimientos sólo lo devuelve
                     GET /caja/turnos/{id}, que es OWNER/ADMIN. */
                  <p className="rounded-card bg-white p-6 text-sm text-grafito shadow-card">
                    El detalle de movimientos lo ve el dueño. Podés seguir operando la caja
                    normalmente.
                  </p>
                )}
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
