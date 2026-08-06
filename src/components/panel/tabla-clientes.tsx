import Link from "next/link";
import { Ban, ChevronDown, ChevronUp, ChevronsUpDown, Star } from "lucide-react";
import { AUSENCIAS_ALTAS, type Cliente } from "@/mocks/clientes";

export type ColumnaOrdenable = "reservasTotales" | "ultimaReserva" | "ausencias";
export type Orden = { columna: ColumnaOrdenable; direccion: "asc" | "desc" };

/** "29/07" — compacto para la tabla. */
function fechaCorta(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;
}

const COLUMNAS = "grid-cols-[1.6fr_1.2fr_1fr_1fr_1fr]";

function EncabezadoOrdenable({
  columna,
  etiqueta,
  orden,
  onOrdenar,
}: {
  columna: ColumnaOrdenable;
  etiqueta: string;
  orden: Orden | null;
  onOrdenar: (columna: ColumnaOrdenable) => void;
}) {
  const activa = orden?.columna === columna;
  const Icono = activa ? (orden.direccion === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={() => onOrdenar(columna)}
      className={`flex items-center gap-1 transition-colors hover:text-tinta ${activa ? "text-tinta" : ""}`}
    >
      {etiqueta}
      <Icono className="size-3.5" aria-hidden />
    </button>
  );
}

/**
 * Densa, de escritorio, sin bordes en todos lados — se separa por
 * fondo alternado + hover (Parte 10). Cada fila es un Link entero a
 * la ficha (C6), no un div con onClick: así ctrl+click / abrir en
 * pestaña nueva funcionan como en cualquier link real.
 */
export function TablaClientes({ clientes, orden, onOrdenar }: { clientes: Cliente[]; orden: Orden | null; onOrdenar: (columna: ColumnaOrdenable) => void }) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Teléfono</span>
        <EncabezadoOrdenable columna="reservasTotales" etiqueta="Reservas" orden={orden} onOrdenar={onOrdenar} />
        <EncabezadoOrdenable columna="ultimaReserva" etiqueta="Última reserva" orden={orden} onOrdenar={onOrdenar} />
        <EncabezadoOrdenable columna="ausencias" etiqueta="Ausencias" orden={orden} onOrdenar={onOrdenar} />
      </div>

      <div className="divide-y divide-borde/60">
        {clientes.map((cliente) => {
          const ausenciasAltas = cliente.ausencias >= AUSENCIAS_ALTAS;
          return (
            <Link
              key={cliente.id}
              href={`/panel/clientes/${cliente.id}`}
              className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4 transition-colors hover:bg-humo/60`}
            >
              <span className="flex min-w-0 items-center gap-1.5 font-display text-sm font-bold text-tinta">
                <span className={`truncate ${cliente.bloqueado ? "text-grafito line-through" : ""}`}>{cliente.nombre}</span>
                {cliente.esFrecuente && <Star className="size-3.5 shrink-0 fill-current text-disponible" aria-label="Cliente frecuente" />}
                {cliente.bloqueado && <Ban className="size-3.5 shrink-0 text-cancelado" aria-label="Jugador bloqueado" />}
              </span>
              <span className="text-sm text-grafito">{cliente.telefono}</span>
              <span className="text-sm text-tinta">{cliente.reservasTotales}</span>
              <span className="text-sm text-tinta">{fechaCorta(cliente.ultimaReserva)}</span>
              <span>
                {ausenciasAltas ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pendiente-suave px-2 py-0.5 text-xs font-semibold text-pendiente">
                    {cliente.ausencias}
                  </span>
                ) : (
                  <span className="text-sm text-grafito">{cliente.ausencias}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
