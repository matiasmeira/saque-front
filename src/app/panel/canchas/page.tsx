"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, LayoutGrid, Plus, Trash2 } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaCanchas } from "@/components/panel/tabla-canchas";
import { FormCancha } from "@/components/panel/form-cancha";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { SkeletonCanchas } from "@/components/panel/skeleton-canchas";
import { bloqueos as endpointBloqueos, canchas as endpointCanchas } from "@/lib/api/endpoints/canchas";
import { keys } from "@/lib/api/keys";
import { invalidarDisponibilidad } from "@/lib/api/invalidaciones";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import {
  aBloqueoPanel,
  aCanchaPanel,
  aCanchaRequest,
  aFechaHoraBloqueo,
  type DatosCancha,
} from "@/lib/api/adaptadores/canchas";
import { useEstablecimientoActivo, usePerfil } from "@/hooks/api/use-perfil";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import type { Bloqueo } from "@/lib/panel/canchas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; canchaId: number } | null;

/**
 * C3 · Canchas.
 *
 * Es la base del resto del panel: la agenda, los precios y la disponibilidad
 * cuelgan de lo que se define acá.
 *
 * `isActive` es reversible: actualizarCancha lo puede volver a poner en true,
 * y este listado pide incluirInactivas=true para poder mostrar y reactivar
 * las que están apagadas (la agenda y la ficha pública siguen viendo sólo
 * activas). El switch "Cancha activa" de form-cancha.tsx es el que maneja las
 * dos direcciones.
 */
export default function PanelCanchas() {
  const queryClient = useQueryClient();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const { establecimientoId } = useEstablecimientoActivo();
  // useRolPanel() junta OWNER y ADMIN en "dueno" (ver rol-panel.ts); el DELETE
  // de canchas es sólo OWNER (CanchaController), así que para el botón de
  // eliminar hace falta el rol real, no el agrupado.
  const { data: perfil } = usePerfil();
  const esOwner = perfil?.rol === "OWNER";

  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const consulta = useQuery({
    queryKey: keys.canchas(establecimientoId ?? 0, true),
    queryFn: () => endpointCanchas.listar(establecimientoId!, true),
    enabled: establecimientoId !== null,
  });

  const canchaEditandoId = panelAbierto?.tipo === "editar" ? panelAbierto.canchaId : null;

  // Los bloqueos viven en endpoints propios, no en CanchaResponse: se piden
  // sólo para la cancha que se está editando.
  const consultaBloqueos = useQuery({
    queryKey: keys.bloqueos.deCancha(establecimientoId ?? 0, canchaEditandoId ?? 0),
    queryFn: () => endpointBloqueos.deCancha(establecimientoId!, canchaEditandoId!),
    enabled: establecimientoId !== null && canchaEditandoId !== null,
  });

  function alFallar(e: unknown, porDefecto: string) {
    setError(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  function invalidar() {
    // Por prefijo: hay dos variantes de esta key (incluirInactivas true/false,
    // ver panel/precios) y una mutación acá tiene que refrescar las dos.
    queryClient.invalidateQueries({ queryKey: ["canchas", establecimientoId ?? 0] });
    // Duraciones permitidas, permiteInicioMediaHora y el pool de canchas
    // redefinen la grilla de slots.
    invalidarDisponibilidad(queryClient);
  }

  const guardar = useMutation({
    mutationFn: ({ id, datos }: { id: number | null; datos: DatosCancha }) =>
      id === null
        ? endpointCanchas.crear(establecimientoId!, aCanchaRequest(datos))
        : endpointCanchas.actualizar(establecimientoId!, id, aCanchaRequest(datos)),
    onSuccess: () => {
      invalidar();
      setPanelAbierto(null);
      setError(null);
    },
    onError: (e) => alFallar(e, "No pudimos guardar la cancha."),
  });

  const crearBloqueo = useMutation({
    mutationFn: ({ canchaId, bloqueo }: { canchaId: number; bloqueo: Bloqueo }) =>
      endpointBloqueos.crear(establecimientoId!, canchaId, {
        fechaInicio: aFechaHoraBloqueo(bloqueo.desde),
        fechaFin: aFechaHoraBloqueo(bloqueo.hasta),
        motivo: bloqueo.motivo?.trim() || "Mantenimiento",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueos"] });
      invalidarDisponibilidad(queryClient);
      setError(null);
    },
    onError: (e) => alFallar(e, "No pudimos crear el bloqueo."),
  });

  const quitarBloqueo = useMutation({
    mutationFn: ({ canchaId, bloqueoId }: { canchaId: number; bloqueoId: number }) =>
      endpointBloqueos.eliminar(establecimientoId!, canchaId, bloqueoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueos"] });
      invalidarDisponibilidad(queryClient);
      setError(null);
    },
    onError: (e) => alFallar(e, "No pudimos quitar el bloqueo."),
  });

  const eliminarCancha = useMutation({
    mutationFn: (canchaId: number) => endpointCanchas.eliminar(establecimientoId!, canchaId),
    onSuccess: () => {
      invalidar();
      setConfirmandoEliminar(false);
      setPanelAbierto(null);
      setError(null);
    },
    onError: (e) => alFallar(e, "No pudimos eliminar la cancha."),
  });

  function cerrarConfirmacionEliminar() {
    setConfirmandoEliminar(false);
    setError(null);
  }

  if (bloqueadoPorCaja || rol !== "dueno") return <div className="min-h-dvh bg-humo" />;

  const canchas = (consulta.data ?? []).map(aCanchaPanel);
  const bloqueosDeLaCancha = (consultaBloqueos.data ?? []).map(aBloqueoPanel);
  const canchaEnEdicion = canchaEditandoId
    ? canchas.find((c) => c.id === canchaEditandoId)
    : undefined;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">
              Canchas
            </h1>
            <button
              type="button"
              onClick={() => setPanelAbierto({ tipo: "nueva" })}
              className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Plus className="size-4" aria-hidden />
              Nueva cancha
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {error}
            </p>
          )}

          {consulta.isPending && <SkeletonCanchas />}

          {consulta.isError && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">
                {consulta.error instanceof ApiError
                  ? mensajeVisible(consulta.error)
                  : "No pudimos cargar las canchas."}
              </p>
              <button
                type="button"
                onClick={() => consulta.refetch()}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {consulta.isSuccess && canchas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <LayoutGrid className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">
                Todavía no cargaste ninguna cancha
              </p>
              <p className="max-w-xs text-sm text-grafito">
                Cargá tu primera cancha para poder empezar a recibir turnos.
              </p>
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

          {consulta.isSuccess && canchas.length > 0 && (
            <TablaCanchas
              canchas={canchas}
              onEditar={(cancha) => setPanelAbierto({ tipo: "editar", canchaId: cancha.id })}
            />
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva cancha" onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={null}
            canchasExistentes={canchas}
            errorApi={error}
            onGuardar={(datos) => guardar.mutate({ id: null, datos })}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={() => {}}
            onQuitarBloqueo={() => {}}
          />
        </DrawerPanel>
      )}

      {canchaEnEdicion && (
        <DrawerPanel
          titulo="Editar cancha"
          subtitulo={canchaEnEdicion.nombre}
          onClose={() => setPanelAbierto(null)}
        >
          <FormCancha
            cancha={{ ...canchaEnEdicion, mantenimientos: bloqueosDeLaCancha }}
            canchasExistentes={canchas}
            errorApi={error}
            onGuardar={(datos) => guardar.mutate({ id: canchaEnEdicion.id, datos })}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={(bloqueo) =>
              crearBloqueo.mutate({ canchaId: canchaEnEdicion.id, bloqueo })
            }
            onQuitarBloqueo={(indice) => {
              // El formulario trabaja por índice; el backend necesita el id.
              const bloqueo = consultaBloqueos.data?.[indice];
              if (bloqueo) {
                quitarBloqueo.mutate({ canchaId: canchaEnEdicion.id, bloqueoId: bloqueo.id });
              }
            }}
            onEliminar={esOwner ? () => setConfirmandoEliminar(true) : undefined}
          />
        </DrawerPanel>
      )}

      {confirmandoEliminar && canchaEnEdicion && (
        <ModalPanel titulo="Eliminar cancha" subtitulo="Esta acción no se puede deshacer" onClose={cerrarConfirmacionEliminar}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Vas a eliminar <span className="font-semibold">{canchaEnEdicion.nombre}</span> para siempre. Desaparece
              de tus listados y de la ficha pública.
            </p>
            <p className="text-sm text-tinta">
              Se conservan las reservas pasadas: siguen en el historial, la caja y los reportes.
            </p>
            <p className="text-sm text-grafito">
              Si sólo querés dejar de usarla, no hace falta eliminarla: desactivada ya no recibe reservas y podés
              reactivarla cuando quieras.
            </p>
            {error && (
              <p role="alert" className="text-sm text-cancelado">
                {error}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarConfirmacionEliminar}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarCancha.mutate(canchaEnEdicion.id)}
                disabled={eliminarCancha.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                <Trash2 className="size-4" aria-hidden />
                {eliminarCancha.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
