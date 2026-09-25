"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/canche/empty-state";
import { ModalPanel } from "@/components/panel/modal-panel";
import { SkeletonAdminEstablecimientos } from "@/components/panel/skeleton-admin-establecimientos";
import { TarjetaEstablecimientoAdmin } from "@/components/panel/tarjeta-establecimiento-admin";
import {
  useAdminEstablecimientos,
  useRechazarEstablecimiento,
  useVerificarEstablecimiento,
} from "@/hooks/api/use-admin-establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { EstadoVerificacionEstablecimiento } from "@/lib/api/tipos/comunes";

type EstadoCarga = "cargando" | "error" | "listo";

const ESTADOS: { valor: EstadoVerificacionEstablecimiento; label: string }[] = [
  { valor: "EN_REVISION", label: "En revisión" },
  { valor: "PENDIENTE", label: "Pendiente" },
  { valor: "VERIFICADO", label: "Verificado" },
  { valor: "RECHAZADO", label: "Rechazado" },
];

/** Placeholders que empujan a un motivo accionable, no a "rechazado" sin más. */
const MOTIVOS_EJEMPLO = [
  "No pudimos verificar el CUIT.",
  "El Instagram no corresponde a la dirección declarada.",
  "El teléfono de contacto no responde.",
];

function etiquetaEstado(valor: EstadoVerificacionEstablecimiento): string {
  return ESTADOS.find((e) => e.valor === valor)?.label ?? valor;
}

/**
 * Cola de moderación de altas de establecimiento (rol ADMIN). EN_REVISION es
 * la vista por defecto porque es el trabajo pendiente real; los demás
 * estados son consulta de lo ya resuelto.
 */
export default function AdminEstablecimientos() {
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoVerificacionEstablecimiento>("EN_REVISION");
  const [pagina, setPagina] = useState(0);
  const [confirmarVerificarId, setConfirmarVerificarId] = useState<number | null>(null);
  const [rechazo, setRechazo] = useState<{ id: number; motivo: string; placeholder: string } | null>(null);

  const consulta = useAdminEstablecimientos({ estadoVerificacion: estadoFiltro, page: pagina });
  const verificar = useVerificarEstablecimiento();
  const rechazar = useRechazarEstablecimiento();

  const estadoCarga: EstadoCarga = consulta.isPending ? "cargando" : consulta.isError ? "error" : "listo";
  const datos = consulta.data;

  function cambiarEstado(valor: EstadoVerificacionEstablecimiento) {
    setEstadoFiltro(valor);
    setPagina(0);
  }

  function abrirConfirmarVerificar(id: number) {
    verificar.reset();
    setConfirmarVerificarId(id);
  }

  function abrirRechazo(id: number) {
    rechazar.reset();
    setRechazo({ id, motivo: "", placeholder: MOTIVOS_EJEMPLO[id % MOTIVOS_EJEMPLO.length] });
  }

  function confirmarVerificacion() {
    if (confirmarVerificarId === null) return;
    verificar.mutate(confirmarVerificarId, { onSuccess: () => setConfirmarVerificarId(null) });
  }

  function confirmarRechazo() {
    if (!rechazo || !rechazo.motivo.trim()) return;
    rechazar.mutate({ id: rechazo.id, motivo: rechazo.motivo.trim() }, { onSuccess: () => setRechazo(null) });
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Establecimientos</h1>
      <p className="mt-1 text-sm text-grafito">Moderación de altas: verificá o rechazá lo que llega a revisión.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ESTADOS.map(({ valor, label }) => (
          <button
            key={valor}
            type="button"
            onClick={() => cambiarEstado(valor)}
            aria-pressed={estadoFiltro === valor}
            className={`flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
              estadoFiltro === valor ? "bg-azul text-white" : "bg-humo text-grafito hover:text-tinta"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {estadoCarga === "cargando" && <SkeletonAdminEstablecimientos />}

        {estadoCarga === "error" && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-16 text-center shadow-card">
            <AlertTriangle className="size-8 text-cancelado" aria-hidden />
            <p className="font-semibold text-tinta">
              {consulta.error instanceof ApiError
                ? mensajeVisible(consulta.error)
                : "No pudimos cargar los establecimientos."}
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

        {estadoCarga === "listo" && datos && datos.content.length === 0 && (
          <EmptyState
            titulo={
              estadoFiltro === "EN_REVISION"
                ? "No hay solicitudes pendientes"
                : `No hay establecimientos en "${etiquetaEstado(estadoFiltro)}"`
            }
            descripcion={
              estadoFiltro === "EN_REVISION"
                ? "Buena noticia: no queda nada esperando tu revisión ahora mismo."
                : undefined
            }
            salidas={[]}
          />
        )}

        {estadoCarga === "listo" && datos && datos.content.length > 0 && (
          <div className="space-y-4">
            {datos.content.map((item) => (
              <TarjetaEstablecimientoAdmin
                key={item.id}
                item={item}
                verificando={verificar.isPending && verificar.variables === item.id}
                rechazando={rechazar.isPending && rechazar.variables?.id === item.id}
                onVerificar={() => abrirConfirmarVerificar(item.id)}
                onRechazar={() => abrirRechazo(item.id)}
              />
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <p className="text-sm text-grafito">
                {datos.totalElements} {datos.totalElements === 1 ? "establecimiento" : "establecimientos"}
                {datos.totalPages > 1 && ` · página ${datos.number + 1} de ${datos.totalPages}`}
              </p>
              {datos.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.max(0, p - 1))}
                    disabled={datos.first}
                    className="flex h-9 items-center gap-1 rounded-full border border-borde bg-white px-3 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagina((p) => p + 1)}
                    disabled={datos.last}
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

      {confirmarVerificarId !== null && (
        <ModalPanel titulo="Confirmar verificación" onClose={() => setConfirmarVerificarId(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Al verificar, el complejo pasa a aparecer en el buscador y puede recibir reservas. También arranca el
              mes de prueba del dueño, si todavía no lo tenía. No se puede deshacer desde acá.
            </p>
            {verificar.isError && (
              <p className="text-sm text-cancelado" role="alert">
                {verificar.error instanceof ApiError
                  ? mensajeVisible(verificar.error)
                  : "No pudimos verificar el establecimiento."}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarVerificarId(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarVerificacion}
                disabled={verificar.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" aria-hidden />
                {verificar.isPending ? "Verificando…" : "Verificar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {rechazo && (
        <ModalPanel titulo="Rechazar establecimiento" onClose={() => setRechazo(null)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="motivo-rechazo" className="mb-1 block text-xs font-semibold text-grafito">
                Motivo (el dueño lo va a ver)
              </label>
              <textarea
                id="motivo-rechazo"
                required
                rows={4}
                autoFocus
                value={rechazo.motivo}
                onChange={(e) => setRechazo({ ...rechazo, motivo: e.target.value })}
                placeholder={rechazo.placeholder}
                className="w-full rounded-input bg-humo px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
              <p className="mt-1 text-xs text-grafito">
                Escribí algo que el dueño pueda corregir: qué no coincide o qué falta, no sólo &ldquo;rechazado&rdquo;.
              </p>
            </div>
            {rechazar.isError && (
              <p className="text-sm text-cancelado" role="alert">
                {rechazar.error instanceof ApiError
                  ? mensajeVisible(rechazar.error)
                  : "No pudimos rechazar el establecimiento."}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRechazo(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={rechazar.isPending || !rechazo.motivo.trim()}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rechazar.isPending ? "Rechazando…" : "Rechazar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </main>
  );
}
