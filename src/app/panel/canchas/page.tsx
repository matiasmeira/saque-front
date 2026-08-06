"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, LayoutGrid, Plus } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaCanchas } from "@/components/panel/tabla-canchas";
import { FormCancha } from "@/components/panel/form-cancha";
import { SkeletonCanchas } from "@/components/panel/skeleton-canchas";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_CANCHAS, type Bloqueo, type Cancha } from "@/mocks/canchas";

// El drawer de edición guarda solo el id, no una copia de la cancha:
// así, cuando se agrega o quita un bloqueo de mantenimiento (que se
// aplica al toque, sin pasar por "Guardar"), el drawer siempre
// muestra el estado más reciente en vez de una foto vieja.
type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; canchaId: number } | null;
type EstadoCarga = "cargando" | "error" | "listo";

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo patrón que
// /panel/agenda. TODO backend: las canchas vienen de la API — la
// entidad Cancha ya existe en el backend Spring Boot con su Tarifa
// asociada.
export default function PanelCanchas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);
  const [proximoId, setProximoId] = useState(1000);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  // Esta pantalla es solo del dueño — el sidebar ya le oculta el
  // ítem al empleado, pero acá además se redirige si entra por URL
  // directa. "!bloqueadoPorCaja &&" evita una carrera: activar ESTA
  // computadora como caja desde acá mismo (C9) hace que "rol" pase a
  // "empleado" en el mismo render, y sin ese chequeo este efecto
  // redirigía a /panel/agenda pisando el router.replace("/caja") de
  // useBloqueadoPorCaja — que es el destino correcto en ese caso.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setCanchas(mockVacio ? [] : PANEL_CANCHAS.map((c) => ({ ...c })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function crearCancha(datos: Omit<Cancha, "id" | "mantenimientos">) {
    setCanchas((prev) => [...prev, { ...datos, id: proximoId, mantenimientos: [] }]);
    setProximoId((id) => id + 1);
    setPanelAbierto(null);
  }

  function editarCancha(id: number, datos: Omit<Cancha, "id" | "mantenimientos">) {
    setCanchas((prev) => prev.map((c) => (c.id === id ? { ...c, ...datos } : c)));
    setPanelAbierto(null);
  }

  function alternarActiva(cancha: Cancha) {
    setCanchas((prev) => prev.map((c) => (c.id === cancha.id ? { ...c, isActive: !c.isActive } : c)));
  }

  function agregarBloqueo(canchaId: number, bloqueo: Bloqueo) {
    setCanchas((prev) => prev.map((c) => (c.id === canchaId ? { ...c, mantenimientos: [...c.mantenimientos, bloqueo] } : c)));
  }

  function quitarBloqueo(canchaId: number, indice: number) {
    setCanchas((prev) =>
      prev.map((c) => (c.id === canchaId ? { ...c, mantenimientos: c.mantenimientos.filter((_, i) => i !== indice) } : c)),
    );
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Canchas</h1>
            <button
              type="button"
              onClick={() => setPanelAbierto({ tipo: "nueva" })}
              className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Plus className="size-4" aria-hidden />
              Nueva cancha
            </button>
          </div>

          {estadoCarga === "cargando" && <SkeletonCanchas />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar las canchas.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && canchas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <LayoutGrid className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no cargaste ninguna cancha</p>
              <p className="max-w-xs text-sm text-grafito">Cargá tu primera cancha para poder empezar a recibir turnos.</p>
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "nueva" })}
                className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Nueva cancha
              </button>
            </div>
          )}

          {estadoCarga === "listo" && canchas.length > 0 && (
            <TablaCanchas
              canchas={canchas}
              onEditar={(cancha) => setPanelAbierto({ tipo: "editar", canchaId: cancha.id })}
              onAlternarActiva={alternarActiva}
            />
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva cancha" onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={null}
            canchasExistentes={canchas}
            onGuardar={crearCancha}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={() => {}}
            onQuitarBloqueo={() => {}}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "editar" &&
        (() => {
          const canchaEnEdicion = canchas.find((c) => c.id === panelAbierto.canchaId);
          if (!canchaEnEdicion) return null;
          return (
            <DrawerPanel titulo="Editar cancha" subtitulo={canchaEnEdicion.nombre} onClose={() => setPanelAbierto(null)}>
              <FormCancha
                cancha={canchaEnEdicion}
                canchasExistentes={canchas}
                onGuardar={(datos) => editarCancha(canchaEnEdicion.id, datos)}
                onCancelar={() => setPanelAbierto(null)}
                onAgregarBloqueo={(bloqueo) => agregarBloqueo(canchaEnEdicion.id, bloqueo)}
                onQuitarBloqueo={(indice) => quitarBloqueo(canchaEnEdicion.id, indice)}
              />
            </DrawerPanel>
          );
        })()}
    </div>
  );
}
