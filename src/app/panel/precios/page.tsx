"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { PrecioBaseCancha } from "@/components/panel/precio-base-cancha";
import { ListaTarifas } from "@/components/panel/lista-tarifas";
import { FormTarifa } from "@/components/panel/form-tarifa";
import { VistaPreviaPrecio } from "@/components/panel/vista-previa-precio";
import { SkeletonPrecios } from "@/components/panel/skeleton-precios";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_CANCHAS, type PrecioPorDuracion } from "@/mocks/canchas";
import { etiquetaDias, PANEL_TARIFAS, type DiaSemana, type Tarifa } from "@/mocks/tarifas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; tarifaId: number } | null;
type EstadoCarga = "cargando" | "error" | "listo";

// Pádel D arranca seleccionada a propósito: tiene dos duraciones y
// ya una tarifa especial cargada, así la pantalla muestra el caso
// completo (precio base + tarifa) sin tener que cambiar de cancha.
const CANCHA_INICIAL = 5;

// ?mockError=1 fuerza el error; ?mockVacio=1 fuerza el caso "cancha
// sin tarifas especiales, solo base" vaciando todas las tarifas —
// mismo patrón que /panel/agenda y /panel/canchas.
// TODO backend: precios y tarifas vienen de la API — la entidad
// Tarifa ya existe en el backend Spring Boot, asociada a Cancha.
export default function PanelPrecios() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [canchas, setCanchas] = useState(PANEL_CANCHAS);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [canchaId, setCanchaId] = useState(CANCHA_INICIAL);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);
  const [proximoId, setProximoId] = useState(1000);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  // "!bloqueadoPorCaja &&" evita una carrera con useBloqueadoPorCaja:
  // si esta PC se acaba de emparejar como caja (desde C9), "rol" pasa
  // a "empleado" en el mismo render, y sin este chequeo este efecto
  // pisaba el router.replace("/caja") correcto con uno a /panel/agenda.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setCanchas(PANEL_CANCHAS.map((c) => ({ ...c })));
      setTarifas(mockVacio ? [] : PANEL_TARIFAS.map((t) => ({ ...t })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  const cancha = canchas.find((c) => c.id === canchaId) ?? canchas[0];
  const tarifasDeCancha = tarifas.filter((t) => t.canchaId === cancha.id);

  function guardarPrecioBase(precios: PrecioPorDuracion[]) {
    setCanchas((prev) => prev.map((c) => (c.id === cancha.id ? { ...c, preciosBase: precios } : c)));
  }

  function crearTarifa(datos: { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] }) {
    setTarifas((prev) => [...prev, { ...datos, id: proximoId, canchaId: cancha.id }]);
    setProximoId((id) => id + 1);
    setPanelAbierto(null);
  }

  function editarTarifa(id: number, datos: { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] }) {
    setTarifas((prev) => prev.map((t) => (t.id === id ? { ...t, ...datos } : t)));
    setPanelAbierto(null);
  }

  function quitarTarifa(tarifa: Tarifa) {
    setTarifas((prev) => prev.filter((t) => t.id !== tarifa.id));
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Precios</h1>
            <select
              value={canchaId}
              onChange={(e) => setCanchaId(Number(e.target.value))}
              aria-label="Cancha a tarifar"
              className="h-10 rounded-full bg-humo px-3.5 text-sm font-semibold text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {estadoCarga === "cargando" && <SkeletonPrecios />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los precios.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && (
            <div className="max-w-2xl space-y-6">
              <PrecioBaseCancha key={`precio-base-${cancha.id}`} cancha={cancha} onGuardar={guardarPrecioBase} />

              <ListaTarifas
                tarifas={tarifasDeCancha}
                onAgregar={() => setPanelAbierto({ tipo: "nueva" })}
                onEditar={(tarifa) => setPanelAbierto({ tipo: "editar", tarifaId: tarifa.id })}
                onQuitar={quitarTarifa}
              />

              <VistaPreviaPrecio key={`vista-previa-${cancha.id}`} cancha={cancha} tarifas={tarifasDeCancha} />
            </div>
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva tarifa" subtitulo={cancha.nombre} onClose={() => setPanelAbierto(null)}>
          <FormTarifa
            tarifa={null}
            cancha={cancha}
            otrasTarifasDeLaCancha={tarifasDeCancha}
            onGuardar={crearTarifa}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "editar" &&
        (() => {
          const tarifaEnEdicion = tarifasDeCancha.find((t) => t.id === panelAbierto.tarifaId);
          if (!tarifaEnEdicion) return null;
          return (
            <DrawerPanel
              titulo="Editar tarifa"
              subtitulo={`${cancha.nombre} · ${etiquetaDias(tarifaEnEdicion.dias)}`}
              onClose={() => setPanelAbierto(null)}
            >
              <FormTarifa
                tarifa={tarifaEnEdicion}
                cancha={cancha}
                otrasTarifasDeLaCancha={tarifasDeCancha.filter((t) => t.id !== tarifaEnEdicion.id)}
                onGuardar={(datos) => editarTarifa(tarifaEnEdicion.id, datos)}
                onCancelar={() => setPanelAbierto(null)}
              />
            </DrawerPanel>
          );
        })()}
    </div>
  );
}
