import Link from "next/link";
import { Navigation } from "lucide-react";
import { TimeChip } from "@/components/saque/time-chip";
import { StatusBadge } from "@/components/saque/status-badge";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { formatearPrecio } from "@/lib/formato";
import { DEPORTES } from "@/mocks/deportes";
import type { Complejo } from "@/mocks/complejos";

/**
 * La tarjeta de resultado. Server Component: TimeChip navega por
 * "href", no por onClick, así que no hace falta "use client" acá
 * ni en la grilla que la contiene.
 *
 * Decisión crítica de la Parte 9 (A2): los chips de horario SON el
 * CTA — tocar "20:30" entra directo al checkout con el turno
 * preseleccionado. No hay un botón "Ver complejo" compitiendo.
 */
const MAX_HORARIOS_VISIBLES = 3;

function abreviaturaDeporte(valor: string) {
  return DEPORTES.find((d) => d.valor === valor)?.abreviatura ?? valor;
}

function formatearDistancia(km: number) {
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function VenueCard({
  complejo,
  momentoLabel,
  fecha,
}: {
  complejo: Complejo;
  /** Ej. "Hoy a la noche" — eyebrow arriba de los horarios */
  momentoLabel: string;
  /** Fecha buscada (ISO), viaja al checkout junto con la hora elegida */
  fecha: string;
}) {
  const sinDisponibilidad = complejo.horarios.length === 0;
  const horariosVisibles = complejo.horarios.slice(0, MAX_HORARIOS_VISIBLES);
  const restantes = complejo.horarios.length - horariosVisibles.length;

  return (
    <article className={`overflow-hidden rounded-card ${sinDisponibilidad ? "bg-humo" : "bg-white"}`}>
      <div className="flex flex-col md:flex-row">
        <div className="relative aspect-video shrink-0 overflow-hidden bg-tinta md:aspect-auto md:w-2/5">
          <LineasDeCancha className={sinDisponibilidad ? "opacity-[0.1] grayscale" : "opacity-[0.16]"} />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-tinta">{complejo.nombre}</h3>
              <div className="flex shrink-0 gap-1">
                {complejo.deportes.map((valor) => (
                  <span
                    key={valor}
                    className="rounded-md bg-celeste-suave px-2 py-1 text-[10px] font-bold uppercase text-azul"
                  >
                    {abreviaturaDeporte(valor)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-1.5 text-sm text-grafito">
              <Navigation className="size-4 shrink-0" aria-hidden />
              <span>
                {formatearDistancia(complejo.distanciaKm)} · {complejo.direccion}
              </span>
            </div>

            {sinDisponibilidad ? (
              <StatusBadge estado="ocupado" label="Sin turnos hoy" />
            ) : (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-grafito">{momentoLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {horariosVisibles.map((hora) => (
                    <TimeChip
                      key={hora}
                      hora={hora}
                      href={`/reservar/${complejo.id}?fecha=${fecha}&hora=${hora}`}
                    />
                  ))}
                  {restantes > 0 && (
                    <Link
                      href={`/complejo/${complejo.slug}`}
                      className="inline-flex h-11 min-w-[54px] items-center justify-center rounded-input border border-borde px-3 text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
                    >
                      +{restantes}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between border-t border-borde pt-3">
            <div className="flex flex-col">
              <span className="text-xs text-grafito">Desde</span>
              <span className="font-display text-lg font-bold text-tinta">{formatearPrecio(complejo.desde)}</span>
            </div>

            {sinDisponibilidad ? (
              <Link
                href={`/complejo/${complejo.slug}`}
                className="inline-flex h-9 items-center rounded-full border border-azul px-4 text-xs font-semibold text-azul transition-colors hover:bg-azul hover:text-white"
              >
                Avisame si se libera
              </Link>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs text-grafito">Seña</span>
                <span className="font-display text-base font-semibold text-grafito">
                  {formatearPrecio(complejo.senia)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
