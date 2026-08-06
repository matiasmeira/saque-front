"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Plus, Receipt, Trash2 } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaGastos } from "@/components/panel/tabla-gastos";
import { FormFichaGasto, type DatosGasto } from "@/components/panel/form-ficha-gasto";
import { DesgloseGastosCategoria } from "@/components/panel/desglose-gastos-categoria";
import { SkeletonGastos } from "@/components/panel/skeleton-gastos";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { finMes, finSemana, hoyISO, inicioMes, inicioSemana } from "@/lib/fecha";
import { formatearPrecio } from "@/lib/formato";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { CATEGORIAS_GASTO, gastosDelPeriodo, gastosPorCategoria, PANEL_GASTOS, totalGastos, type CategoriaGasto, type Gasto } from "@/mocks/gastos";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "ficha"; gasto: Gasto | null } | { tipo: "eliminar"; gasto: Gasto } | null;

// Solo dueño — mismo criterio que Reportes/Pagos/Precios: información financiera, ningún permiso de empleado la habilita.
export default function PanelGastos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [desde, setDesde] = useState(() => inicioMes(hoyISO()));
  const [hasta, setHasta] = useState(() => finMes(hoyISO()));
  const [categoria, setCategoria] = useState<CategoriaGasto | "TODAS">("TODAS");
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);
  const [proximoId, setProximoId] = useState(1000);

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
      setGastos(mockVacio ? [] : gastosDelPeriodo(PANEL_GASTOS, desde, hasta).map((g) => ({ ...g })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, desde, hasta, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function crearGasto(datos: DatosGasto) {
    setGastos((prev) => [{ id: proximoId, ...datos }, ...prev].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
    setProximoId((id) => id + 1);
    setPanelAbierto(null);
  }

  function editarGasto(id: number, datos: DatosGasto) {
    setGastos((prev) => prev.map((g) => (g.id === id ? { ...g, ...datos } : g)).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
    setPanelAbierto(null);
  }

  function eliminarGasto(id: number) {
    setGastos((prev) => prev.filter((g) => g.id !== id));
    setPanelAbierto(null);
  }

  const gastosFiltrados = categoria === "TODAS" ? gastos : gastos.filter((g) => g.categoria === categoria);
  const total = totalGastos(gastosFiltrados);
  const desglose = gastosPorCategoria(gastosFiltrados);

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Gastos</h1>
            <button
              type="button"
              onClick={() => setPanelAbierto({ tipo: "ficha", gasto: null })}
              className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Plus className="size-4" aria-hidden />
              Agregar gasto
            </button>
          </div>

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
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto | "TODAS")}
              aria-label="Categoría"
              className="h-10 rounded-full bg-humo px-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <option value="TODAS">Todas las categorías</option>
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {estadoCarga === "cargando" && <SkeletonGastos />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los gastos.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && gastosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Receipt className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay gastos en este período</p>
              <p className="max-w-xs text-sm text-grafito">Cargá los gastos del complejo para llevar el control del resultado.</p>
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "ficha", gasto: null })}
                className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Agregar gasto
              </button>
            </div>
          )}

          {estadoCarga === "listo" && gastosFiltrados.length > 0 && (
            <div className="space-y-6">
              <div className="rounded-card bg-white p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Total del período</p>
                <p className="mt-1.5 font-display text-3xl font-extrabold tabular-nums text-tinta">{formatearPrecio(total)}</p>
              </div>

              <div className="rounded-card bg-white p-6 shadow-card">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Por categoría</p>
                <DesgloseGastosCategoria datos={desglose} />
              </div>

              <TablaGastos
                gastos={gastosFiltrados}
                onEditar={(gasto) => setPanelAbierto({ tipo: "ficha", gasto })}
                onEliminar={(gasto) => setPanelAbierto({ tipo: "eliminar", gasto })}
              />
            </div>
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "ficha" && (
        <DrawerPanel titulo={panelAbierto.gasto ? "Editar gasto" : "Nuevo gasto"} subtitulo={panelAbierto.gasto?.descripcion} onClose={() => setPanelAbierto(null)}>
          <FormFichaGasto
            gasto={panelAbierto.gasto}
            onGuardar={(datos) => (panelAbierto.gasto ? editarGasto(panelAbierto.gasto.id, datos) : crearGasto(datos))}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "eliminar" && (
        <ModalPanel titulo="Eliminar gasto" subtitulo={panelAbierto.gasto.descripcion} onClose={() => setPanelAbierto(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Se va a eliminar el gasto de <span className="font-semibold">{formatearPrecio(panelAbierto.gasto.monto)}</span> del{" "}
              <span className="font-semibold">{panelAbierto.gasto.fecha}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPanelAbierto(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarGasto(panelAbierto.gasto.id)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Trash2 className="size-4" aria-hidden />
                Eliminar gasto
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
