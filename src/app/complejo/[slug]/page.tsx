import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { GaleriaFotos } from "@/components/saque/galeria-fotos";
import { GrillaDisponibilidad } from "@/components/saque/grilla-disponibilidad";
import { ReservaBlock } from "@/components/saque/reserva-block";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { etiquetaDeporte } from "@/lib/deportes";
import { servicio as buscarServicio } from "@/lib/servicios";
import { publico } from "@/lib/api/endpoints/publico";
import { ApiError } from "@/lib/api/errores";
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";

/** `"MONDAY"` → `"Monday"`, que es lo que espera schema.org. */
function diaSchema(diaSemana: string): string {
  return diaSemana.charAt(0) + diaSemana.slice(1).toLowerCase();
}

/**
 * El JSON-LD ahora sale de HorarioAtencionDto, que viene estructurado
 * (diaSemana + horaApertura + horaCierre). Antes había que parsear strings
 * tipo "Lun a Vie" y "09 a 24" para reconstruirlo.
 */
function openingHoursSpecification(complejo: ComplejoDetalleResponse) {
  return complejo.horariosAtencion.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: diaSchema(h.diaSemana),
    opens: h.horaApertura.slice(0, 5),
    closes: h.horaCierre.slice(0, 5),
  }));
}

async function buscarComplejo(slug: string): Promise<ComplejoDetalleResponse | null> {
  try {
    return await publico.detalle(slug);
  } catch (e) {
    // 404 del backend = complejo inexistente o dado de baja.
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const complejo = await buscarComplejo(slug);
  if (!complejo) return { title: "Complejo no encontrado — saque" };

  const deportesLabel = complejo.deportes.map(etiquetaDeporte).join(", ");
  const titulo = `${complejo.nombre} — Reservá tu cancha | saque`;
  const descripcion = `${complejo.nombre}, en ${complejo.direccion}. Reservá ${deportesLabel} online y el turno queda confirmado al instante.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: { title: titulo, description: descripcion, type: "website" },
  };
}

export default async function FichaComplejo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const complejo = await buscarComplejo(slug);
  if (!complejo) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: complejo.nombre,
    // El DTO trae la dirección como un solo string: no hay campos separados de
    // localidad ni provincia para desglosar acá.
    address: {
      "@type": "PostalAddress",
      streetAddress: complejo.direccion,
      addressCountry: "AR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: complejo.latitud,
      longitude: complejo.longitud,
    },
    ...(complejo.precioDesde !== null && {
      priceRange: `Desde $${complejo.precioDesde.toLocaleString("es-AR")}`,
    }),
    ...(complejo.promedioCalificacion !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: complejo.promedioCalificacion,
        reviewCount: complejo.cantidadCalificaciones ?? 0,
      },
    }),
    openingHoursSpecification: openingHoursSpecification(complejo),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <HeaderPublico variant="claro" ancho="7xl" />

      <GaleriaFotos fotos={complejo.fotos} nombreComplejo={complejo.nombre} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 pb-56 sm:px-8 lg:px-10 lg:pb-16">
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

        <h1 className="font-display text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.02em] text-tinta sm:text-[3.5rem]">
          {complejo.nombre}
        </h1>

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
              <GrillaDisponibilidad complejo={complejo} />
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
              <div className="relative h-64 overflow-hidden rounded-card bg-tinta">
                <LineasDeCancha className="opacity-[0.16]" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${complejo.latitud},${complejo.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-5 left-5 flex items-center gap-3 rounded-card bg-white px-4 py-3 transition-transform hover:scale-[1.02]"
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
      </main>

      <FooterPublico ancho="7xl" />
    </div>
  );
}
