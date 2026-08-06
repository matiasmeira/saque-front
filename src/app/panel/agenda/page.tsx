"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TimelineAgenda, type ColumnaTimeline } from "@/components/panel/timeline-agenda";
import { SkeletonAgenda } from "@/components/panel/skeleton-agenda";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { FormTurnoRapido } from "@/components/panel/form-turno-rapido";
import { DetalleTurno } from "@/components/panel/detalle-turno";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { useRolPanel } from "@/lib/rol-panel";
import { useHoraActual } from "@/lib/hora-actual";
import { diaCorto, diasVisibles, hoyISO, inicioSemana, rangoSemanaLabel, sumarDias } from "@/lib/fecha";
import { fechaLarga } from "@/lib/formato";
import { DEPORTES } from "@/mocks/deportes";
import { PANEL_CANCHAS, type Cancha } from "@/mocks/canchas";
import { bloqueosDelDia, PANEL_COMPLEJO, turnosDelDia, type Turno } from "@/mocks/agenda";

type Vista = "dia" | "semana";
type PanelAbierto =
  | { tipo: "nuevo"; canchaId: number; fecha: string; hora?: string; nombreInicial?: string; telefonoInicial?: string }
  | { tipo: "detalle"; turno: Turno }
  | null;
type EstadoCarga = "cargando" | "error" | "listo";

function etiquetaDeportes(cancha: Cancha): string {
  return cancha.deportes.map((d) => DEPORTES.find((x) => x.valor === d)?.abreviatura ?? d).join(" / ");
}

/** físicas activas, distintas de la actual, que comparten algún deporte con ella — destinos válidos para "Mover a otra cancha". */
function canchasCompatibles(cancha: Cancha | undefined): Cancha[] {
  if (!cancha) return [];
  return PANEL_CANCHAS.filter(
    (c) => c.id !== cancha.id && c.isActive && c.canchasFisicas.length === 0 && c.deportes.some((d) => cancha.deportes.includes(d)),
  );
}

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados para poder
// probarlos sin backend real — mismo patrón que ?mockPago en A7.
// TODO backend: turnos y disponibilidad vienen de la API — y ahí sí
// hay que validar el destino de "mover turno" contra disponibilidad
// real del pool, acá el mock no lo chequea.
export default function PanelAgenda() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const rol = useRolPanel();
  const horaActual = useHoraActual();

  const puedeVerAgenda = tienePermiso("ver_agenda");
  const puedeVerClientes = tienePermiso("ver_clientes");
  const puedeCobrarTurnos = tienePermiso("cobrar_turnos");
  const puedeCancelarTurnos = tienePermiso("cancelar_turnos");

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [fecha, setFecha] = useState(() => hoyISO());
  const [vista, setVista] = useState<Vista>("dia");
  const [canchaSemana, setCanchaSemana] = useState(PANEL_CANCHAS[0].id);
  const [turnosPorFecha, setTurnosPorFecha] = useState<Record<string, Turno[]>>({});
  // Si llega desde "Nueva reserva" en la ficha de un cliente (C6), el
  // turno arranca precargado — se lee una sola vez, al montar, del
  // valor inicial de useState (no en un efecto: un setState síncrono
  // ahí dispara un render en cascada que el compiler de React no deja).
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(() => {
    const nombreInicial = searchParams.get("nuevoTurnoNombre");
    const telefonoInicial = searchParams.get("nuevoTurnoTelefono");
    if (!nombreInicial || !telefonoInicial) return null;
    return { tipo: "nuevo", canchaId: PANEL_CANCHAS[0].id, fecha: hoyISO(), nombreInicial, telefonoInicial };
  });
  const [reintento, setReintento] = useState(0);

  // Sin permiso para ver la agenda, no hay nada que mostrar acá — se
  // redirige a Clientes si al menos ese lo tiene, así no queda
  // colgado en una pantalla vacía. Si tampoco tiene ver_clientes, no
  // hay a dónde mandarlo: se queda en blanco (cuenta mal configurada
  // por el dueño, no un flujo que valga la pena resolver más).
  useEffect(() => {
    if (!puedeVerAgenda && puedeVerClientes) router.replace("/panel/clientes");
  }, [puedeVerAgenda, puedeVerClientes, router]);

  const dias = diasVisibles(fecha, vista);
  const canchaSeleccionada = PANEL_CANCHAS.find((c) => c.id === canchaSemana) ?? PANEL_CANCHAS[0];

  // La clave identifica "qué pedido" corresponde al estado visible.
  // Comparándola contra la del último pedido resuelto derivamos si
  // estamos cargando, sin necesitar un setState síncrono al arrancar
  // el efecto (el compiler de React no lo permite: dispara renders
  // en cascada).
  const clave = `${fecha}|${vista}|${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setTurnosPorFecha((prev) => {
        const mapa = { ...prev };
        for (const d of diasVisibles(fecha, vista)) mapa[d] = mockVacio ? [] : turnosDelDia(d);
        return mapa;
      });
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, fecha, vista, mockError, mockVacio]);

  if (bloqueadoPorCaja || !puedeVerAgenda) return <div className="min-h-dvh bg-humo" />;

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
    const canchaId = vista === "dia" ? PANEL_CANCHAS[0].id : canchaSeleccionada.id;
    setPanelAbierto({ tipo: "nuevo", canchaId, fecha: dias[0] });
  }

  function agregarTurno(nuevo: Turno) {
    setTurnosPorFecha((prev) => ({ ...prev, [nuevo.fecha]: [...(prev[nuevo.fecha] ?? []), nuevo] }));
    setPanelAbierto(null);
  }

  function marcarPagado(turno: Turno) {
    setTurnosPorFecha((prev) => ({
      ...prev,
      [turno.fecha]: (prev[turno.fecha] ?? []).map((t) => (t.id === turno.id ? { ...t, estado: "ocupado", seniaPagada: true } : t)),
    }));
    setPanelAbierto(null);
  }

  function cancelarTurno(turno: Turno) {
    setTurnosPorFecha((prev) => ({
      ...prev,
      [turno.fecha]: (prev[turno.fecha] ?? []).map((t) => (t.id === turno.id ? { ...t, estado: "cancelado" } : t)),
    }));
    setPanelAbierto(null);
  }

  function marcarAusente(turno: Turno) {
    setTurnosPorFecha((prev) => ({
      ...prev,
      [turno.fecha]: (prev[turno.fecha] ?? []).map((t) => (t.id === turno.id ? { ...t, estado: "ausente" } : t)),
    }));
    setPanelAbierto(null);
  }

  function deshacerAusencia(turno: Turno) {
    setTurnosPorFecha((prev) => ({
      ...prev,
      [turno.fecha]: (prev[turno.fecha] ?? []).map((t) =>
        t.id === turno.id ? { ...t, estado: t.senia > 0 && !t.seniaPagada ? "pendiente" : "ocupado" } : t,
      ),
    }));
    setPanelAbierto(null);
  }

  function moverTurno(turno: Turno, canchaDestinoId: number) {
    setTurnosPorFecha((prev) => ({
      ...prev,
      [turno.fecha]: (prev[turno.fecha] ?? []).map((t) => (t.id === turno.id ? { ...t, canchaId: canchaDestinoId } : t)),
    }));
    setPanelAbierto(null);
  }

  const columnas: ColumnaTimeline[] =
    vista === "dia"
      ? PANEL_CANCHAS.map((cancha) => ({
          id: cancha.id,
          titulo: cancha.nombre,
          subtitulo: etiquetaDeportes(cancha),
          turnos: (turnosPorFecha[fecha] ?? []).filter((t) => t.canchaId === cancha.id),
          bloqueos: bloqueosDelDia(cancha, fecha),
        }))
      : dias.map((d) => ({
          id: d,
          titulo: `${diaCorto(d)} ${Number(d.slice(-2))}`,
          subtitulo: d === hoyISO() ? "Hoy" : undefined,
          turnos: (turnosPorFecha[d] ?? []).filter((t) => t.canchaId === canchaSeleccionada.id),
          bloqueos: bloqueosDelDia(canchaSeleccionada, d),
        }));

  const diaVacio = vista === "dia" && estadoCarga === "listo" && (turnosPorFecha[fecha] ?? []).length === 0;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

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
                  value={canchaSemana}
                  onChange={(e) => setCanchaSemana(Number(e.target.value))}
                  aria-label="Cancha a mostrar"
                  className="h-10 rounded-full bg-humo px-3.5 text-sm font-semibold text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  {PANEL_CANCHAS.map((c) => (
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

          {estadoCarga === "cargando" && <SkeletonAgenda columnas={vista === "dia" ? PANEL_CANCHAS.length : 7} />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la agenda.</p>
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
                onClickLibre={abrirLibre}
                onClickTurno={(turno) => setPanelAbierto({ tipo: "detalle", turno })}
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
          subtitulo={`${PANEL_CANCHAS.find((c) => c.id === panelAbierto.canchaId)?.nombre} · ${fechaLarga(panelAbierto.fecha)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <FormTurnoRapido
            canchas={PANEL_CANCHAS}
            canchaId={panelAbierto.canchaId}
            fecha={panelAbierto.fecha}
            horaInicial={panelAbierto.hora}
            nombreInicial={panelAbierto.nombreInicial}
            telefonoInicial={panelAbierto.telefonoInicial}
            turnosDelDia={turnosPorFecha[panelAbierto.fecha] ?? []}
            onGuardar={agregarTurno}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "detalle" && (
        <DrawerPanel
          titulo={PANEL_CANCHAS.find((c) => c.id === panelAbierto.turno.canchaId)?.nombre ?? ""}
          subtitulo={`${panelAbierto.turno.horaInicio}–${panelAbierto.turno.horaFin} · ${fechaLarga(panelAbierto.turno.fecha)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <DetalleTurno
            turno={panelAbierto.turno}
            cancha={PANEL_CANCHAS.find((c) => c.id === panelAbierto.turno.canchaId)!}
            canchasCompatibles={canchasCompatibles(PANEL_CANCHAS.find((c) => c.id === panelAbierto.turno.canchaId))}
            puedeCobrar={puedeCobrarTurnos}
            puedeCancelar={puedeCancelarTurnos}
            esDueno={rol === "dueno"}
            onMarcarPagado={() => marcarPagado(panelAbierto.turno)}
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
