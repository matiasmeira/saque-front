"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { PrecioBaseCancha } from "@/components/panel/precio-base-cancha";
import { ListaTarifas } from "@/components/panel/lista-tarifas";
import { FormTarifa } from "@/components/panel/form-tarifa";
import { SkeletonPrecios } from "@/components/panel/skeleton-precios";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { type PrecioPorDuracion } from "@/lib/panel/canchas";
import { etiquetaDias, type DiaSemana, type Tarifa } from "@/lib/panel/tarifas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { canchas as endpointCanchas } from "@/lib/api/endpoints/canchas";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { aCanchaPanel, aCanchaRequest } from "@/lib/api/adaptadores/canchas";
import { aTarifasDto, aTarifasPanel } from "@/lib/api/tarifas";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; tarifaId: number } | null;
type EstadoCarga = "cargando" | "error" | "listo";
type DatosTarifa = { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] };

// Pádel D arranca seleccionada a propósito: tiene dos duraciones y
// ya una tarifa especial cargada, así la pantalla muestra el caso
// completo (precio base + tarifa) sin tener que cambiar de cancha.

// Las tarifas viajan DENTRO de CanchaRequest: no hay endpoint granular, así
// que editar una es un PUT completo de la cancha (leer, mutar el array,
// reenviar entera). Y una tarifa del front con 5 días son 5 TarifaDto — la
// expansión está en src/lib/api/tarifas.ts.
//
// Ya no hay calculadora de "qué precio le queda a este turno": el backend no
// expone un endpoint de cálculo y la versión que corría acá no reproducía
// PrecioReservaCalculator (le faltaba el proporcional precioPorHora × horas
// cuando no hay precio exacto para esa duración), así que mostraba $0 donde el
// backend iba a cobrar.
export default function PanelPrecios() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();

  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();

  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: keys.canchas(establecimientoId ?? 0),
    queryFn: () => endpointCanchas.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  const estadoCarga: EstadoCarga = consulta.isPending
    ? "cargando"
    : consulta.isError
      ? "error"
      : "listo";

  // "!bloqueadoPorCaja &&" evita una carrera con useBloqueadoPorCaja:
  // si esta PC se acaba de emparejar como caja (desde C9), "rol" pasa
  // a "empleado" en el mismo render, y sin este chequeo este efecto
  // pisaba el router.replace("/caja") correcto con uno a /panel/agenda.
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  const canchasApi = consulta.data ?? [];
  const canchas = canchasApi.map(aCanchaPanel);
  const cancha = canchas.find((c) => c.id === canchaId) ?? canchas[0];
  const canchaApi = canchasApi.find((c) => c.id === cancha?.id);

  // Las tarifas viven DENTRO de CanchaResponse, no en un endpoint propio.
  const tarifasDeCancha = canchaApi ? aTarifasPanel(canchaApi.tarifas, canchaApi.id) : [];

  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  /**
   * No hay endpoint de tarifas: viajan dentro de CanchaRequest. Cualquier
   * cambio —precio base o una tarifa— es un PUT COMPLETO de la cancha, así
   * que hay que reenviar todo lo demás sin tocarlo o se pierde.
   *
   * Esto es también lo que ejercita el fix de mapToTarifaDto en el backend:
   * hasta que exista la primera tarifa, esa rama del mapper nunca corría.
   */
  const guardar = useMutation({
    mutationFn: ({
      preciosBase,
      tarifas,
    }: {
      preciosBase?: PrecioPorDuracion[];
      tarifas: Tarifa[];
    }) =>
      endpointCanchas.actualizar(establecimientoId!, cancha.id, {
        ...aCanchaRequest({
          ...cancha,
          preciosBase: preciosBase ?? cancha.preciosBase,
        }),
        tarifas: aTarifasDto(tarifas),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.canchas(establecimientoId ?? 0) });
      setPanelAbierto(null);
      setErrorAccion(null);
    },
    onError: (e) => alFallar(e, "No pudimos guardar los precios."),
  });

  // El early return va DESPUES de todos los hooks: React exige que se llamen
  // en el mismo orden en cada render (react-hooks/rules-of-hooks).
  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function guardarPrecioBase(precios: PrecioPorDuracion[]) {
    guardar.mutate({ preciosBase: precios, tarifas: tarifasDeCancha });
  }

  function crearTarifa(datos: DatosTarifa) {
    guardar.mutate({
      tarifas: [...tarifasDeCancha, { ...datos, id: tarifasDeCancha.length, canchaId: cancha.id }],
    });
  }

  function editarTarifa(id: number, datos: DatosTarifa) {
    guardar.mutate({
      tarifas: tarifasDeCancha.map((t) => (t.id === id ? { ...t, ...datos } : t)),
    });
  }

  function quitarTarifa(tarifa: Tarifa) {
    guardar.mutate({ tarifas: tarifasDeCancha.filter((t) => t.id !== tarifa.id) });
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Precios</h1>
            <select
              value={canchaId ?? cancha?.id ?? ""}
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

          {errorAccion && (
            <p role="alert" className="mb-4 max-w-2xl rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonPrecios />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los precios.</p>
              <button
                type="button"
                onClick={() => consulta.refetch()}
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
