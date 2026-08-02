import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Navigation, ShowerHead, Flame, ParkingCircle, UtensilsCrossed, Wifi } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { GaleriaFotos } from "@/components/saque/galeria-fotos";
import { GrillaDisponibilidad } from "@/components/saque/grilla-disponibilidad";
import { ReservaBlock } from "@/components/saque/reserva-block";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { DEPORTES } from "@/mocks/deportes";
import { SERVICIOS } from "@/mocks/servicios";
import { COMPLEJOS, type Complejo, type HorarioAtencion } from "@/mocks/complejos";

const ICONOS_SERVICIO: Record<string, typeof ShowerHead> = {
  vestuario: ShowerHead,
  parrilla: Flame,
  estacionamiento: ParkingCircle,
  buffet: UtensilsCrossed,
  wifi: Wifi,
};

const DIAS_SCHEMA: Record<string, string[]> = {
  "Lun a Vie": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "Sáb y Dom": ["Saturday", "Sunday"],
  "Todos los días": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

function buscarComplejo(slug: string): Complejo | undefined {
  return COMPLEJOS.find((c) => c.slug === slug);
}

function aHoraISO(hora: string) {
  const limpio = hora.trim().padStart(2, "0");
  return limpio === "24" ? "23:59" : `${limpio}:00`;
}

function openingHoursSpecification(horarioAtencion: HorarioAtencion[]) {
  return horarioAtencion.map((h) => {
    const [desde, hasta] = h.horario.split(" a ").map((s) => s.trim());
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS_SCHEMA[h.dias] ?? [],
      opens: aHoraISO(desde),
      closes: aHoraISO(hasta),
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const complejo = buscarComplejo(slug);
  if (!complejo) return { title: "Complejo no encontrado — saque" };

  const deportesLabel = complejo.deportes
    .map((d) => DEPORTES.find((dep) => dep.valor === d)?.etiqueta)
    .filter(Boolean)
    .join(", ");
  const titulo = `${complejo.nombre} — Reservá cancha en José C. Paz | saque`;
  const descripcion = `${complejo.nombre}, en ${complejo.direccion}. Reservá ${deportesLabel} online, pagás la seña y el turno queda confirmado al instante.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
    },
  };
}

export default async function FichaComplejo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const complejo = buscarComplejo(slug);
  if (!complejo) notFound();

  const precios = complejo.canchas.map((c) => c.precio);
  const priceRange = `$${Math.min(...precios).toLocaleString("es-AR")}–$${Math.max(...precios).toLocaleString("es-AR")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: complejo.nombre,
    address: {
      "@type": "PostalAddress",
      streetAddress: complejo.direccion,
      addressLocality: "José C. Paz",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    geo: { "@type": "GeoCoordinates", latitude: complejo.lat, longitude: complejo.lng },
    priceRange,
    openingHoursSpecification: openingHoursSpecification(complejo.horarioAtencion),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <HeaderPublico variant="claro" ancho="7xl" />

      <GaleriaFotos fotos={complejo.fotos} nombreComplejo={complejo.nombre} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 pb-56 sm:px-8 lg:px-10 lg:pb-16">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {complejo.nuevo && (
            <span className="rounded bg-azul px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Nuevo
            </span>
          )}
          {complejo.deportes.map((valor) => (
            <span
              key={valor}
              className="rounded-full border border-borde bg-white px-3 py-1 text-sm text-grafito"
            >
              {DEPORTES.find((d) => d.valor === valor)?.etiqueta ?? valor}
            </span>
          ))}
        </div>

        <h1 className="font-display text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.02em] text-tinta sm:text-[3.5rem]">
          {complejo.nombre}
        </h1>

        <div className="mt-3 flex items-center gap-1.5 text-grafito">
          <MapPin className="size-[18px] shrink-0" aria-hidden />
          <p>
            {complejo.direccion}, José C. Paz
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <section>
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Canchas
              </h2>
              <GrillaDisponibilidad complejo={complejo} />
            </section>

            <section>
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Servicios
              </h2>
              <div className="flex flex-wrap gap-2">
                {complejo.servicios.map((valor) => {
                  const servicio = SERVICIOS.find((s) => s.valor === valor);
                  const Icono = ICONOS_SERVICIO[valor];
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

            <section>
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Cómo llegar
              </h2>
              <div className="relative h-64 overflow-hidden rounded-card bg-tinta">
                <LineasDeCancha className="opacity-[0.16]" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${complejo.lat},${complejo.lng}`}
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

            <section>
              <h2 className="mb-4 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Reglas del complejo
              </h2>
              <p className="max-w-3xl leading-relaxed text-grafito">{complejo.reglas}</p>
            </section>
          </div>

          <ReservaBlock complejo={complejo} />
        </div>
      </main>

      <FooterPublico ancho="7xl" />
    </div>
  );
}
