"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, DollarSign, Percent, Receipt, TrendingUp, UserX, Users } from "lucide-react";
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
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { finMes, finSemana, hoyISO, inicioMes, inicioSemana } from "@/lib/fecha";
import { formatearPorcentaje, formatearPrecio } from "@/lib/formato";
import { reportes } from "@/lib/api/endpoints/reportes";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";

type EstadoCarga = "cargando" | "error" | "listo";

/** Cuántas filas traer en los dos rankings. El backend usa 10 si no se manda. */
const TOP_N = 5;

/**
 * C8 — el argumento de retención: números que le muestran al dueño que el
 * complejo le rinde, siempre contra el período anterior.
 *
 * Son CINCO requests independientes en paralelo, no una. El backend expone un
 * endpoint por bloque (facturación, ocupación, horarios pedidos, clientes,
 * resultado) y arma el comparativo él mismo: cada métrica llega como
 * `{actual, anterior}` ya calculada sobre el período inmediatamente previo de
 * igual duración. El front no deduce ni pide ese rango.
 *
 * Como son cinco, la pantalla no se cae entera si una falla: si fallan todas
 * (que es lo típico — se cayó la conexión o venció la sesión) va el error de
 * página completa; si falla una sola, el resto se muestra y ese bloque avisa
 * por su cuenta.
 *
 * TODO: reporte de demanda insatisfecha (búsquedas sin lugar) — hace falta
 * tráfico real del buscador. El buffet no está acá a propósito: sus métricas
 * viven en Cobros (/panel/pagos), pegadas a la tabla de ventas.
 */
export default function PanelReportes() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const { establecimientoId } = useEstablecimientoActivo();

  const [desde, setDesde] = useState(() => inicioMes(hoyISO()));
  const [hasta, setHasta] = useState(() => finMes(hoyISO()));

  // Solo dueño — el sidebar ya le oculta el ítem al empleado, pero acá además
  // se redirige si entra por URL directa. "!bloqueadoPorCaja &&" evita pisar el
  // router.replace("/caja") de useBloqueadoPorCaja. El backend igual responde
  // 403: los siete endpoints son @PreAuthorize("hasAnyRole('OWNER','ADMIN')").
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  const habilitado = establecimientoId !== null;
  const periodo = { desde, hasta };

  const [facturacion, ocupacion, horarios, clientes, resultado] = useQueries({
    queries: [
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "facturacion", desde, hasta),
        queryFn: () => reportes.facturacion(establecimientoId!, periodo),
        enabled: habilitado,
      },
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "ocupacion", desde, hasta),
        queryFn: () => reportes.ocupacion(establecimientoId!, periodo),
        enabled: habilitado,
      },
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "horarios-pedidos", desde, hasta),
        queryFn: () => reportes.horariosPedidos(establecimientoId!, { ...periodo, topN: TOP_N }),
        enabled: habilitado,
      },
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "clientes", desde, hasta),
        queryFn: () => reportes.clientes(establecimientoId!, { ...periodo, topN: TOP_N }),
        enabled: habilitado,
      },
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "resultado", desde, hasta),
        queryFn: () => reportes.resultado(establecimientoId!, periodo),
        enabled: habilitado,
      },
    ],
  });

  const consultas = [facturacion, ocupacion, horarios, clientes, resultado];
  const estadoCarga: EstadoCarga = consultas.some((c) => c.isPending)
    ? "cargando"
    : consultas.every((c) => c.isError)
      ? "error"
      : "listo";

  // Período sin actividad: ni un peso facturado, ni un gasto, ni una reserva
  // que rankear. Distinto de "falló": acá el backend contestó, con ceros.
  const sinDatos =
    facturacion.data?.totalFacturado.actual === 0 &&
    resultado.data?.totalGastos.actual === 0 &&
    horarios.data?.ranking.length === 0 &&
    clientes.data?.topClientes.length === 0;

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Reportes</h1>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-humo p-1">
              <button
                type="button"
                onClick={() => {
                  setDesde(inicioSemana(hoyISO()));
                  setHasta(finSemana(hoyISO()));
                }}
                className="h-9 rounded-full px-4 text-sm font-semibold text-grafito transition-colors hover:text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => {
                  setDesde(inicioMes(hoyISO()));
                  setHasta(finMes(hoyISO()));
                }}
                className="h-9 rounded-full px-4 text-sm font-semibold text-grafito transition-colors hover:text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Este mes
              </button>
            </div>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-label="Desde"
              className="h-10 rounded-full bg-humo px-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
            <span className="text-sm text-grafito">a</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              aria-label="Hasta"
              className="h-10 rounded-full bg-humo px-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
          </div>

          {estadoCarga === "cargando" && <SkeletonReportes />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los reportes.</p>
              <button
                type="button"
                onClick={() => consultas.forEach((c) => c.refetch())}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && sinDatos && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <BarChart3 className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay datos en este período</p>
              <p className="max-w-xs text-sm text-grafito">
                Los reportes cuentan turnos ya finalizados. Probá con otro rango de fechas.
              </p>
            </div>
          )}

          {estadoCarga === "listo" && !sinDatos && (
            <div className="space-y-6">
              {/* Fila de KPI — el número es la card entera, no un dato más adentro de otra card. */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {facturacion.data ? (
                  <MetricaComparada
                    etiqueta="Facturación total"
                    valor={formatearPrecio(facturacion.data.totalFacturado.actual)}
                    variacionPct={calcularVariacion(
                      facturacion.data.totalFacturado.actual,
                      facturacion.data.totalFacturado.anterior,
                    )}
                    icono={DollarSign}
                    grande
                  />
                ) : (
                  <MetricaCaida etiqueta="Facturación total" onReintentar={() => facturacion.refetch()} />
                )}

                {ocupacion.data ? (
                  <MetricaComparada
                    etiqueta="Ocupación general"
                    valor={formatearPorcentaje(ocupacion.data.porcentajeOcupacionGeneral.actual)}
                    nota="Horas reservadas / horas disponibles"
                    variacionPct={calcularVariacion(
                      ocupacion.data.porcentajeOcupacionGeneral.actual,
                      ocupacion.data.porcentajeOcupacionGeneral.anterior,
                    )}
                    icono={Percent}
                    colorBurbuja="bg-disponible-suave text-disponible"
                  />
                ) : (
                  <MetricaCaida etiqueta="Ocupación general" onReintentar={() => ocupacion.refetch()} />
                )}

                {clientes.data ? (
                  <MetricaComparada
                    etiqueta="Clientes nuevos"
                    valor={String(clientes.data.clientesNuevos.actual)}
                    nota="Sólo jugadores registrados: las reservas del mostrador no cuentan"
                    variacionPct={calcularVariacion(
                      clientes.data.clientesNuevos.actual,
                      clientes.data.clientesNuevos.anterior,
                    )}
                    icono={Users}
                  />
                ) : (
                  <MetricaCaida etiqueta="Clientes nuevos" onReintentar={() => clientes.refetch()} />
                )}

                {clientes.data ? (
                  <MetricaComparada
                    etiqueta="Ausencias"
                    valor={
                      clientes.data.ausencias.disponible ? String(clientes.data.ausencias.total ?? 0) : "—"
                    }
                    // El backend NO manda el dato del período anterior para esta
                    // métrica: `ausencias` es un AusenciasInfo, no un Comparativo.
                    // Sin base para comparar, la card no muestra variación.
                    nota={
                      clientes.data.ausencias.disponible
                        ? "La seña reduce las ausencias"
                        : (clientes.data.ausencias.motivoNoDisponible ?? "Métrica no disponible")
                    }
                    variacionPct={null}
                    icono={UserX}
                    colorBurbuja="bg-pendiente-suave text-pendiente"
                  />
                ) : (
                  <MetricaCaida etiqueta="Ausencias" onReintentar={() => clientes.refetch()} />
                )}
              </div>

              {/* Bloque 1 — Facturación, el detalle detrás del número de arriba. */}
              {facturacion.data && (
                <div className="rounded-card bg-white p-7 shadow-card">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Por medio de pago</p>
                  <DesglosePorMetodo datos={facturacion.data.desglosePorMetodoPago} />
                  <div className="mt-6 border-t border-humo pt-6">
                    <GraficoFacturacion serie={facturacion.data.serieTemporal} />
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
              )}

              {/* Bloque 2 — Ocupación */}
              {ocupacion.data && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-card bg-white p-6 shadow-card">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grafito">Por franja horaria</p>
                    <GraficoOcupacionFranja datos={ocupacion.data.ocupacionPorFranja} />
                  </div>
                  <div className="rounded-card bg-white p-6 shadow-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Ocupación por cancha</p>
                    <p className="mb-4 mt-0.5 text-sm text-grafito">Cuál trabaja más</p>
                    <OcupacionPorCancha datos={ocupacion.data.ocupacionPorCancha} />
                  </div>
                  <p className="text-xs text-grafito lg:col-span-2">{ocupacion.data.notaMetodologica}</p>
                </div>
              )}

              {/* Bloque 3 — Horarios más pedidos */}
              {horarios.data && horarios.data.ranking.length > 0 && (
                <div className="rounded-card bg-white p-6 shadow-card">
                  <p className="font-display text-lg font-bold text-tinta">Horarios más pedidos</p>
                  <p className="mb-4 mt-0.5 text-sm text-grafito">Para decidir dónde poner precio premium en Precios (C4).</p>
                  <RankingHorarios horarios={horarios.data.ranking} />
                </div>
              )}

              {/* Bloque 4 — Top clientes */}
              {clientes.data && clientes.data.topClientes.length > 0 && (
                <div className="rounded-card bg-white p-6 shadow-card">
                  <p className="font-display text-lg font-bold text-tinta">Top clientes por reservas</p>
                  <p className="mb-4 mt-0.5 text-sm text-grafito">
                    Sólo jugadores con cuenta — las reservas cargadas a mano desde el mostrador no tienen a quién
                    atribuirse.
                  </p>
                  <TopClientes clientes={clientes.data.topClientes} />
                </div>
              )}

              {/* Bloque 5 — Resultado (facturado, gastos y neto). */}
              {resultado.data && (
                <div className="rounded-card bg-white p-6 shadow-card">
                  <p className="mb-4 font-display text-lg font-bold text-tinta">Resultado</p>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <MetricaComparada
                      etiqueta="Facturado"
                      valor={formatearPrecio(resultado.data.totalFacturado.actual)}
                      variacionPct={calcularVariacion(
                        resultado.data.totalFacturado.actual,
                        resultado.data.totalFacturado.anterior,
                      )}
                      icono={DollarSign}
                    />
                    <MetricaComparada
                      etiqueta="Gastos"
                      valor={formatearPrecio(resultado.data.totalGastos.actual)}
                      variacionPct={calcularVariacion(
                        resultado.data.totalGastos.actual,
                        resultado.data.totalGastos.anterior,
                      )}
                      icono={Receipt}
                      colorBurbuja="bg-pendiente-suave text-pendiente"
                    />
                    <MetricaComparada
                      etiqueta="Neto"
                      valor={formatearPrecio(resultado.data.neto.actual)}
                      variacionPct={calcularVariacion(resultado.data.neto.actual, resultado.data.neto.anterior)}
                      icono={TrendingUp}
                      colorBurbuja="bg-disponible-suave text-disponible"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-card bg-humo/70 p-6 text-center">
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

/**
 * Ocupa el lugar de una KPI cuyo endpoint falló, en vez de dejar el hueco. Los
 * cinco reportes son requests separadas: que se caiga una no dice nada de las
 * otras cuatro.
 */
function MetricaCaida({ etiqueta, onReintentar }: { etiqueta: string; onReintentar: () => void }) {
  return (
    <div className="flex flex-col items-start justify-center gap-2 rounded-card bg-white p-6 shadow-card">
      <AlertTriangle className="size-5 text-cancelado" aria-hidden />
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className="text-sm text-grafito">No pudimos calcular esta métrica.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="text-sm font-semibold text-azul underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-celeste"
      >
        Reintentar
      </button>
    </div>
  );
}
