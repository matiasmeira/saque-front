import { Phone, Star } from "lucide-react";

import { formatearPrecio } from "@/lib/formato";
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";

/**
 * Panel de precios del complejo: aside pegajoso en desktop, barra fija en mobile.
 *
 * CAMBIO respecto del mock: antes era un SEGUNDO selector de fecha/cancha/hora,
 * en paralelo al de la grilla, con su propio estado. Con disponibilidad real
 * eso significaría duplicar la consulta y poder mostrar dos verdades distintas
 * sobre los mismos turnos. Ahora la grilla es el único lugar donde se elige, y
 * este panel informa y lleva hasta ella.
 *
 * Server Component: sólo ancla con href, no necesita estado.
 */
export function ReservaBlock({ complejo }: { complejo: ComplejoDetalleResponse }) {
  const calificacion = complejo.promedioCalificacion;

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-card bg-white p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-grafito">Desde</span>
            <span className="font-display text-2xl font-bold text-tinta">
              {complejo.precioDesde !== null ? formatearPrecio(complejo.precioDesde) : "—"}
            </span>
          </div>

          {complejo.requiereSena && complejo.senaDesde !== null && (
            <p className="mt-1 text-sm text-grafito">
              Reservás con una seña desde {formatearPrecio(complejo.senaDesde)}
            </p>
          )}

          {complejo.requiereTelefonoVerificado && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-grafito">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              Exige celular verificado para reservar
            </p>
          )}

          {calificacion !== null && (
            <div className="mt-4 flex items-center gap-1.5 text-sm text-grafito">
              <Star className="size-4 shrink-0 fill-current text-pendiente" aria-hidden />
              <span className="font-semibold text-tinta">{calificacion.toFixed(1)}</span>
              <span>
                ({complejo.cantidadCalificaciones}{" "}
                {complejo.cantidadCalificaciones === 1 ? "opinión" : "opiniones"})
              </span>
            </div>
          )}

          {complejo.comentarioDestacado && (
            <blockquote className="mt-4 border-l-2 border-celeste pl-3 text-sm leading-relaxed text-grafito">
              &ldquo;{complejo.comentarioDestacado.comentario}&rdquo;
              <footer className="mt-1 text-xs">
                — {complejo.comentarioDestacado.jugadorNombre ?? "Un jugador"}
              </footer>
            </blockquote>
          )}

          <a
            href="#canchas"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Ver turnos disponibles
          </a>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-borde bg-white p-4 lg:hidden">
        <div className="flex flex-col">
          <span className="text-xs text-grafito">Desde</span>
          <span className="font-display text-lg font-bold text-tinta">
            {complejo.precioDesde !== null ? formatearPrecio(complejo.precioDesde) : "—"}
          </span>
        </div>
        <a
          href="#canchas"
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Ver turnos
        </a>
      </div>
    </>
  );
}
