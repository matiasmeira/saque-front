import type { Metadata } from "next";
import { Map } from "lucide-react";
import { HeaderPublico } from "@/components/canche/header-publico";
import { FooterPublico } from "@/components/canche/footer-publico";
import { FiltrosResultados } from "@/components/canche/filtros-resultados";
import { VenueCard } from "@/components/canche/venue-card";
import { EmptyState } from "@/components/canche/empty-state";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";
import { proximosDias, etiquetaDeFecha } from "@/components/canche/selector-fecha";
import { DEPORTES, esDeporte, etiquetaDeporte } from "@/lib/deportes";
import { FRANJAS } from "@/lib/franjas";
import { publico } from "@/lib/api/endpoints/publico";
import { aHoraBack } from "@/lib/api/fechas";
import type { ComplejoCardResponse } from "@/lib/api/tipos/publico";
import type { Page } from "@/lib/api/tipos/comunes";

export const metadata: Metadata = {
  title: "Buscar canchas — Canche.ar",
};

/**
 * Hora que representa cada franja al filtrar contra la API.
 *
 * El backend no entiende franjas: toma una `hora` puntual y mira una ventana
 * de 60 minutos desde ahí. Se manda el inicio de la franja como aproximación,
 * y el copy lo refleja ("desde las 18:00") para no prometer más que eso.
 */
const HORA_DE_FRANJA: Record<string, string> = {
  manana: "09:00",
  tarde: "14:00",
  noche: "19:00",
};

/**
 * A2 · Resultados. Server Component: la única parte cliente es la barra de
 * filtros (renavega la URL). El listado se resuelve en el servidor.
 *
 * La ubicación es opcional. Con lat/lng el backend filtra por cercanía y
 * ordena por distancia; sin ella devuelve todos los complejos activos
 * ordenados por calificación. Por eso `/buscar` sin parámetros es una página
 * válida y no un estado de error.
 */
export default async function Resultados({
  searchParams,
}: {
  searchParams: Promise<{
    deporte?: string;
    fecha?: string;
    franja?: string;
    lat?: string;
    lng?: string;
    lugar?: string;
  }>;
}) {
  const params = await searchParams;
  const deporte = esDeporte(params.deporte) ? params.deporte : DEPORTES[0].valor;
  const fecha = params.fecha || proximosDias(1)[0].valor;
  const franja = params.franja || FRANJAS[2].valor;

  // lat y lng viajan juntos o no viajan: mandar uno solo da 400.
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const hayUbicacion = Number.isFinite(lat) && Number.isFinite(lng) && params.lat && params.lng;
  const ubicacion = hayUbicacion
    ? { lat, lng, etiqueta: params.lugar || "tu ubicación" }
    : null;

  const deporteLabel = etiquetaDeporte(deporte);
  const franjaLabel = FRANJAS.find((f) => f.valor === franja)?.etiqueta ?? "";
  const diaFrase = etiquetaDeFecha(fecha);
  const lugarLabel = ubicacion ? ubicacion.etiqueta : "todo el país";

  let pagina: Page<ComplejoCardResponse> | null = null;
  let fallo = false;
  try {
    pagina = await publico.buscarComplejos({
      deporte,
      fecha,
      hora: aHoraBack(HORA_DE_FRANJA[franja] ?? "19:00"),
      ...(ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : {}),
    });
  } catch {
    fallo = true;
  }

  const complejos = pagina?.content ?? [];
  const total = pagina?.totalElements ?? 0;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        <FiltrosResultados
          deporte={deporte}
          fecha={fecha}
          franja={franja}
          ubicacion={ubicacion}
        />

        {fallo ? (
          <div className="mt-8">
            <EmptyState
              titulo="No pudimos cargar los resultados."
              descripcion="Puede ser un problema momentáneo. Probá de nuevo en un rato."
              salidas={[{ label: "Volver al inicio", href: "/" }]}
              ctaLabel="Reintentar"
            />
          </div>
        ) : total === 0 ? (
          <div className="mt-8">
            <EmptyState
              titulo={`No hay ${deporteLabel.toLowerCase()} en ${lugarLabel} para ${diaFrase}.`}
              descripcion="Pero seguro hay lugar si corrés alguno de estos criterios:"
              salidas={[
                ...(ubicacion
                  ? [
                      {
                        label: "Buscar en todo el país",
                        href: `/buscar?deporte=${deporte}&fecha=${fecha}&franja=${franja}`,
                      },
                    ]
                  : []),
                {
                  label: "Mañana probablemente haya más opciones",
                  href: `/buscar?deporte=${deporte}&fecha=${proximosDias(2)[1].valor}&franja=${franja}`,
                },
                {
                  label: "Probá con otra franja horaria",
                  href: `/buscar?deporte=${deporte}&fecha=${fecha}&franja=${franja === "noche" ? "tarde" : "noche"}`,
                },
              ]}
              ctaLabel="Avisame si se libera"
            />
          </div>
        ) : (
          <>
            <div className="mb-8 mt-8">
              <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Canchas en {lugarLabel}
              </h1>
              <p className="mt-1 text-grafito">
                Encontramos {total} lugar{total === 1 ? "" : "es"} con turnos {diaFrase} desde las{" "}
                {HORA_DE_FRANJA[franja] ?? "19:00"} ({franjaLabel.toLowerCase()})
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {complejos.map((complejo) => (
                <VenueCard key={complejo.slug} complejo={complejo} />
              ))}
            </div>
          </>
        )}

        {/* Decorativo, como en la referencia — no hay pantalla de mapa todavía. */}
        <div className="relative mt-8 flex flex-col items-center gap-6 overflow-hidden rounded-card bg-tinta p-8 text-center sm:flex-row sm:justify-between sm:p-10 sm:text-left">
          <LineasDeCancha className="opacity-10" />
          <div className="relative z-10">
            <h2 className="font-display text-xl font-bold text-celeste">¿Preferís ver el mapa?</h2>
            <p className="mt-1 text-white/80">Mirá todas las canchas cercanas a tu ubicación actual.</p>
          </div>
          <button
            type="button"
            className="relative z-10 flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 font-display text-sm font-bold text-tinta transition-transform hover:scale-95"
          >
            <Map className="size-[18px]" aria-hidden />
            Abrir mapa
          </button>
        </div>
      </main>

      <FooterPublico />
    </div>
  );
}
