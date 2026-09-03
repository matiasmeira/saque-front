"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/canche/empty-state";
import { ModalPanel } from "@/components/panel/modal-panel";
import { FormDiaNoLaborable } from "@/components/panel/form-dia-no-laborable";
import { useDiasNoLaborables } from "@/hooks/api/use-dias-no-laborables";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { fechaCompleta } from "@/lib/formato";
import type { DiaNoLaborableRequest, DiaNoLaborableResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Días no laborables (feriados, cierres puntuales) del establecimiento.
 * Autocontenida: trae sus propios datos y es dueña de su query key, igual
 * que FormFotos — no hay "Guardar" que mande el establecimiento entero.
 */
export function SeccionDiasNoLaborables({ establecimientoId }: { establecimientoId: number }) {
  const { dias, cargando, error, refetch, crear, eliminar } = useDiasNoLaborables(establecimientoId);
  const [aEliminar, setAEliminar] = useState<DiaNoLaborableResponse | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  function agregar(datos: DiaNoLaborableRequest) {
    crear.mutate(datos, {
      onSuccess: () => setErrorAccion(null),
      onError: (e) => alFallar(e, "No pudimos agregar el día no laborable."),
    });
  }

  function confirmarEliminar() {
    if (!aEliminar) return;
    eliminar.mutate(aEliminar.id, {
      onSuccess: () => {
        setAEliminar(null);
        setErrorAccion(null);
      },
      onError: (e) => alFallar(e, "No pudimos eliminar el día no laborable."),
    });
  }

  const ordenados = [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="space-y-4">
      <FormDiaNoLaborable guardando={crear.isPending} onAgregar={agregar} />

      {errorAccion && (
        <p role="alert" className="text-sm text-cancelado">
          {errorAccion}
        </p>
      )}

      {cargando && <div className="h-24 animate-pulse rounded-card bg-humo" />}

      {!cargando && error && (
        <div className="rounded-input bg-cancelado-suave p-5 text-center">
          <p className="text-sm font-semibold text-tinta">No pudimos cargar los días no laborables.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-azul hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && ordenados.length === 0 && (
        <EmptyState
          titulo="No cargaste días no laborables"
          descripcion="Marcá acá los feriados o cierres puntuales del complejo: esos días quedan cerrados enteros, sin turnos disponibles ni en la agenda ni en el buscador."
          salidas={[]}
        />
      )}

      {!cargando && !error && ordenados.length > 0 && (
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          <div className="divide-y divide-borde/60">
            {ordenados.map((dia) => (
              <div key={dia.id} className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-humo/60">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-tinta">{fechaCompleta(dia.fecha)}</p>
                  {dia.motivo && <p className="truncate text-sm text-grafito">{dia.motivo}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setAEliminar(dia)}
                  aria-label={`Eliminar ${fechaCompleta(dia.fecha)}`}
                  title="Eliminar"
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-cancelado transition-colors hover:bg-cancelado-suave"
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {aEliminar && (
        <ModalPanel titulo="Eliminar día no laborable" subtitulo={fechaCompleta(aEliminar.fecha)} onClose={() => setAEliminar(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              El <span className="font-semibold">{fechaCompleta(aEliminar.fecha)}</span> vuelve a estar disponible para reservar. Esta acción no
              se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAEliminar(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={eliminar.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                <Trash2 className="size-4" aria-hidden />
                {eliminar.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
