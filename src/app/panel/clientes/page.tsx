"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Ban, ChevronLeft, ChevronRight, Download, Search, Users } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaClientes, type ColumnaOrdenable, type Orden } from "@/components/panel/tabla-clientes";
import { SkeletonClientes } from "@/components/panel/skeleton-clientes";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { clientes as endpointClientes } from "@/lib/api/endpoints/clientes";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { ClienteResponse } from "@/lib/api/tipos/clientes";

type EstadoCarga = "cargando" | "error" | "listo";

// Descendente por defecto para las tres columnas ordenables: "más reservas",
// "más reciente" y "más ausencias" leen naturalmente de mayor a menor. Un
// segundo click sobre la misma columna invierte.
const DIRECCION_POR_DEFECTO: Record<ColumnaOrdenable, "asc" | "desc"> = {
  reservasTotales: "desc",
  ultimaReserva: "desc",
  ausencias: "desc",
};

const POR_PAGINA = 20;

/** Tope del barrido del export: 20 páginas de 100 = 2000 clientes. */
const PAGINAS_MAXIMAS_EXPORT = 20;

function descargarCSV(clientes: ClienteResponse[]) {
  const filas = [
    ["Nombre", "Teléfono", "Email", "Reservas", "Última reserva", "Ausencias", "Total gastado", "Bloqueado"],
    ...clientes.map((c) => [
      c.nombre,
      c.telefono ?? "",
      c.email,
      String(c.reservasTotales),
      c.ultimaReserva?.slice(0, 10) ?? "",
      String(c.ausencias),
      String(c.totalGastado),
      c.bloqueado ? "Sí" : "No",
    ]),
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

/**
 * Padrón de clientes del complejo.
 *
 * Buscar, ordenar y paginar los resuelve el BACKEND, no el front: el listado
 * viene paginado (20 por página) y filtrar del lado del cliente sólo miraría la
 * página actual, o sea que "no encontrado" podría significar "está en la
 * página 3".
 *
 * Es OWNER/ADMIN puro: el ClienteController entero es
 * @PreAuthorize("hasAnyRole('OWNER','ADMIN')") — no hay ningún PermisoEmpleado
 * que lo habilite. Por eso el gate pasó de `ver_clientes` (un permiso del mock
 * que el backend no tiene) al rol.
 */
export default function PanelClientes() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const { establecimientoId } = useEstablecimientoActivo();

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [soloBloqueados, setSoloBloqueados] = useState(false);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  // Cada tecla no puede ser una request. Se espera a que la persona deje de
  // escribir y recién ahí se consulta; volver a la página 0 es parte del mismo
  // cambio de búsqueda.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(0);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  const filtros = {
    buscar: busquedaAplicada || undefined,
    soloBloqueados,
    orden: orden?.columna,
    direccion: orden?.direccion,
    page: pagina,
  };

  const consulta = useQuery({
    queryKey: keys.clientes.lista(establecimientoId ?? 0, filtros),
    queryFn: () => endpointClientes.listar(establecimientoId!, { ...filtros, size: POR_PAGINA }),
    enabled: establecimientoId !== null,
  });

  /**
   * El export barre TODAS las páginas con los filtros puestos: bajar sólo lo
   * que se ve en pantalla sería un CSV de 20 filas presentado como "los
   * clientes".
   */
  const exportar = useMutation({
    mutationFn: async () => {
      const todos: ClienteResponse[] = [];
      for (let page = 0; page < PAGINAS_MAXIMAS_EXPORT; page++) {
        const respuesta = await endpointClientes.listar(establecimientoId!, { ...filtros, page, size: 100 });
        todos.push(...respuesta.content);
        if (respuesta.last) break;
      }
      return todos;
    },
    onSuccess: descargarCSV,
  });

  const estadoCarga: EstadoCarga = consulta.isPending ? "cargando" : consulta.isError ? "error" : "listo";

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function ordenar(columna: ColumnaOrdenable) {
    setOrden((prev) =>
      prev?.columna === columna
        ? { columna, direccion: prev.direccion === "asc" ? "desc" : "asc" }
        : { columna, direccion: DIRECCION_POR_DEFECTO[columna] },
    );
    setPagina(0);
  }

  const datos = consulta.data;
  const hayFiltro = busquedaAplicada !== "" || soloBloqueados;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Clientes</h1>
            <button
              type="button"
              onClick={() => exportar.mutate()}
              disabled={exportar.isPending || datos?.totalElements === 0}
              className="flex h-10 items-center gap-1.5 rounded-full border border-borde bg-white px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
            >
              <Download className="size-4" aria-hidden />
              {exportar.isPending ? "Preparando..." : "Exportar CSV"}
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grafito" aria-hidden />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono o email"
                aria-label="Buscar clientes"
                className="w-full rounded-full bg-humo py-2.5 pl-10 pr-4 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSoloBloqueados((v) => !v);
                setPagina(0);
              }}
              aria-pressed={soloBloqueados}
              className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                soloBloqueados ? "bg-cancelado-suave text-cancelado" : "bg-humo text-grafito hover:text-tinta"
              }`}
            >
              <Ban className="size-4 shrink-0" aria-hidden />
              Solo bloqueados
            </button>
          </div>

          {exportar.isError && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              No pudimos preparar el CSV. Probá de nuevo.
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonClientes />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los clientes.</p>
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
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              {hayFiltro ? (
                <>
                  <Search className="size-8 text-grafito" aria-hidden />
                  <p className="font-display font-bold text-tinta">Ningún cliente coincide con la búsqueda</p>
                  <p className="max-w-xs text-sm text-grafito">Probá con otro nombre, teléfono o email.</p>
                </>
              ) : (
                <>
                  <Users className="size-8 text-grafito" aria-hidden />
                  <p className="font-display font-bold text-tinta">Todavía no tenés clientes</p>
                  {/* Es la aclaración importante de esta pantalla: el padrón son
                      jugadores con cuenta. Un complejo que carga todo a mano
                      desde la agenda la va a ver vacía para siempre si no. */}
                  <p className="max-w-sm text-sm text-grafito">
                    Acá aparecen los jugadores con cuenta que reservaron en tu complejo. Los turnos que cargás a
                    mano desde la agenda no crean un cliente: no tienen a quién atribuirse.
                  </p>
                </>
              )}
            </div>
          )}

          {estadoCarga === "listo" && datos && datos.content.length > 0 && (
            <div className="space-y-4">
              <TablaClientes clientes={datos.content} orden={orden} onOrdenar={ordenar} />

              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <p className="text-sm text-grafito">
                  {datos.totalElements} {datos.totalElements === 1 ? "cliente" : "clientes"}
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
        </main>
      </div>
    </div>
  );
}
