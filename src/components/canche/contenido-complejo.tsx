import { MapPin, Navigation } from "lucide-react";

import { GaleriaFotos } from "@/components/canche/galeria-fotos";
import { GrillaDisponibilidad, type FuenteDisponibilidad } from "@/components/canche/grilla-disponibilidad";
import { ReservaBlock } from "@/components/canche/reserva-block";
import { MapaComplejo } from "@/components/canche/mapa-complejo";
import { etiquetaDeporte } from "@/lib/deportes";
import { servicio as buscarServicio } from "@/lib/servicios";
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";

/**
 * Cuerpo de la ficha de un complejo: galería, deportes, nombre, dirección,
 * canchas, servicios, cómo llegar y el bloque de reserva. Lo comparten la
 * ficha pública (/complejo/[slug]) y las previsualizaciones de panel/admin
 * (GET /establecimientos/{id}/previsualizacion trae el mismo
 * ComplejoDetalleResponse) — mismos componentes, mismas props, mismo orden,
 * mismos estados vacíos. Lo que es sólo de la página pública (header,
 * footer, JSON-LD, metadata) NO vive acá: lo arma quien monta este
 * componente.
 */
export function ContenidoComplejo({
  complejo,
  fuenteGrilla,
  nivelTitulo = "h1",
}: {
  complejo: ComplejoDetalleResponse;
  fuenteGrilla: FuenteDisponibilidad;
  /**
   * La ficha pública usa <h1>: el nombre del complejo es el título de esa
   * página. La previsualización de panel ya tiene su propio <h1>
   * ("Previsualización"), así que pasa "h2" para no terminar con dos <h1>.
   */
  nivelTitulo?: "h1" | "h2";
}) {
  const Titulo = nivelTitulo;

  return (
    <>
      <GaleriaFotos fotos={complejo.fotos} nombreComplejo={complejo.nombre} />

      <div className="mx-auto w-full max-w-7xl px-5 py-10 pb-56 sm:px-8 lg:px-10 lg:pb-16">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {complejo.deportes.map((valor) => (
            <span
              key={valor}
              className="rounded-full border border-borde bg-white px-3 py-1 text-sm text-grafito"
            >
              {etiquetaDeporte(valor)}
            </span>
          ))}
        </div>

        <Titulo className="font-display text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.02em] text-tinta sm:text-[3.5rem]">
          {complejo.nombre}
        </Titulo>

        <div className="mt-3 flex items-center gap-1.5 text-grafito">
          <MapPin className="size-[18px] shrink-0" aria-hidden />
          <p>{complejo.direccion}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <section id="canchas" className="scroll-mt-24">
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Canchas
              </h2>
              <GrillaDisponibilidad complejo={complejo} fuente={fuenteGrilla} />
            </section>

            {complejo.servicios.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                  Servicios
                </h2>
                <div className="flex flex-wrap gap-2">
                  {complejo.servicios.map((valor) => {
                    const servicio = buscarServicio(valor);
                    const Icono = servicio?.Icono;
                    return (
                      <span
                        key={valor}
                        className="inline-flex items-center gap-2 rounded-full border border-borde bg-white px-4 py-2 text-sm text-grafito"
                      >
                        {Icono && <Icono className="size-[18px]" aria-hidden />}
                        {servicio?.etiqueta ?? valor}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Cómo llegar
              </h2>
              <div className="relative isolate h-64 overflow-hidden rounded-card bg-humo">
                <MapaComplejo lat={complejo.latitud} lng={complejo.longitud} />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${complejo.latitud},${complejo.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-5 left-5 z-[1000] flex items-center gap-3 rounded-card bg-white px-4 py-3 shadow-card transition-transform hover:scale-[1.02]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-celeste-suave text-azul">
                    <Navigation className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-tinta">Abrir en Google Maps</span>
                    <span className="block text-xs text-grafito">{complejo.direccion}</span>
                  </span>
                </a>
              </div>
            </section>
          </div>

          <ReservaBlock complejo={complejo} />
        </div>
      </div>
    </>
  );
}
