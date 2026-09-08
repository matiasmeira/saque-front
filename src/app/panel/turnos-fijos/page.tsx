"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Repeat } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { DialogoCancelarTurnoFijo } from "@/components/panel/dialogo-cancelar-turno-fijo";
import { DialogoEditarClienteTurnoFijo } from "@/components/panel/dialogo-editar-cliente-turno-fijo";
import { DialogoRenovarTurnoFijo } from "@/components/panel/dialogo-renovar-turno-fijo";
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

const FILTROS_ESTADO: { valor: "ACTIVO" | "CANCELADO"; etiqueta: string }[] = [
  { valor: "ACTIVO", etiqueta: "Activas" },
  { valor: "CANCELADO", etiqueta: "Canceladas" },
];

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
 * OWNER/ADMIN/EMPLOYEE), pero sólo el dueño puede cancelar, renovar o editar
 * el cliente de una serie — el backend le responde 403 a un empleado aunque
 * tenga esos permisos.
 *
 * Cancelar, renovar y editar cliente están gateadas por su condición real, no
 * sólo por rol: mostrar el botón para que el backend conteste 400 le hace
 * apretar al dueño algo que nunca iba a funcionar.
 *   - Renovar no se ofrece si la serie ya fue renovada. La pestaña Activas
 *     sólo trae ACTIVO, así que la serie vieja ya no aparece ahí una vez
 *     renovada; "ya renovada" se detecta con `renovadoDesdeId` de otra fila
 *     de la MISMA página — si la renovación quedó en otra página, el 400
 *     del backend es el respaldo. Tampoco se ofrece en la pestaña
 *     Canceladas (ver más abajo): ahí ninguna acción aplica.
 *   - Editar cliente no se ofrece si la serie está atada a un jugador
 *     (`jugadorId !== null`): ahí el nombre sale de su cuenta.
 *
 * Activas / Canceladas: cancelar una serie la saca del listado por defecto
 * (el backend sólo trae ACTIVO si no se pide `estado`), incluso cuando la
 * baja fue "desde una fecha futura" y ninguna ocurrencia se tocó todavía.
 * Sin una forma de pedir las CANCELADO, esa serie quedaba inalcanzable — y
 * como renovar exige ACTIVO, tampoco se podía recuperar el año siguiente.
 * Se eligió el mismo patrón de pestañas/pill que ya usa `panel/pagos` para
 * filtrar por estado (un `useState` + botones con `aria-pressed`) en vez de
 * un toggle binario suelto: es el filtro que ya existe en el repo para "un
 * estado a la vez sobre el mismo listado", y agregar un tercer valor "todas"
 * más adelante es un elemento más en el array, no un cambio de forma.
 */
export default function PanelTurnosFijos() {
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const tienePermiso = usePermisos();
  const { establecimientoId } = useEstablecimientoActivo();

  const puedeVer = rol === "dueno" || PERMISOS_DE_AGENDA.some(tienePermiso);
  const puedeGestionar = rol === "dueno";

  const [pagina, setPagina] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState<"ACTIVO" | "CANCELADO">("ACTIVO");
  const [aCancelar, setACancelar] = useState<TurnoFijoListadoResponse | null>(null);
  const [aRenovar, setARenovar] = useState<TurnoFijoListadoResponse | null>(null);
  const [aEditarCliente, setAEditarCliente] = useState<TurnoFijoListadoResponse | null>(null);

  const consulta = useTurnosFijos(establecimientoId, pagina, filtroEstado);

  if (bloqueadoPorCaja || !puedeVer) return <div className="min-h-dvh bg-humo" />;

  const datos = consulta.data;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-tinta">Turnos fijos</h1>

          <div className="mb-6 flex rounded-full bg-white p-1 shadow-card w-fit">
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

          {consulta.isSuccess && datos && datos.content.length === 0 && filtroEstado === "ACTIVO" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Repeat className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay turnos fijos activos</p>
              <p className="max-w-sm text-sm text-grafito">
                Un turno fijo se carga desde la agenda, con el botón &quot;Turno fijo&quot;.
              </p>
              {/* Las series cargadas antes de este cambio quedaron con turno_fijo_id NULL
                  (no se reconstruyen por heurística): siguen existiendo, sólo que no como
                  TurnoFijo. Sin esta línea, un dueño con 20 series viejas lee un mensaje
                  falso acá. */}
              <p className="max-w-sm text-sm text-grafito">
                Las series cargadas antes de esta versión no aparecen en esta lista: se siguen viendo y gestionando como reservas sueltas desde la agenda.
              </p>
            </div>
          )}

          {consulta.isSuccess && datos && datos.content.length === 0 && filtroEstado === "CANCELADO" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Repeat className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay turnos fijos cancelados</p>
              <p className="max-w-sm text-sm text-grafito">
                Acá van a aparecer las series dadas de baja, con la fecha desde la que dejaron de generar turnos.
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
                  <span>{filtroEstado === "ACTIVO" ? "Próxima ocurrencia" : "Cancelada desde"}</span>
                  <span className="sr-only">Acciones</span>
                </div>

                <div className="divide-y divide-borde/60">
                  {datos.content.map((tf) => {
                    // "Ya renovada" sólo se puede leer de la MISMA página: la serie nueva
                    // apunta a ésta con renovadoDesdeId. Si quedó en otra página, el 400
                    // del backend ("la serie ya fue renovada") es el respaldo.
                    const yaRenovada = datos.content.some((otra) => otra.renovadoDesdeId === tf.id);
                    const puedeEditarCliente = tf.jugadorId === null;

                    return (
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
                          {filtroEstado === "ACTIVO"
                            ? tf.proximaOcurrencia
                              ? proximaOcurrenciaLabel(tf.proximaOcurrencia)
                              : "—"
                            : tf.canceladoDesde
                              ? ddmm(tf.canceladoDesde)
                              : "—"}
                        </span>
                        <span className="flex items-center justify-end gap-2">
                          {/* Ninguna acción aplica sobre una serie CANCELADA: renovar exige
                              ACTIVO (400 del backend si se intenta) y cancelar/editar una
                              serie ya dada de baja no es un flujo real. Esta pestaña es de
                              sólo lectura — está para que la serie sea auditable, no para
                              operarla. */}
                          {filtroEstado === "ACTIVO" && puedeGestionar && puedeEditarCliente && (
                            <button
                              type="button"
                              onClick={() => setAEditarCliente(tf)}
                              className="flex h-8 items-center rounded-full border border-borde px-3 text-xs font-bold text-tinta transition-colors hover:bg-humo"
                            >
                              Editar cliente
                            </button>
                          )}
                          {filtroEstado === "ACTIVO" && puedeGestionar && !yaRenovada && (
                            <button
                              type="button"
                              onClick={() => setARenovar(tf)}
                              className="flex h-8 items-center rounded-full border border-azul px-3 text-xs font-bold text-azul transition-colors hover:bg-celeste-suave"
                            >
                              Renovar
                            </button>
                          )}
                          {filtroEstado === "ACTIVO" && puedeGestionar && (
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
                    );
                  })}
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
      {aRenovar && <DialogoRenovarTurnoFijo turnoFijo={aRenovar} onClose={() => setARenovar(null)} />}
      {aEditarCliente && (
        <DialogoEditarClienteTurnoFijo turnoFijo={aEditarCliente} onClose={() => setAEditarCliente(null)} />
      )}
    </div>
  );
}
