"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Ban, Calendar, Mail, Phone, Plus } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { StatusBadge } from "@/components/saque/status-badge";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { partirFechaHora } from "@/lib/api/fechas";
import { aEstadoTurno } from "@/lib/api/adaptadores/agenda";
import { clientes as endpointClientes, jugadoresBloqueados } from "@/lib/api/endpoints/clientes";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";

function StatCard({ etiqueta, valor, resaltado }: { etiqueta: string; valor: string; resaltado?: boolean }) {
  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className={`mt-1.5 font-display text-3xl font-extrabold tabular-nums ${resaltado ? "text-pendiente" : "text-tinta"}`}>{valor}</p>
    </div>
  );
}

/**
 * Ficha de un cliente: métricas históricas + historial de reservas + bloqueo.
 *
 * Dos botones del mock se fueron porque no tenían dónde guardarse:
 *  - "Marcar como frecuente": `esFrecuente` no existe en el backend. Era un
 *    toggle que sólo movía estado local y se perdía al recargar.
 *  - "Registrar ausencia": las ausencias no se cargan a mano sobre el cliente,
 *    se marcan sobre UNA reserva (PATCH /reservas/{id}/ausente, desde la
 *    agenda) y el contador de acá las cuenta.
 *
 * Bloquear/desbloquear sí es real: POST y DELETE de jugadores-bloqueados.
 */
export default function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();

  const jugadorId = Number(id);
  const idValido = Number.isInteger(jugadorId) && jugadorId > 0;

  const [confirmandoBloqueo, setConfirmandoBloqueo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [paginaHistorial, setPaginaHistorial] = useState(0);

  // Esconder el link en la lista no alcanza: la ficha tiene su propia URL, y
  // el ClienteController entero es OWNER/ADMIN.
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  const habilitado = establecimientoId !== null && idValido;

  const detalle = useQuery({
    queryKey: keys.clientes.detalle(establecimientoId ?? 0, jugadorId),
    queryFn: () => endpointClientes.detalle(establecimientoId!, jugadorId),
    enabled: habilitado,
    retry: false,
  });

  const historial = useQuery({
    queryKey: keys.clientes.reservas(establecimientoId ?? 0, jugadorId, paginaHistorial),
    queryFn: () => endpointClientes.reservas(establecimientoId!, jugadorId, { page: paginaHistorial }),
    enabled: habilitado,
  });

  function alTerminar() {
    // El estado de bloqueo se ve en la ficha Y en la fila del padrón: se
    // invalidan los dos, no sólo el que está a la vista.
    queryClient.invalidateQueries({ queryKey: keys.clientes.todos() });
    queryClient.invalidateQueries({ queryKey: keys.jugadoresBloqueados(establecimientoId!) });
    setConfirmandoBloqueo(false);
    setMotivo("");
    setErrorAccion(null);
  }

  const bloquear = useMutation({
    mutationFn: () =>
      jugadoresBloqueados.bloquear(establecimientoId!, {
        jugadorId,
        motivo: motivo.trim() || undefined,
      }),
    onSuccess: alTerminar,
    onError: (e) => setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos bloquear al jugador."),
  });

  const desbloquear = useMutation({
    mutationFn: () => jugadoresBloqueados.desbloquear(establecimientoId!, jugadorId),
    onSuccess: alTerminar,
    onError: (e) => setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos desbloquear al jugador."),
  });

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  const cliente = detalle.data?.cliente;
  // 404 no es una falla de red: el backend responde así cuando ese jugador no
  // tiene ninguna reserva en este establecimiento, o sea que no es cliente acá.
  const noEncontrado =
    !idValido || (detalle.error instanceof ApiError && detalle.error.status === 404);

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <Link href="/panel/clientes" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul">
            <ArrowLeft className="size-4" aria-hidden />
            Volver a Clientes
          </Link>

          {noEncontrado ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-white py-20 text-center shadow-card">
              <p className="font-display text-lg font-bold text-tinta">No encontramos ese cliente</p>
              <p className="max-w-sm text-sm text-grafito">
                El link puede estar mal, o esa persona nunca reservó en tu complejo.
              </p>
            </div>
          ) : detalle.isPending ? (
            <div className="max-w-3xl animate-pulse space-y-6">
              <div className="h-44 rounded-card bg-white shadow-card" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="h-28 rounded-card bg-white shadow-card" />
                <div className="h-28 rounded-card bg-white shadow-card" />
                <div className="h-28 rounded-card bg-white shadow-card" />
              </div>
            </div>
          ) : detalle.isError || !cliente ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la ficha.</p>
              <button
                type="button"
                onClick={() => detalle.refetch()}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              {errorAccion && (
                <p role="alert" className="rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
                  {errorAccion}
                </p>
              )}

              <div className="rounded-card bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-tinta">
                      {cliente.nombre}
                      {cliente.bloqueado && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cancelado-suave px-2.5 py-1 text-xs font-semibold text-cancelado">
                          <Ban className="size-3.5 shrink-0" aria-hidden />
                          Bloqueado
                        </span>
                      )}
                    </h1>

                    {cliente.bloqueado && detalle.data?.motivoBloqueo && (
                      <p className="mt-1.5 text-sm text-cancelado">{detalle.data.motivoBloqueo}</p>
                    )}

                    <div className="mt-2 space-y-1 text-sm text-grafito">
                      {/* El teléfono es del Usuario y puede no estar cargado:
                          el registro no lo exige. El email sí es obligatorio. */}
                      {cliente.telefono ? (
                        <p className="flex items-center gap-2">
                          <Phone className="size-4 shrink-0" aria-hidden />
                          <a href={`tel:${cliente.telefono}`} className="text-azul hover:underline">
                            {cliente.telefono}
                          </a>
                        </p>
                      ) : (
                        <p className="flex items-center gap-2">
                          <Phone className="size-4 shrink-0" aria-hidden />
                          Sin teléfono cargado
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Mail className="size-4 shrink-0" aria-hidden />
                        <a href={`mailto:${cliente.email}`} className="text-azul hover:underline">
                          {cliente.email}
                        </a>
                      </p>
                      {detalle.data?.fechaPrimeraReserva && (
                        <p className="flex items-center gap-2">
                          <Calendar className="size-4 shrink-0" aria-hidden />
                          Cliente desde {fechaLarga(detalle.data.fechaPrimeraReserva.slice(0, 10))}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/panel/agenda?nuevoTurnoNombre=${encodeURIComponent(cliente.nombre)}${
                      cliente.telefono ? `&nuevoTurnoTelefono=${encodeURIComponent(cliente.telefono)}` : ""
                    }`}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    <Plus className="size-4" aria-hidden />
                    Nueva reserva
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-humo pt-6">
                  <button
                    type="button"
                    onClick={() => (cliente.bloqueado ? desbloquear.mutate() : setConfirmandoBloqueo(true))}
                    disabled={bloquear.isPending || desbloquear.isPending}
                    className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50 ${
                      cliente.bloqueado
                        ? "border-borde text-tinta hover:bg-humo"
                        : "border-cancelado text-cancelado hover:bg-cancelado-suave"
                    }`}
                  >
                    <Ban className="size-4 shrink-0" aria-hidden />
                    {cliente.bloqueado ? "Desbloquear jugador" : "Bloquear jugador"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatCard etiqueta="Total gastado" valor={formatearPrecio(cliente.totalGastado)} />
                <StatCard etiqueta="Reservas jugadas" valor={String(cliente.reservasTotales)} />
                <StatCard etiqueta="Ausencias" valor={String(cliente.ausencias)} resaltado={cliente.ausencias > 0} />
              </div>

              <div className="rounded-card bg-white p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-tinta">Historial de reservas</h2>
                {/* Las tres cards de arriba cuentan sólo FINALIZADA (y sólo
                    AUSENTE en el caso de las ausencias); el historial trae
                    todos los estados, canceladas incluidas. Los números no
                    tienen por qué coincidir con el largo de esta lista. */}
                <p className="mt-0.5 text-sm text-grafito">Todas sus reservas, incluidas las canceladas.</p>

                {historial.isPending ? (
                  <div className="mt-4 animate-pulse space-y-2">
                    <div className="h-12 w-full rounded bg-humo" />
                    <div className="h-12 w-full rounded bg-humo" />
                  </div>
                ) : historial.isError ? (
                  <p className="mt-3 text-sm text-cancelado">No pudimos cargar el historial.</p>
                ) : historial.data.content.length === 0 ? (
                  <p className="mt-3 text-sm text-grafito">Todavía no tiene reservas registradas.</p>
                ) : (
                  <>
                    <ul className="mt-4 space-y-2">
                      {historial.data.content.map((reserva) => {
                        const { fecha, hora } = partirFechaHora(reserva.fechaHoraInicio);
                        return (
                          <li key={reserva.id} className="flex flex-wrap items-center justify-between gap-3 rounded-input bg-humo p-3">
                            <div className="flex items-center gap-3">
                              <Calendar className="size-4 shrink-0 text-grafito" aria-hidden />
                              <div>
                                <p className="text-sm font-semibold text-tinta">
                                  {fechaLarga(fecha)} · {hora}
                                </p>
                                <p className="text-xs text-grafito">{reserva.canchaNombre}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge estado={aEstadoTurno(reserva.estado)} />
                              <span className="text-sm font-semibold text-tinta">{formatearPrecio(reserva.precioTotal)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {historial.data.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-grafito">
                          Página {historial.data.number + 1} de {historial.data.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaginaHistorial((p) => Math.max(0, p - 1))}
                            disabled={historial.data.first}
                            className="h-9 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-40"
                          >
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaginaHistorial((p) => p + 1)}
                            disabled={historial.data.last}
                            className="h-9 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-40"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {confirmandoBloqueo && cliente && (
        <ModalPanel titulo="Bloquear jugador" subtitulo={cliente.nombre} onClose={() => setConfirmandoBloqueo(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              No va a poder reservar más en tu complejo. Sus reservas ya cargadas no se tocan.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-tinta">Motivo (opcional)</span>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={255}
                rows={3}
                placeholder="Para acordarte por qué, dentro de seis meses."
                className="w-full rounded-input bg-humo p-3 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoBloqueo(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => bloquear.mutate()}
                disabled={bloquear.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
              >
                <Ban className="size-4" aria-hidden />
                Bloquear
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
