"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TimelineAgenda, type ColumnaTimeline } from "@/components/panel/timeline-agenda";
import { SkeletonAgenda } from "@/components/panel/skeleton-agenda";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { FormTurnoRapido, type DatosTurnoManual } from "@/components/panel/form-turno-rapido";
import { DetalleTurno } from "@/components/panel/detalle-turno";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { PERMISOS_DE_AGENDA } from "@/lib/permisos-empleado";
import { useRolPanel } from "@/lib/rol-panel";
import { useHoraActual } from "@/lib/hora-actual";
import { diaCorto, diasVisibles, hoyISO, inicioSemana, rangoSemanaLabel, sumarDias } from "@/lib/fecha";
import { fechaLarga } from "@/lib/formato";
import { useQuery } from "@tanstack/react-query";
import { abreviaturaDeporte } from "@/lib/deportes";
import { canchas as endpointCanchas } from "@/lib/api/endpoints/canchas";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { aCanchaPanel } from "@/lib/api/adaptadores/canchas";
import { useAccionesReserva, useAgenda } from "@/hooks/api/use-agenda";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { rangoDeAgenda } from "@/lib/horarios";
import type { TurnoConReserva } from "@/lib/api/adaptadores/agenda";
import type { MetodoPago } from "@/lib/api/tipos/comunes";
import { type Cancha } from "@/lib/panel/canchas";

type Vista = "dia" | "semana";
type PanelAbierto =
  | { tipo: "nuevo"; canchaId: number; fecha: string; hora?: string; nombreInicial?: string; telefonoInicial?: string }
  | { tipo: "detalle"; turno: TurnoConReserva }
  | null;
type EstadoCarga = "cargando" | "error" | "listo";

function etiquetaDeportes(cancha: Cancha): string {
  return cancha.deportes.map(abreviaturaDeporte).join(" / ");
}

// El destino de "mover turno" NO se valida acá: el backend chequea que la
// cancha destino sea del mismo establecimiento, que el estado lo permita y que
// el horario esté libre, y devuelve 409 si el pool no da. Repetir esa cuenta
// del lado del front sería la clase de duplicación que después miente.
export default function PanelAgenda() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const rol = useRolPanel();
  const horaActual = useHoraActual();

  // El listado que la alimenta (GET /reservas/establecimiento/{id}) y el de
  // canchas aceptan a un empleado que tenga al menos uno de los permisos que se
  // ejercen desde esta pantalla. Es el mismo conjunto del lado del backend
  // (AutorizacionEmpleadoService.PERMISOS_OPERATIVOS_DE_RESERVA).
  const puedeVerAgenda = rol === "dueno" || PERMISOS_DE_AGENDA.some(tienePermiso);
  const puedeCobrarTurnos = tienePermiso("FINALIZAR_RESERVA");
  const puedeCancelarTurnos = tienePermiso("CANCELAR_RESERVA");

  const { establecimientoId, establecimiento } = useEstablecimientoActivo();

  const [fecha, setFecha] = useState(() => hoyISO());
  const [vista, setVista] = useState<Vista>("dia");
  const [canchaSemana, setCanchaSemana] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  // Si llega desde "Nueva reserva" en la ficha de un cliente (C6), el
  // turno arranca precargado — se lee una sola vez, al montar, del
  // valor inicial de useState (no en un efecto: un setState síncrono
  // ahí dispara un render en cascada que el compiler de React no deja).
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(() => {
    const nombreInicial = searchParams.get("nuevoTurnoNombre");
    const telefonoInicial = searchParams.get("nuevoTurnoTelefono");
    if (!nombreInicial || !telefonoInicial) return null;
    return { tipo: "nuevo", canchaId: 0, fecha: hoyISO(), nombreInicial, telefonoInicial };
  });

  const consultaCanchas = useQuery({
    queryKey: keys.canchas(establecimientoId ?? 0),
    queryFn: () => endpointCanchas.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });
  const canchas = (consultaCanchas.data ?? []).map(aCanchaPanel);

  const acciones = useAccionesReserva();

  // Sin permiso para ver la agenda, no hay nada que mostrar acá — se
  // redirige a Clientes si al menos ese lo tiene, así no queda
  // colgado en una pantalla vacía. Si tampoco tiene ver_clientes, no
  // hay a dónde mandarlo: se queda en blanco (cuenta mal configurada
  // por el dueño, no un flujo que valga la pena resolver más).
  useEffect(() => {
    if (!bloqueadoPorCaja && !puedeVerAgenda) router.replace("/panel/caja");
  }, [bloqueadoPorCaja, puedeVerAgenda, router]);

  const dias = diasVisibles(fecha, vista);
  const canchaSeleccionada = canchas.find((c) => c.id === canchaSemana) ?? canchas[0];

  /**
   * El backend expone la agenda por DÍA: `fecha` es un único día y obligatorio.
   * La vista semanal necesita entonces 7 requests, que useQueries emite en
   * paralelo (ver useAgenda).
   */
  const { turnosPorFecha, bloqueosPorFecha, cargando, error, refetch } = useAgenda(
    establecimientoId,
    dias,
  );

  const estadoCarga: EstadoCarga =
    cargando || consultaCanchas.isPending ? "cargando" : error ? "error" : "listo";

  if (bloqueadoPorCaja || !puedeVerAgenda) return <div className="min-h-dvh bg-humo" />;

  /** Los mensajes de negocio del backend son mostrables: no se traducen por status. */
  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  /**
   * Destinos válidos para "Mover a otra cancha": físicas activas, distintas de
   * la actual, que compartan algún deporte. El backend además valida que la
   * cancha destino sea del mismo establecimiento y que el estado lo permita.
   */
  function canchasCompatibles(cancha: Cancha | undefined): Cancha[] {
    if (!cancha) return [];
    return canchas.filter(
      (c) =>
        c.id !== cancha.id &&
        c.isActive &&
        c.canchasFisicas.length === 0 &&
        c.deportes.some((d) => cancha.deportes.includes(d)),
    );
  }

  function irAnterior() {
    setFecha((f) => sumarDias(f, vista === "dia" ? -1 : -7));
  }
  function irSiguiente() {
    setFecha((f) => sumarDias(f, vista === "dia" ? 1 : 7));
  }

  function abrirLibre(columnaId: string | number, hora: string) {
    if (vista === "dia") {
      setPanelAbierto({ tipo: "nuevo", canchaId: columnaId as number, fecha, hora });
    } else {
      setPanelAbierto({ tipo: "nuevo", canchaId: canchaSeleccionada.id, fecha: columnaId as string, hora });
    }
  }

  function abrirNuevoGenerico() {
    const canchaId = vista === "dia" ? (canchas[0]?.id ?? 0) : canchaSeleccionada.id;
    setPanelAbierto({ tipo: "nuevo", canchaId, fecha: dias[0] });
  }

  /**
   * Alta de mostrador: POST /reservas/manual, que nace en CONFIRMADA (no pasa
   * por el hold de 10 minutos).
   *
   * Las dos fecha-hora vienen del slot que devolvió la grilla de
   * disponibilidad, sin rearmar: el backend valida que el inicio caiga en
   * :00/:30 y que la duración esté entre las permitidas de la cancha.
   */
  async function agregarTurno(datos: DatosTurnoManual) {
    const cancha = canchas.find((c) => c.id === datos.canchaId);
    setErrorAccion(null);
    try {
      await acciones.crearManual.mutateAsync({
        canchaId: datos.canchaId,
        fechaHoraInicio: datos.fechaHoraInicio,
        fechaHoraFin: datos.fechaHoraFin,
        deporteSeleccionado: (cancha?.deportes[0] ?? "FUTBOL") as never,
        nombreCliente: datos.nombre,
        telefonoCliente: datos.telefono || undefined,
        senaFisicaRecibida: datos.senaFisicaRecibida,
      });
      setPanelAbierto(null);
    } catch (e) {
      alFallar(e, "No pudimos crear el turno.");
    }
  }

  async function accionSobreTurno(promesa: Promise<unknown>, porDefecto: string) {
    setErrorAccion(null);
    try {
      await promesa;
      setPanelAbierto(null);
    } catch (e) {
      alFallar(e, porDefecto);
    }
  }

  function marcarPagado(turno: TurnoConReserva, metodoPago: MetodoPago) {
    accionSobreTurno(
      acciones.finalizar.mutateAsync({ id: Number(turno.id), metodoPago }),
      "No pudimos registrar el cobro.",
    );
  }

  function cancelarTurno(turno: TurnoConReserva) {
    accionSobreTurno(
      acciones.cancelar.mutateAsync(Number(turno.id)),
      "No pudimos cancelar el turno.",
    );
  }

  function marcarAusente(turno: TurnoConReserva) {
    accionSobreTurno(
      acciones.marcarAusente.mutateAsync(Number(turno.id)),
      "No pudimos marcar la ausencia.",
    );
  }

  function deshacerAusencia(turno: TurnoConReserva) {
    accionSobreTurno(
      acciones.revertirAusencia.mutateAsync(Number(turno.id)),
      "No pudimos deshacer la ausencia.",
    );
  }

  function moverTurno(turno: TurnoConReserva, canchaDestinoId: number) {
    accionSobreTurno(
      acciones.moverCancha.mutateAsync({
        id: Number(turno.id),
        nuevaCanchaId: canchaDestinoId,
      }),
      "No pudimos mover el turno.",
    );
  }

  const columnas: ColumnaTimeline[] =
    vista === "dia"
      ? canchas.map((cancha) => ({
          id: cancha.id,
          titulo: cancha.nombre,
          subtitulo: etiquetaDeportes(cancha),
          turnos: (turnosPorFecha[fecha] ?? []).filter((t) => t.canchaId === cancha.id),
          bloqueos: (bloqueosPorFecha[fecha] ?? []).filter((b) => b.canchaId === cancha.id),
        }))
      : dias.map((d) => ({
          id: d,
          titulo: `${diaCorto(d)} ${Number(d.slice(-2))}`,
          subtitulo: d === hoyISO() ? "Hoy" : undefined,
          turnos: (turnosPorFecha[d] ?? []).filter((t) => t.canchaId === canchaSeleccionada.id),
          bloqueos: (bloqueosPorFecha[d] ?? []).filter((b) => b.canchaId === canchaSeleccionada.id),
        }));

  const diaVacio = vista === "dia" && estadoCarga === "listo" && (turnosPorFecha[fecha] ?? []).length === 0;

  // Los extremos de la grilla salen del horario de atención real, ampliados
  // para no cortar nada de lo que haya que dibujar. Un EMPLOYEE no puede leer
  // el establecimiento (no hay GET /establecimientos/{id}), así que para él
  // manda lo segundo y el rango por defecto.
  const { abre, cierra } = rangoDeAgenda(
    establecimiento?.horariosAtencion,
    dias,
    columnas.flatMap((col) => [...col.turnos, ...(col.bloqueos ?? [])]),
  );

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={irAnterior}
                aria-label="Fecha anterior"
                className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white"
              >
                <ChevronLeft className="size-[18px]" aria-hidden />
              </button>
              <span className="min-w-[220px] text-center font-display text-base font-bold text-tinta">
                {vista === "dia" ? fechaLarga(fecha) : rangoSemanaLabel(inicioSemana(fecha))}
              </span>
              <button
                type="button"
                onClick={irSiguiente}
                aria-label="Fecha siguiente"
                className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white"
              >
                <ChevronRight className="size-[18px]" aria-hidden />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {vista === "semana" && (
                <select
                  value={canchaSemana ?? canchaSeleccionada?.id ?? ""}
                  onChange={(e) => setCanchaSemana(Number(e.target.value))}
                  aria-label="Cancha a mostrar"
                  className="h-10 rounded-full bg-humo px-3.5 text-sm font-semibold text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  {canchas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex rounded-full bg-humo p-1">
                <button
                  type="button"
                  onClick={() => setVista("dia")}
                  aria-pressed={vista === "dia"}
                  className={`h-8 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                    vista === "dia" ? "bg-celeste-suave text-tinta" : "text-grafito hover:text-tinta"
                  }`}
                >
                  Día
                </button>
                <button
                  type="button"
                  onClick={() => setVista("semana")}
                  aria-pressed={vista === "semana"}
                  className={`h-8 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                    vista === "semana" ? "bg-celeste-suave text-tinta" : "text-grafito hover:text-tinta"
                  }`}
                >
                  Semana
                </button>
              </div>

              <button
                type="button"
                onClick={abrirNuevoGenerico}
                className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Nuevo turno
              </button>
            </div>
          </div>

          {/*
            Los errores de las acciones se muestran acá y no dentro del drawer
            porque varias reglas del backend recién se conocen al intentar:
            marcar ausente antes de que el turno empiece, finalizar una reserva
            que sigue en PENDIENTE_SENA, o mover a una cancha ocupada. El
            mensaje del backend explica cuál fue.
          */}
          {errorAccion && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonAgenda columnas={vista === "dia" ? Math.max(canchas.length, 1) : 7} />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la agenda.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && (
            <div className="relative">
              {diaVacio && (
                <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center px-4">
                  <div className="pointer-events-auto max-w-xs rounded-card bg-white p-5 text-center shadow-card">
                    <p className="font-display text-sm font-bold text-tinta">Todavía no hay turnos este día</p>
                    <p className="mt-1 text-sm text-grafito">Tocá cualquier horario libre para cargar el primero.</p>
                  </div>
                </div>
              )}
              <TimelineAgenda
                columnas={columnas}
                horaActual={horaActual}
                mostrarLineaAhora={dias.includes(hoyISO())}
                abre={abre}
                cierra={cierra}
                onClickLibre={abrirLibre}
                onClickTurno={(turno) => setPanelAbierto({ tipo: "detalle", turno: turno as TurnoConReserva })}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-grafito">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-disponible-suave" aria-hidden />
              Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded border-l-2 border-ocupado bg-ocupado-suave" aria-hidden />
              Ocupado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded border-l-2 border-pendiente bg-pendiente-suave" aria-hidden />
              Seña pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded border-l-2 border-cancelado bg-cancelado-suave" aria-hidden />
              Cancelado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded border-l-2 border-ausente bg-ausente-suave" aria-hidden />
              Ausente
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-3 rounded border-l-2 border-grafito bg-[repeating-linear-gradient(45deg,var(--color-ocupado-suave),var(--color-ocupado-suave)_3px,var(--color-borde)_3px,var(--color-borde)_6px)]"
                aria-hidden
              />
              Mantenimiento
            </span>
          </div>
        </main>
      </div>

      {panelAbierto?.tipo === "nuevo" && (
        <DrawerPanel
          titulo="Nuevo turno"
          subtitulo={`${canchas.find((c) => c.id === panelAbierto.canchaId)?.nombre ?? ""} · ${fechaLarga(panelAbierto.fecha)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <FormTurnoRapido
            canchas={canchas}
            canchaId={panelAbierto.canchaId}
            fecha={panelAbierto.fecha}
            horaInicial={panelAbierto.hora}
            nombreInicial={panelAbierto.nombreInicial}
            telefonoInicial={panelAbierto.telefonoInicial}
            establecimientoId={establecimientoId ?? 0}
            guardando={acciones.crearManual.isPending}
            onGuardar={agregarTurno}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "detalle" && (
        <DrawerPanel
          titulo={canchas.find((c) => c.id === panelAbierto.turno.canchaId)?.nombre ?? ""}
          subtitulo={`${panelAbierto.turno.horaInicio}–${panelAbierto.turno.horaFin} · ${fechaLarga(panelAbierto.turno.fecha)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <DetalleTurno
            turno={panelAbierto.turno}
            cancha={canchas.find((c) => c.id === panelAbierto.turno.canchaId)!}
            canchasCompatibles={canchasCompatibles(canchas.find((c) => c.id === panelAbierto.turno.canchaId))}
            puedeCobrar={puedeCobrarTurnos}
            puedeCancelar={puedeCancelarTurnos}
            esDueno={rol === "dueno"}
            onMarcarPagado={(metodoPago) => marcarPagado(panelAbierto.turno, metodoPago)}
            onCancelar={() => cancelarTurno(panelAbierto.turno)}
            onMover={(destinoId) => moverTurno(panelAbierto.turno, destinoId)}
            onMarcarAusente={() => marcarAusente(panelAbierto.turno)}
            onDeshacerAusencia={() => deshacerAusencia(panelAbierto.turno)}
          />
        </DrawerPanel>
      )}
    </div>
  );
}
