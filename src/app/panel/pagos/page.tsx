"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Receipt } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ResumenCobros } from "@/components/panel/resumen-cobros";
import { TablaVentasBuffet } from "@/components/panel/tabla-ventas-buffet";
import { ProductosMasVendidos } from "@/components/panel/productos-mas-vendidos";
import { SkeletonPagos } from "@/components/panel/skeleton-pagos";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { finMes, finSemana, hoyISO, inicioMes, inicioSemana } from "@/lib/fecha";
import { etiquetaMetodoPago } from "@/lib/metodos-pago";
import { formatearPrecio } from "@/lib/formato";
import { ventasBuffet } from "@/lib/api/endpoints/buffet";
import { reportes } from "@/lib/api/endpoints/reportes";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { VentaResumenResponse } from "@/lib/api/tipos/buffet";
import type { EstadoVenta } from "@/lib/api/tipos/comunes";

type EstadoCarga = "cargando" | "error" | "listo";

const POR_PAGINA = 20;

/** Tope del barrido del export: 20 páginas de 100 = 2000 ventas. */
const PAGINAS_MAXIMAS_EXPORT = 20;

const FILTROS_ESTADO: { valor: EstadoVenta | "todas"; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "CONFIRMADA", etiqueta: "Confirmadas" },
  { valor: "CANCELADA", etiqueta: "Canceladas" },
];

/** El mensaje del backend cuando lo hay; el genérico cuando el error no vino de la API. */
function mensajeDe(error: unknown, porDefecto: string): string {
  return error instanceof ApiError ? mensajeVisible(error) : porDefecto;
}

function descargarCSV(ventas: VentaResumenResponse[]) {
  const filas = [
    ["Venta", "Fecha y hora", "Total", "Estado", "Medio de pago", "Turno"],
    ...ventas.map((v) => [
      String(v.id),
      v.fechaHora.slice(0, 16).replace("T", " "),
      String(v.total),
      v.estado,
      etiquetaMetodoPago(v.metodoPago),
      v.reservaId === null ? "" : String(v.reservaId),
    ]),
  ];
  const csv = filas.map((fila) => fila.map((valor) => `"${valor.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ventas-buffet.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Cobros del período: de dónde vino la plata.
 *
 * Era "Pagos y liquidaciones" y auditaba la comisión de la plataforma. Nada de
 * eso existe en el backend: no hay PagoController, ni comisión, ni estado de
 * liquidación, ni Split (B3 del PLAN_CONEXION). Se fueron la tabla de pagos por
 * reserva, el drawer de "registrar cobro" (esa corrección hoy se hace donde
 * corresponde: cobrando el turno en la agenda) y el mock entero de pagos.
 *
 * Lo que queda es real y son tres endpoints:
 *   - `/reportes/facturacion` → cuánto entró por turnos (reservas FINALIZADA).
 *   - `/buffet/ventas/metricas` → cuánto entró por buffet y qué se vendió.
 *   - `/buffet/ventas` → la tabla venta por venta, que no está en ninguna otra
 *     pantalla del panel.
 *
 * El detalle turno por turno no va acá: vive en la agenda, que es donde se
 * cobra. Duplicarlo sería mantener dos veces la misma tabla.
 */
export default function PanelPagos() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();

  const [desde, setDesde] = useState(() => inicioMes(hoyISO()));
  const [hasta, setHasta] = useState(() => finMes(hoyISO()));
  const [filtroEstado, setFiltroEstado] = useState<EstadoVenta | "todas">("todas");
  const [pagina, setPagina] = useState(0);
  const [aCancelar, setACancelar] = useState<VentaResumenResponse | null>(null);

  // Solo dueño — el sidebar ya le oculta el ítem al empleado, pero acá además
  // se redirige si entra por URL directa. "!bloqueadoPorCaja &&" evita pisar el
  // router.replace("/caja") de useBloqueadoPorCaja. El backend igual responde
  // 403: tanto /reportes/* como el listado de ventas son OWNER/ADMIN.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  const habilitado = establecimientoId !== null;
  const estado = filtroEstado === "todas" ? undefined : filtroEstado;

  const [facturacion, ventas, metricas] = useQueries({
    queries: [
      {
        queryKey: keys.reportes(establecimientoId ?? 0, "facturacion", desde, hasta),
        queryFn: () => reportes.facturacion(establecimientoId!, { desde, hasta }),
        enabled: habilitado,
      },
      {
        queryKey: keys.buffet.ventas(establecimientoId ?? 0, desde, hasta, estado, pagina),
        queryFn: () => ventasBuffet.listar(establecimientoId!, desde, hasta, { estado, page: pagina, size: POR_PAGINA }),
        enabled: habilitado,
      },
      {
        queryKey: keys.buffet.metricas(establecimientoId ?? 0, desde, hasta),
        queryFn: () => ventasBuffet.metricas(establecimientoId!, desde, hasta),
        enabled: habilitado,
      },
    ],
  });

  const consultas = [facturacion, ventas, metricas];
  const estadoCarga: EstadoCarga = consultas.some((c) => c.isPending)
    ? "cargando"
    : consultas.every((c) => c.isError)
      ? "error"
      : "listo";

  const exportar = useMutation({
    mutationFn: async () => {
      const todas: VentaResumenResponse[] = [];
      for (let page = 0; page < PAGINAS_MAXIMAS_EXPORT; page++) {
        const respuesta = await ventasBuffet.listar(establecimientoId!, desde, hasta, { estado, page, size: 100 });
        todas.push(...respuesta.content);
        if (respuesta.last) break;
      }
      return todas;
    },
    onSuccess: descargarCSV,
  });

  const cancelar = useMutation({
    mutationFn: (id: number) => ventasBuffet.cancelar(id),
    onSuccess: () => {
      setACancelar(null);
      // La cancelación devuelve el stock, así que el catálogo también cambió.
      queryClient.invalidateQueries({ queryKey: ["buffet"] });
    },
  });

  function cambiarPeriodo(nuevoDesde: string, nuevoHasta: string) {
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
    setPagina(0);
  }

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  const datosVentas = ventas.data;
  const rankingProductos = metricas.data?.productosMasVendidos ?? [];
  // "No hubo nada en el período", que no es lo mismo que "el filtro no
  // encontró nada": con el filtro puesto la tabla avisa por su cuenta. Y va
  // contra `totalElements`, no contra el largo de la página: en la página 3 de
  // un listado que se achicó, `content` puede venir vacío igual.
  const sinNada =
    filtroEstado === "todas" &&
    facturacion.data?.totalFacturado.actual === 0 &&
    metricas.data?.cantidadVentas === 0 &&
    datosVentas?.totalElements === 0;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Cobros</h1>
            <button
              type="button"
              onClick={() => exportar.mutate()}
              disabled={exportar.isPending || !habilitado}
              className="flex h-10 items-center gap-1.5 rounded-full border border-borde bg-white px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
            >
              <Download className="size-4" aria-hidden />
              {exportar.isPending ? "Preparando…" : "Exportar ventas"}
            </button>
          </div>
          <p className="mb-6 text-sm text-grafito">Turnos finalizados y ventas del buffet en el período.</p>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-humo p-1">
              <button
                type="button"
                onClick={() => cambiarPeriodo(inicioSemana(hoyISO()), finSemana(hoyISO()))}
                className="h-9 rounded-full px-4 text-sm font-semibold text-grafito transition-colors hover:text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => cambiarPeriodo(inicioMes(hoyISO()), finMes(hoyISO()))}
                className="h-9 rounded-full px-4 text-sm font-semibold text-grafito transition-colors hover:text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Este mes
              </button>
            </div>
            <input
              type="date"
              value={desde}
              onChange={(e) => cambiarPeriodo(e.target.value, hasta)}
              aria-label="Desde"
              className="h-10 rounded-full bg-humo px-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
            <span className="text-sm text-grafito">a</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => cambiarPeriodo(desde, e.target.value)}
              aria-label="Hasta"
              className="h-10 rounded-full bg-humo px-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
          </div>

          {estadoCarga === "cargando" && <SkeletonPagos />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los cobros.</p>
              <p className="max-w-sm text-sm text-grafito">{mensajeDe(ventas.error, "Revisá la conexión y volvé a intentar.")}</p>
              <button
                type="button"
                onClick={() => consultas.forEach((c) => c.refetch())}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && (
            <div className="space-y-6">
              <ResumenCobros
                turnos={facturacion.isError ? null : (facturacion.data?.totalFacturado.actual ?? null)}
                buffet={metricas.isError ? null : (metricas.data?.ingresoTotal ?? null)}
              />

              {sinNada ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
                  <Receipt className="size-8 text-grafito" aria-hidden />
                  <p className="font-display font-bold text-tinta">Todavía no hay cobros en este período</p>
                  <p className="max-w-xs text-sm text-grafito">Probá con otro rango de fechas.</p>
                </div>
              ) : (
                <>
                  {rankingProductos.length > 0 && (
                    <div className="rounded-card bg-white p-6 shadow-card">
                      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-display text-lg font-bold text-tinta">Lo más vendido</p>
                        {metricas.data && metricas.data.cantidadVentas > 0 && (
                          <p className="text-sm text-grafito">
                            {metricas.data.cantidadVentas} {metricas.data.cantidadVentas === 1 ? "venta" : "ventas"} · ticket promedio{" "}
                            {formatearPrecio(metricas.data.ticketPromedio)}
                          </p>
                        )}
                      </div>
                      <ProductosMasVendidos productos={rankingProductos} />
                    </div>
                  )}

                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-display text-lg font-bold text-tinta">Ventas del buffet</p>
                      <div className="flex rounded-full bg-white p-1 shadow-card">
                        {FILTROS_ESTADO.map((f) => (
                          <button
                            key={f.valor}
                            type="button"
                            onClick={() => {
                              setFiltroEstado(f.valor);
                              setPagina(0);
                            }}
                            aria-pressed={filtroEstado === f.valor}
                            className={`h-8 rounded-full px-3.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                              filtroEstado === f.valor ? "bg-celeste-suave text-tinta" : "text-grafito hover:text-tinta"
                            }`}
                          >
                            {f.etiqueta}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ventas.isError && (
                      <div className="rounded-card bg-white p-6 text-center shadow-card">
                        <p className="text-sm text-grafito">No pudimos cargar las ventas del buffet.</p>
                      </div>
                    )}

                    {datosVentas && datosVentas.content.length === 0 && (
                      <div className="rounded-card bg-white p-10 text-center shadow-card">
                        <p className="text-sm text-grafito">No hay ventas con este filtro en el período.</p>
                      </div>
                    )}

                    {datosVentas && datosVentas.content.length > 0 && (
                      <div className="space-y-4">
                        <TablaVentasBuffet ventas={datosVentas.content} onCancelar={setACancelar} />

                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                          <p className="text-sm text-grafito">
                            {datosVentas.totalElements} {datosVentas.totalElements === 1 ? "venta" : "ventas"}
                            {datosVentas.totalPages > 1 && ` · página ${datosVentas.number + 1} de ${datosVentas.totalPages}`}
                          </p>
                          {datosVentas.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                                disabled={datosVentas.first}
                                className="flex h-9 items-center gap-1 rounded-full border border-borde bg-white px-3 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-40"
                              >
                                <ChevronLeft className="size-4" aria-hidden />
                                Anterior
                              </button>
                              <button
                                type="button"
                                onClick={() => setPagina((p) => p + 1)}
                                disabled={datosVentas.last}
                                className="flex h-9 items-center gap-1 rounded-full border border-borde bg-white px-3 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-40"
                              >
                                Siguiente
                                <ChevronRight className="size-4" aria-hidden />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {exportar.isError && (
                <p className="text-sm text-cancelado">No pudimos exportar: {mensajeDe(exportar.error, "probá de nuevo en un momento.")}</p>
              )}
            </div>
          )}
        </main>
      </div>

      {aCancelar && (
        <ModalPanel
          titulo={`Cancelar la venta #${aCancelar.id}`}
          subtitulo={formatearPrecio(aCancelar.total)}
          onClose={() => {
            cancelar.reset();
            setACancelar(null);
          }}
        >
          <p className="text-sm text-grafito">
            La venta queda marcada como cancelada y el stock de los productos vuelve al buffet. No se puede deshacer.
          </p>

          {cancelar.isError && (
            <p className="mt-4 text-sm text-cancelado">{mensajeDe(cancelar.error, "No pudimos cancelar la venta.")}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                cancelar.reset();
                setACancelar(null);
              }}
              className="h-11 flex-1 rounded-full border border-borde bg-white font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => cancelar.mutate(aCancelar.id)}
              disabled={cancelar.isPending}
              className="h-11 flex-1 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
            >
              {cancelar.isPending ? "Cancelando…" : "Cancelar venta"}
            </button>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
