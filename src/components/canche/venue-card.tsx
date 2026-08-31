import Link from "next/link";
import { Navigation, Star } from "lucide-react";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";
import { formatearPrecio } from "@/lib/formato";
import { abreviaturaDeporte } from "@/lib/deportes";
import type { ComplejoCardResponse } from "@/lib/api/tipos/publico";

/**
 * La tarjeta de resultado. Server Component: navega por "href", no por
 * onClick, así que no hace falta "use client" acá ni en la grilla.
 *
 * CAMBIO respecto del mock: antes los chips de horario eran el CTA — tocar
 * "20:30" entraba directo al checkout. `ComplejoCardResponse` no trae los
 * horarios libres, y traerlos significaría un request de disponibilidad por
 * cada card (N+1). El CTA pasa a ser la card entera, que lleva al detalle,
 * donde la grilla real sí está disponible en una sola llamada.
 *
 * Efecto lateral bueno: el link viejo iba a /reservar/{id}?fecha&hora SIN el
 * parámetro `cancha`, y el checkout lo rechazaba.
 */
function formatearDistancia(km: number) {
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function VenueCard({ complejo }: { complejo: ComplejoCardResponse }) {
  const calificacion = complejo.promedioCalificacion;

  return (
    <article className="overflow-hidden rounded-card bg-white transition-shadow hover:shadow-lg">
      <Link href={`/complejo/${complejo.slug}`} className="flex flex-col md:flex-row">
        <div className="relative aspect-video shrink-0 overflow-hidden bg-tinta md:aspect-auto md:w-2/5">
          {complejo.fotoPrincipal ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={complejo.fotoPrincipal}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <LineasDeCancha className="opacity-[0.16]" />
          )}
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

            <div className="mb-3 flex items-center gap-1.5 text-sm text-grafito">
              <Navigation className="size-4 shrink-0" aria-hidden />
              <span>
                {/* distanciaKm sólo viene si la búsqueda incluyó lat y lng. */}
                {complejo.distanciaKm !== null && `${formatearDistancia(complejo.distanciaKm)} · `}
                {complejo.direccion}
              </span>
            </div>

            {calificacion !== null && (
              <div className="flex items-center gap-1.5 text-sm text-grafito">
                <Star className="size-4 shrink-0 fill-current text-pendiente" aria-hidden />
                <span className="font-semibold text-tinta">{calificacion.toFixed(1)}</span>
                <span>
                  ({complejo.cantidadCalificaciones}{" "}
                  {complejo.cantidadCalificaciones === 1 ? "opinión" : "opiniones"})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between border-t border-borde pt-3">
            <div className="flex flex-col">
              <span className="text-xs text-grafito">Desde</span>
              <span className="font-display text-lg font-bold text-tinta">
                {complejo.precioDesde !== null ? formatearPrecio(complejo.precioDesde) : "—"}
              </span>
            </div>

            {complejo.requiereSena && complejo.senaDesde !== null && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-grafito">Seña desde</span>
                <span className="font-display text-base font-semibold text-grafito">
                  {formatearPrecio(complejo.senaDesde)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
