"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { MetricaComparada, calcularVariacion } from "@/components/panel/metrica-comparada";
import { GraficoFacturacion } from "@/components/panel/grafico-facturacion";
import { GraficoOcupacionFranja } from "@/components/panel/grafico-ocupacion-franja";
import { OcupacionPorCancha } from "@/components/panel/ocupacion-por-cancha";
import { DesglosePorMetodo } from "@/components/panel/desglose-metodo-pago";
import { RankingHorarios } from "@/components/panel/ranking-horarios";
import { TopClientes } from "@/components/panel/top-clientes";
import { SkeletonReportes } from "@/components/panel/skeleton-reportes";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { finMes, finSemana, hoyISO, inicioMes, inicioSemana } from "@/lib/fecha";
import { formatearPrecio } from "@/lib/formato";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { generarReporte, type Reporte } from "@/mocks/reportes";

type EstadoCarga = "cargando" | "error" | "listo";

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo patrón que
// el resto del panel. TODO: reporte de demanda insatisfecha
// (búsquedas sin lugar) — no en esta versión, hace falta tráfico
// real de búsquedas del buscador (A2) para que tenga sentido.
// TODO: facturación de buffet y productos más vendidos (ver
// mocks/buffet.ts, ya tiene Venta/DetalleVenta) — para una próxima
// iteración de este reporte, no implementado todavía. Este archivo
// es solo el gancho, no un bloque nuevo en la pantalla.
export default function PanelReportes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [desde, setDesde] = useState(() => inicioMes(hoyISO()));
  const [hasta, setHasta] = useState(() => finMes(hoyISO()));
  const [reintento, setReintento] = useState(0);

  // Solo dueño — el sidebar ya le oculta el ítem al empleado, pero
  // acá además se redirige si entra por URL directa. "!bloqueadoPorCaja &&"
  // evita pisar el router.replace("/caja") de useBloqueadoPorCaja.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  const clave = `${desde}|${hasta}|${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setReporte(mockVacio ? null : generarReporte(desde, hasta));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, desde, hasta, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
          <h1 className="mb-5 font-display text-xl font-bold text-tinta">Reportes</h1>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-borde bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setDesde(inicioSemana(hoyISO()));
                  setHasta(finSemana(hoyISO()));
                }}
                className="h-8 rounded-full px-3.5 text-sm font-semibold text-grafito transition-colors hover:text-tinta"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => {
                  setDesde(inicioMes(hoyISO()));
                  setHasta(finMes(hoyISO()));
                }}
                className="h-8 rounded-full px-3.5 text-sm font-semibold text-grafito transition-colors hover:text-tinta"
              >
                Este mes
              </button>
            </div>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-label="Desde"
              className="h-10 rounded-full border border-borde bg-white px-3.5 text-sm text-tinta focus:border-azul focus:outline-none"
            />
            <span className="text-sm text-grafito">a</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              aria-label="Hasta"
              className="h-10 rounded-full border border-borde bg-white px-3.5 text-sm text-tinta focus:border-azul focus:outline-none"
            />
          </div>

          {estadoCarga === "cargando" && <SkeletonReportes />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los reportes.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && !reporte && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <BarChart3 className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay datos en este período</p>
              <p className="max-w-xs text-sm text-grafito">Probá con otro rango de fechas.</p>
            </div>
          )}

          {estadoCarga === "listo" && reporte && (
            <div className="space-y-4">
              {/* Bloque 1 — Facturación: el número estrella, va primero y grande. */}
              <div className="rounded-card bg-white p-5">
                <MetricaComparada
                  etiqueta="Facturación total"
                  valor={formatearPrecio(reporte.facturacion.actual.facturacionTotal)}
                  variacionPct={calcularVariacion(reporte.facturacion.actual.facturacionTotal, reporte.facturacion.anterior.facturacionTotal)}
                  grande
                />
                <div className="mt-4 border-t border-humo pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Por medio de pago</p>
                  <DesglosePorMetodo datos={reporte.facturacion.actual.desglosePorMetodo} />
                </div>
                <div className="mt-4 border-t border-humo pt-4">
                  <GraficoFacturacion actual={reporte.facturacion.actual.serieFacturacion} anterior={reporte.facturacion.anterior.serieFacturacion} />
                  <div className="mt-2 flex items-center gap-4 text-xs text-grafito">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 rounded-full bg-azul" aria-hidden />
                      Este período
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 rounded-full bg-grafito" aria-hidden />
                      Período anterior
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 2 — Ocupación */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-card bg-white p-5">
                  <MetricaComparada
                    etiqueta="Ocupación general"
                    valor={`${reporte.ocupacion.actual.ocupacionGeneral}%`}
                    nota="Horas reservadas / horas disponibles"
                    variacionPct={calcularVariacion(reporte.ocupacion.actual.ocupacionGeneral, reporte.ocupacion.anterior.ocupacionGeneral)}
                  />
                  <div className="mt-4 border-t border-humo pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grafito">Por franja horaria</p>
                    <GraficoOcupacionFranja datos={reporte.ocupacion.actual.ocupacionPorFranja} />
                  </div>
                </div>
                <div className="rounded-card bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Ocupación por cancha</p>
                  <p className="mb-4 mt-0.5 text-sm text-grafito">Cuál trabaja más</p>
                  <OcupacionPorCancha datos={reporte.ocupacion.actual.ocupacionPorCancha} />
                </div>
                <p className="text-xs text-grafito lg:col-span-2">{reporte.ocupacion.actual.notaMetodologica}</p>
              </div>

              {/* Bloque 3 — Horarios más pedidos */}
              <div className="rounded-card bg-white p-5">
                <p className="font-display text-base font-bold text-tinta">Horarios más pedidos</p>
                <p className="mb-4 mt-0.5 text-sm text-grafito">Para decidir dónde poner precio premium en Precios (C4).</p>
                <RankingHorarios horarios={reporte.horariosPedidos.actual.horariosMasPedidos} />
              </div>

              {/* Bloque 4 — Clientes y ausencias */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-card bg-white p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <MetricaComparada
                      etiqueta="Clientes nuevos"
                      valor={String(reporte.clientes.actual.clientesNuevos)}
                      variacionPct={calcularVariacion(reporte.clientes.actual.clientesNuevos, reporte.clientes.anterior.clientesNuevos)}
                    />
                    <MetricaComparada
                      etiqueta="Ausencias"
                      valor={String(reporte.clientes.actual.totalAusencias)}
                      variacionPct={calcularVariacion(reporte.clientes.actual.totalAusencias, reporte.clientes.anterior.totalAusencias)}
                    />
                  </div>
                  <p className="mt-4 border-t border-humo pt-4 text-xs text-grafito">
                    La seña reduce las ausencias — es uno de los argumentos del plan comisión frente a cobrar todo en el complejo.
                  </p>
                </div>
                <div className="rounded-card bg-white p-5">
                  <p className="mb-4 font-display text-base font-bold text-tinta">Top clientes por reservas</p>
                  <TopClientes clientes={reporte.clientes.actual.topClientes} />
                </div>
              </div>

              <div className="rounded-card bg-humo/70 p-5 text-center">
                <p className="text-sm text-grafito">
                  Demanda insatisfecha (búsquedas sin lugar) — próximamente, cuando haya tráfico real de búsquedas del buscador.
                </p>
                <p className="mt-1 text-sm text-grafito">Facturación de buffet y productos más vendidos — próximamente, en una próxima iteración.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
