"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Calendar, Mail, Phone, Plus, Star } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { StatusBadge } from "@/components/saque/status-badge";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_CANCHAS } from "@/mocks/canchas";
import { historialDeClienteId, PANEL_CLIENTES, totalGastado, type Cliente } from "@/mocks/clientes";

function StatCard({ etiqueta, valor, resaltado }: { etiqueta: string; valor: string; resaltado?: boolean }) {
  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className={`mt-1.5 font-display text-3xl font-extrabold tabular-nums ${resaltado ? "text-pendiente" : "text-tinta"}`}>{valor}</p>
    </div>
  );
}

// TODO backend: cliente e historial vienen de la API, historial paginado.
export default function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const puedeVerClientes = tienePermiso("ver_clientes");
  const clienteId = Number(id);

  const [cliente, setCliente] = useState<Cliente | undefined>(() => PANEL_CLIENTES.find((c) => c.id === clienteId));

  // Simulación breve de carga, mismo espíritu que el resto del panel
  // — acá sin estado de error propio: si no existe el cliente, es un
  // 404, no una falla de red que tenga sentido reintentar.
  const [cargado, setCargado] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setCargado(true), 300);
    return () => clearTimeout(id);
  }, []);

  // Esconder el link en la lista (C5) no alcanza: la ficha de un
  // cliente puntual tiene su propia URL, y sin este chequeo cualquiera
  // que la escriba a mano entraba igual, tenga o no ver_clientes.
  useEffect(() => {
    if (!puedeVerClientes) router.replace("/panel/clientes");
  }, [puedeVerClientes, router]);

  if (bloqueadoPorCaja || !puedeVerClientes) return <div className="min-h-dvh bg-humo" />;

  const historial = cliente ? historialDeClienteId(cliente.id) : [];

  function alternarFrecuente() {
    setCliente((prev) => (prev ? { ...prev, esFrecuente: !prev.esFrecuente } : prev));
  }

  function registrarAusencia() {
    setCliente((prev) => (prev ? { ...prev, ausencias: prev.ausencias + 1 } : prev));
  }

  function alternarBloqueado() {
    setCliente((prev) => (prev ? { ...prev, bloqueado: !prev.bloqueado } : prev));
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <Link href="/panel/clientes" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul">
            <ArrowLeft className="size-4" aria-hidden />
            Volver a Clientes
          </Link>

          {!cliente ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-card bg-white py-20 text-center shadow-card">
              <p className="font-display text-lg font-bold text-tinta">No encontramos ese cliente</p>
              <p className="text-sm text-grafito">El link puede estar mal, o el cliente ya no existe.</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              <div className="rounded-card bg-white p-6 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-tinta">
                      {cliente.nombre}
                      {cliente.esFrecuente && <Star className="size-4 fill-current text-disponible" aria-label="Cliente frecuente" />}
                      {cliente.bloqueado && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cancelado-suave px-2.5 py-1 text-xs font-semibold text-cancelado">
                          <Ban className="size-3.5 shrink-0" aria-hidden />
                          Bloqueado
                        </span>
                      )}
                    </h1>
                    <div className="mt-2 space-y-1 text-sm text-grafito">
                      <p className="flex items-center gap-2">
                        <Phone className="size-4 shrink-0" aria-hidden />
                        <a href={`tel:${cliente.telefono}`} className="text-azul hover:underline">
                          {cliente.telefono}
                        </a>
                      </p>
                      {cliente.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="size-4 shrink-0" aria-hidden />
                          <a href={`mailto:${cliente.email}`} className="text-azul hover:underline">
                            {cliente.email}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/panel/agenda?nuevoTurnoNombre=${encodeURIComponent(cliente.nombre)}&nuevoTurnoTelefono=${encodeURIComponent(cliente.telefono)}`}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    <Plus className="size-4" aria-hidden />
                    Nueva reserva
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-humo pt-6">
                  <button
                    type="button"
                    onClick={alternarFrecuente}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    <Star className={`size-4 ${cliente.esFrecuente ? "fill-current text-disponible" : ""}`} aria-hidden />
                    {cliente.esFrecuente ? "Quitar de frecuentes" : "Marcar como frecuente"}
                  </button>
                  <button
                    type="button"
                    onClick={registrarAusencia}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
                  >
                    Registrar ausencia
                  </button>
                  {rol === "dueno" && (
                    <button
                      type="button"
                      onClick={alternarBloqueado}
                      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                        cliente.bloqueado
                          ? "border-borde text-tinta hover:bg-humo"
                          : "border-cancelado text-cancelado hover:bg-cancelado-suave"
                      }`}
                    >
                      <Ban className="size-4 shrink-0" aria-hidden />
                      {cliente.bloqueado ? "Desbloquear jugador" : "Bloquear jugador"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatCard etiqueta="Total gastado" valor={formatearPrecio(totalGastado(cliente.id))} />
                <StatCard etiqueta="Reservas totales" valor={String(cliente.reservasTotales)} />
                <StatCard etiqueta="Ausencias" valor={String(cliente.ausencias)} resaltado={cliente.ausencias > 0} />
              </div>

              <div className="rounded-card bg-white p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-tinta">Historial de reservas</h2>

                {!cargado ? (
                  <div className="mt-4 animate-pulse space-y-2">
                    <div className="h-12 w-full rounded bg-humo" />
                    <div className="h-12 w-full rounded bg-humo" />
                  </div>
                ) : historial.length === 0 ? (
                  <p className="mt-3 text-sm text-grafito">Todavía no tiene reservas registradas.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {historial.map((h) => {
                      const cancha = PANEL_CANCHAS.find((c) => c.id === h.canchaId);
                      return (
                        <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 rounded-input bg-humo p-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="size-4 shrink-0 text-grafito" aria-hidden />
                            <div>
                              <p className="text-sm font-semibold text-tinta">{fechaLarga(h.fecha)}</p>
                              <p className="text-xs text-grafito">{cancha?.nombre ?? "Cancha"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge estado={h.estado} />
                            <span className="text-sm font-semibold text-tinta">{formatearPrecio(h.monto)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
