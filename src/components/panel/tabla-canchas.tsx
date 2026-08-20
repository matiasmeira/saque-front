import { Pencil, PowerOff, Wrench } from "lucide-react";
import { DEPORTES } from "@/lib/deportes";
import { esCompuesta, type Cancha } from "@/lib/panel/canchas";
import { formatearPrecio } from "@/lib/formato";
import { hoyISO } from "@/lib/fecha";

function ChipDeporte({ valor }: { valor: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-humo px-2 py-0.5 text-[11px] font-semibold text-tinta">
      {DEPORTES.find((d) => d.valor === valor)?.abreviatura ?? valor}
    </span>
  );
}

/**
 * Los nombres de las canchas físicas se resuelven contra el listado real que
 * recibe la tabla, no contra el mock: una compuesta cuyas partes no estén en la
 * lista (por ejemplo, dadas de baja) cae al `#id`, que es información honesta.
 */
function Composicion({ cancha, canchas }: { cancha: Cancha; canchas: Cancha[] }) {
  if (!esCompuesta(cancha)) {
    return <span className="text-sm text-grafito">Física</span>;
  }
  const nombres = cancha.canchasFisicas.map((id) => canchas.find((c) => c.id === id)?.nombre ?? `#${id}`);
  return (
    <span className="text-sm text-tinta">
      Usa {cancha.canchasNecesarias} de {cancha.canchasFisicas.length}
      <span className="block text-[11px] text-grafito">({nombres.join(", ")})</span>
    </span>
  );
}

/** "29/07" — compacto para la fila de la tabla (el drawer muestra fecha y hora completas). */
function fechaCorta(datetimeLocal: string): string {
  return `${datetimeLocal.slice(8, 10)}/${datetimeLocal.slice(5, 7)}`;
}

/**
 * Dos mecanismos, dos badges separados y visualmente distintos —
 * nunca se mezclan en uno solo, porque para el dueño son cosas
 * distintas: Activa/Inactiva es indefinido ("no la uso"), Mantenimiento
 * es temporal y programado ("no está disponible estos días", vuelve
 * sola). El verde/gris es el mismo lenguaje de "estado permanente" que
 * ya usa esta pantalla; el ámbar es el mismo que la agenda (C2) usa
 * para "necesita atención" — acá, un bloqueo con fecha.
 */
function CeldaEstado({ cancha }: { cancha: Cancha }) {
  const bloqueosVigentes = cancha.mantenimientos.filter((b) => b.hasta.slice(0, 10) >= hoyISO());

  return (
    <div className="space-y-1">
      {cancha.isActive ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-disponible-suave px-2.5 py-1 text-xs font-semibold text-disponible">
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          Activa
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocupado-suave px-2.5 py-1 text-xs font-semibold text-grafito">
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          Inactiva
        </span>
      )}
      {bloqueosVigentes.map((b, i) => (
        <span key={i} className="flex items-center gap-1 text-[11px] font-semibold text-pendiente">
          <Wrench className="size-3 shrink-0" aria-hidden />
          {fechaCorta(b.desde)}–{fechaCorta(b.hasta)}
        </span>
      ))}
    </div>
  );
}

const COLUMNAS = "grid-cols-[1.2fr_1fr_1fr_1.2fr_1.6fr_0.9fr_auto]";

/**
 * Lista de canchas del complejo, físicas y compuestas mezcladas. Un
 * solo contenedor, sin borde exterior: las filas se separan con un
 * divisor casi invisible (divide-borde/60) y hover sutil, nunca un
 * borde grueso (Parte 10: los contenedores con borde de 1px en todos
 * lados son la primera señal de pantalla genérica).
 */
export function TablaCanchas({
  canchas,
  onEditar,
  onDesactivar,
}: {
  canchas: Cancha[];
  onEditar: (cancha: Cancha) => void;
  onDesactivar: (cancha: Cancha) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Deportes</span>
        <span>Precio / seña</span>
        <span>Duración</span>
        <span>Composición</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {canchas.map((cancha) => (
          <div key={cancha.id} className={`grid ${COLUMNAS} items-center gap-3 px-6 py-4 transition-colors hover:bg-humo/60`}>
            <span className="font-display text-sm font-bold text-tinta">{cancha.nombre}</span>

            <span className="flex flex-wrap gap-1">
              {cancha.deportes.map((d) => (
                <ChipDeporte key={d} valor={d} />
              ))}
            </span>

            <span className="text-sm text-tinta">
              {cancha.preciosBase.length > 1 ? "Desde " : ""}
              {formatearPrecio(Math.min(...cancha.preciosBase.map((p) => p.precio)))}
              <span className="block text-[11px] text-grafito">
                {cancha.montoSena > 0 ? `Seña ${formatearPrecio(cancha.montoSena)}` : "Sin seña"}
              </span>
            </span>

            <span className="text-sm text-tinta">
              {cancha.duracionesPermitidas.join(", ")} min
              {cancha.permiteInicioMediaHora && <span className="block text-[11px] text-grafito">Admite media hora</span>}
            </span>

            <Composicion cancha={cancha} canchas={canchas} />
            <CeldaEstado cancha={cancha} />

            <div className="flex items-center gap-1 justify-self-end">
              <button
                type="button"
                onClick={() => onEditar(cancha)}
                aria-label={`Editar ${cancha.nombre}`}
                className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDesactivar(cancha)}
                aria-label={`Desactivar ${cancha.nombre}`}
                className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <PowerOff className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
