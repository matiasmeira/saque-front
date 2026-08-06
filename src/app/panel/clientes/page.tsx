"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Download, Search, Users } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaClientes, type ColumnaOrdenable, type Orden } from "@/components/panel/tabla-clientes";
import { SkeletonClientes } from "@/components/panel/skeleton-clientes";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_CLIENTES, type Cliente } from "@/mocks/clientes";

type EstadoCarga = "cargando" | "error" | "listo";

// Descendente por defecto para las tres columnas ordenables: "más
// reservas", "más reciente" y "más ausencias" leen naturalmente de
// mayor a menor. Un segundo click sobre la misma columna invierte.
const DIRECCION_POR_DEFECTO: Record<ColumnaOrdenable, "asc" | "desc"> = {
  reservasTotales: "desc",
  ultimaReserva: "desc",
  ausencias: "desc",
};

function descargarCSV(clientes: Cliente[]) {
  const filas = [
    ["Nombre", "Teléfono", "Reservas totales", "Última reserva", "Ausencias", "Frecuente"],
    ...clientes.map((c) => [c.nombre, c.telefono, String(c.reservasTotales), c.ultimaReserva, String(c.ausencias), c.esFrecuente ? "Sí" : "No"]),
  ];
  const csv = filas.map((fila) => fila.map((valor) => `"${valor.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clientes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo patrón que
// el resto del panel. TODO backend: clientes vienen de la API,
// paginados y ordenados server-side.
export default function PanelClientes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const puedeVerClientes = tienePermiso("ver_clientes");
  const puedeVerAgenda = tienePermiso("ver_agenda");

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden | null>(null);
  const [reintento, setReintento] = useState(0);

  // Mismo criterio que en Agenda: si no tiene ver_clientes pero sí
  // ve la agenda, lo mandamos ahí en vez de dejarlo en una pantalla
  // vacía.
  useEffect(() => {
    if (!puedeVerClientes && puedeVerAgenda) router.replace("/panel/agenda");
  }, [puedeVerClientes, puedeVerAgenda, router]);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setClientes(mockVacio ? [] : PANEL_CLIENTES.map((c) => ({ ...c })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  if (bloqueadoPorCaja || !puedeVerClientes) return <div className="min-h-dvh bg-humo" />;

  function ordenar(columna: ColumnaOrdenable) {
    setOrden((prev) => (prev?.columna === columna ? { columna, direccion: prev.direccion === "asc" ? "desc" : "asc" } : { columna, direccion: DIRECCION_POR_DEFECTO[columna] }));
  }

  const filtrados = clientes.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q) || c.telefono.includes(q);
  });

  const ordenados = orden
    ? [...filtrados].sort((a, b) => {
        const signo = orden.direccion === "asc" ? 1 : -1;
        if (a[orden.columna] < b[orden.columna]) return -1 * signo;
        if (a[orden.columna] > b[orden.columna]) return 1 * signo;
        return 0;
      })
    : filtrados;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Clientes</h1>
            {rol === "dueno" && (
              <button
                type="button"
                onClick={() => descargarCSV(ordenados)}
                className="flex h-10 items-center gap-1.5 rounded-full border border-borde bg-white px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Download className="size-4" aria-hidden />
                Exportar CSV
              </button>
            )}
          </div>

          <div className="relative mb-6 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grafito" aria-hidden />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              aria-label="Buscar clientes"
              className="w-full rounded-full bg-humo py-2.5 pl-10 pr-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
          </div>

          {estadoCarga === "cargando" && <SkeletonClientes />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los clientes.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && clientes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Users className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no tenés clientes cargados</p>
              <p className="max-w-xs text-sm text-grafito">
                Van a aparecer acá apenas alguien reserve, o cuando cargues un turno a mano desde la agenda.
              </p>
            </div>
          )}

          {estadoCarga === "listo" && clientes.length > 0 && ordenados.length === 0 && (
            <div className="rounded-card bg-white py-16 text-center text-sm text-grafito shadow-card">
              Ningún cliente coincide con &ldquo;{busqueda}&rdquo;.
            </div>
          )}

          {estadoCarga === "listo" && ordenados.length > 0 && <TablaClientes clientes={ordenados} orden={orden} onOrdenar={ordenar} />}
        </main>
      </div>
    </div>
  );
}
