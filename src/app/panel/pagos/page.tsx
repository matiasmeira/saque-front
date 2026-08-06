"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Download, Receipt } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ResumenPagos } from "@/components/panel/resumen-pagos";
import { TablaPagos } from "@/components/panel/tabla-pagos";
import { TablaVentasBuffet } from "@/components/panel/tabla-ventas-buffet";
import { FormRegistrarCobro } from "@/components/panel/form-registrar-cobro";
import { SkeletonPagos } from "@/components/panel/skeleton-pagos";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { finMes, finSemana, hoyISO, inicioMes, inicioSemana } from "@/lib/fecha";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_PAGOS, pagosDelPeriodo, type MetodoPago, type Pago } from "@/mocks/pagos";
import { PANEL_VENTAS, ventasDelPeriodo, type Venta } from "@/mocks/buffet";

type EstadoCarga = "cargando" | "error" | "listo";

function descargarCSV(pagos: Pago[]) {
  const filas = [
    ["Fecha", "Cliente", "Cancha", "Total turno", "Medio de pago", "Generó comisión", "Comisión", "Estado liquidación", "Fecha acreditación"],
    ...pagos.map((p) => [
      p.fecha,
      p.clienteNombre,
      p.canchaNombre,
      String(p.totalTurno),
      p.metodoPago,
      p.generoComision ? "Sí" : "No",
      String(p.comision),
      p.estadoLiquidacion,
      p.fechaAcreditacion ?? "",
    ]),
  ];
  const csv = filas.map((fila) => fila.map((valor) => `"${valor.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pagos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo patrón que
// el resto del panel. TODO backend: la liquidación real viene de la
// API de MercadoPago (Split de Pagos) — el estado por reserva va
// simulado en el mock.
export default function PanelPagos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [desde, setDesde] = useState(() => inicioMes(hoyISO()));
  const [hasta, setHasta] = useState(() => finMes(hoyISO()));
  const [panelAbierto, setPanelAbierto] = useState<Pago | null>(null);
  const [reintento, setReintento] = useState(0);

  // Esta pantalla es solo del dueño — el sidebar ya le oculta el
  // ítem al empleado, pero acá además se redirige si entra por URL
  // directa. Es la más sensible del panel: no alcanza con no mostrar
  // el link. "!bloqueadoPorCaja &&" evita pisar el router.replace("/caja")
  // de useBloqueadoPorCaja con este cuando ambos se disparan a la vez.
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
      setPagos(mockVacio ? [] : pagosDelPeriodo(PANEL_PAGOS, desde, hasta).map((p) => ({ ...p })));
      setVentas(mockVacio ? [] : ventasDelPeriodo(PANEL_VENTAS, desde, hasta).map((v) => ({ ...v })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, desde, hasta, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function registrarCobro(reservaId: string, metodoPago: MetodoPago, generoComision: boolean) {
    setPagos((prev) =>
      prev.map((p) =>
        p.reservaId === reservaId
          ? {
              ...p,
              metodoPago,
              generoComision,
              comision: generoComision ? 450 : 0,
              // Se acaba de corregir a mano: no hay nada acreditado
              // todavía que mostrar, arranca de nuevo.
              estadoLiquidacion: generoComision ? "pendiente" : "acreditado",
              fechaAcreditacion: undefined,
            }
          : p,
      ),
    );
    setPanelAbierto(null);
  }

  const facturacionTurnos = pagos.reduce((acc, p) => acc + p.totalTurno, 0);
  // El buffet nunca genera comisión (no pasa por el Split de Saque,
  // ver mocks/buffet.ts) — una venta cancelada no es facturación real.
  const facturacionBuffet = ventas.filter((v) => v.estado === "CONFIRMADA").reduce((acc, v) => acc + v.total, 0);
  const comisionTotal = pagos.reduce((acc, p) => acc + p.comision, 0);
  const neto = facturacionTurnos + facturacionBuffet - comisionTotal;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Pagos y liquidaciones</h1>
            <button
              type="button"
              onClick={() => descargarCSV(pagos)}
              className="flex h-10 items-center gap-1.5 rounded-full border border-borde bg-white px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Download className="size-4" aria-hidden />
              Exportar CSV
            </button>
          </div>
          <p className="mb-6 text-sm text-grafito">
            Plan {PANEL_COMPLEJO.plan === "comision" ? `comisión — ${formatearPrecio(450)} por reserva que pasa por el Split de Saque` : "suscripción — sin comisión por reserva"}
          </p>

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

          {estadoCarga === "cargando" && <SkeletonPagos />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los pagos.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && pagos.length === 0 && ventas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Receipt className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay pagos en este período</p>
              <p className="max-w-xs text-sm text-grafito">Probá con otro rango de fechas.</p>
            </div>
          )}

          {estadoCarga === "listo" && (pagos.length > 0 || ventas.length > 0) && (
            <div className="space-y-6">
              <ResumenPagos facturacionTurnos={facturacionTurnos} facturacionBuffet={facturacionBuffet} comision={comisionTotal} neto={neto} />
              {pagos.length > 0 && <TablaPagos pagos={pagos} onEditar={setPanelAbierto} />}
              {ventas.length > 0 && (
                <div>
                  <p className="mb-3 font-display text-lg font-bold text-tinta">Ventas del buffet</p>
                  <TablaVentasBuffet ventas={ventas} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {panelAbierto && (
        <DrawerPanel titulo="Registrar cobro" subtitulo={`${panelAbierto.clienteNombre} · ${fechaLarga(panelAbierto.fecha)}`} onClose={() => setPanelAbierto(null)}>
          <FormRegistrarCobro
            pago={panelAbierto}
            onGuardar={(metodoPago, generoComision) => registrarCobro(panelAbierto.reservaId, metodoPago, generoComision)}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}
    </div>
  );
}
