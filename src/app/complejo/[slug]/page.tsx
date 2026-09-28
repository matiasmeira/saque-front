import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeaderPublico } from "@/components/canche/header-publico";
import { FooterPublico } from "@/components/canche/footer-publico";
import { ContenidoComplejo } from "@/components/canche/contenido-complejo";
import { etiquetaDeporte } from "@/lib/deportes";
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
  if (!complejo) return { title: "Complejo no encontrado — Canche.ar" };

  const deportesLabel = complejo.deportes.map(etiquetaDeporte).join(", ");
  const titulo = `${complejo.nombre} — Reservá tu cancha | Canche.ar`;
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
      {/*
        Cada "<" se reemplaza por su escape unicode ANTES de inyectar. JSON.stringify
        NO escapa "<", así que un nombre de complejo que contenga la secuencia de cierre
        de script rompe este bloque y ejecuta lo que siga — y ese nombre lo controla el
        dueño del complejo, sobre una ficha que ve cualquiera. El escape es transparente
        para el parser de JSON-LD, que lo vuelve a leer como "<".
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <HeaderPublico variant="claro" ancho="7xl" />

      <main className="flex-1">
        <ContenidoComplejo complejo={complejo} fuenteGrilla={{ tipo: "publico", slug }} />
      </main>

      <FooterPublico ancho="7xl" />
    </div>
  );
}
