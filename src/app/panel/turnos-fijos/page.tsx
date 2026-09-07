"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Repeat } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { DialogoCancelarTurnoFijo } from "@/components/panel/dialogo-cancelar-turno-fijo";
import { useTurnosFijos } from "@/hooks/api/use-turnos-fijos";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { DIA_SEMANA_DESDE_BACK, partirFechaHora, type DiaSemanaBack } from "@/lib/api/fechas";
import type { TurnoFijoListadoResponse } from "@/lib/api/tipos/turnos-fijos";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { PERMISOS_DE_AGENDA } from "@/lib/permisos-empleado";
import { useRolPanel } from "@/lib/rol-panel";
import { DIAS_SEMANA } from "@/lib/panel/tarifas";

const COLUMNAS = "grid-cols-[1.1fr_0.8fr_0.95fr_1.1fr_1.15fr_1.15fr_auto]";

/** "2026-09-07" → "07/09" */
function ddmm(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;
}

function diaLargo(dia: DiaSemanaBack): string {
  return DIAS_SEMANA.find((d) => d.valor === DIA_SEMANA_DESDE_BACK[dia])?.larga ?? dia;
}

function proximaOcurrenciaLabel(fechaHoraISO: string): string {
  const { fecha, hora } = partirFechaHora(fechaHoraISO);
  return `${ddmm(fecha)} · ${hora}`;
}

/**
 * Turnos fijos — gestión de las series, con la baja como unidad.
 *
 * Antes de esta pantalla, dar de baja un turno fijo era cancelar hasta 52
 * reservas sueltas a mano: acá es una sola acción sobre la serie
 * (POST /turnos-fijos/{id}/cancelar).
 *
 * Visible con el mismo criterio que la agenda: además del dueño, un empleado
 * con algún permiso operativo de reserva puede VER el listado (GET admite
 * OWNER/ADMIN/EMPLOYEE), pero sólo el dueño puede cancelar series — el
 * backend le responde 403 a un empleado aunque tenga esos permisos.
 */
export default function PanelTurnosFijos() {
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const tienePermiso = usePermisos();
  const { establecimientoId } = useEstablecimientoActivo();

  const puedeVer = rol === "dueno" || PERMISOS_DE_AGENDA.some(tienePermiso);
  const puedeCancelar = rol === "dueno";

  const [pagina, setPagina] = useState(0);
  const [aCancelar, setACancelar] = useState<TurnoFijoListadoResponse | null>(null);

  const consulta = useTurnosFijos(establecimientoId, pagina);

  if (bloqueadoPorCaja || !puedeVer) return <div className="min-h-dvh bg-humo" />;

  const datos = consulta.data;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Turnos fijos</h1>

          {consulta.isPending && (
            <div className="rounded-card bg-white py-20 text-center text-sm text-grafito shadow-card">
              Cargando…
            </div>
          )}

          {consulta.isError && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">
                {consulta.error instanceof ApiError
                  ? mensajeVisible(consulta.error)
                  : "No pudimos cargar los turnos fijos."}
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

          {consulta.isSuccess && datos && datos.content.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Repeat className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay turnos fijos activos</p>
              <p className="max-w-sm text-sm text-grafito">
                Un turno fijo se carga desde la agenda, con el botón &quot;Turno fijo&quot;.
              </p>
            </div>
          )}

          {consulta.isSuccess && datos && datos.content.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-card bg-white shadow-card">
                <div
                  className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}
                >
                  <span>Cancha</span>
                  <span>Día</span>
                  <span>Horario</span>
                  <span>Período</span>
                  <span>Cliente</span>
                  <span>Próxima ocurrencia</span>
                  <span className="sr-only">Acciones</span>
                </div>

                <div className="divide-y divide-borde/60">
                  {datos.content.map((tf) => (
                    <div
                      key={tf.id}
                      className={`grid ${COLUMNAS} items-center gap-3 px-6 py-3.5 transition-colors hover:bg-humo/60`}
                    >
                      <span className="truncate text-sm font-semibold text-tinta">{tf.canchaNombre}</span>
                      <span className="truncate text-sm text-grafito">{diaLargo(tf.diaSemana)}</span>
                      <span className="text-sm text-grafito">
                        {tf.horaInicio.slice(0, 5)}–{tf.horaFin.slice(0, 5)}
                      </span>
                      <span className="text-sm text-grafito">
                        {ddmm(tf.fechaInicioPeriodo)} al {ddmm(tf.fechaFinPeriodo)}
                      </span>
                      <span className="truncate text-sm text-grafito">
                        {tf.jugadorNombre ?? tf.nombreClienteManual ?? "Sin nombre"}
                      </span>
                      <span className="text-sm text-grafito">
                        {tf.proximaOcurrencia ? proximaOcurrenciaLabel(tf.proximaOcurrencia) : "—"}
                      </span>
                      <span className="flex items-center justify-end">
                        {puedeCancelar && (
                          <button
                            type="button"
                            onClick={() => setACancelar(tf)}
                            className="flex h-8 items-center rounded-full border border-cancelado px-3 text-xs font-bold text-cancelado transition-colors hover:bg-cancelado-suave"
                          >
                            Cancelar serie
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {datos.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <p className="text-sm text-grafito">
                    Página {datos.number + 1} de {datos.totalPages}
                  </p>
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
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {aCancelar && <DialogoCancelarTurnoFijo turnoFijo={aCancelar} onClose={() => setACancelar(null)} />}
    </div>
  );
}
