import type { Metadata } from "next";
import { Map } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { FiltrosResultados } from "@/components/saque/filtros-resultados";
import { VenueCard } from "@/components/saque/venue-card";
import { EmptyState } from "@/components/saque/empty-state";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { proximosDias, etiquetaDeFecha } from "@/components/saque/selector-fecha";
import { DEPORTES } from "@/mocks/deportes";
import { ZONAS } from "@/mocks/zonas";
import { FRANJAS } from "@/mocks/franjas";
import { COMPLEJOS } from "@/mocks/complejos";

export const metadata: Metadata = {
  title: "Canchas en José C. Paz — saque",
};

/**
 * A2 · Resultados. Server Component: la única parte cliente es la
 * barra de filtros (renavega la URL) — el listado en sí se resuelve
 * en el servidor, como pide la Parte 1 para toda la zona A.
 */
export default async function Resultados({
  searchParams,
}: {
  searchParams: Promise<{ deporte?: string; zona?: string; fecha?: string; franja?: string }>;
}) {
  const params = await searchParams;
  const deporte = params.deporte || DEPORTES[0].valor;
  const zona = params.zona || ZONAS[0].valor;
  const fecha = params.fecha || proximosDias(1)[0].valor;
  const franja = params.franja || FRANJAS[2].valor;

  const zonaLabel = zona === "cerca" ? "José C. Paz" : ZONAS.find((z) => z.valor === zona)?.etiqueta ?? "José C. Paz";
  const deporteLabel = DEPORTES.find((d) => d.valor === deporte)?.etiqueta ?? deporte;
  const franjaLabel = FRANJAS.find((f) => f.valor === franja)?.etiqueta ?? "";
  const diaFrase = etiquetaDeFecha(fecha);
  const diaEyebrow = diaFrase === "hoy" ? "Hoy" : diaFrase === "mañana" ? "Mañana" : diaFrase;
  const momentoLabel = `${diaEyebrow} a la ${franjaLabel.toLowerCase()}`;

  const coincidencias = COMPLEJOS.filter((c) => c.deportes.includes(deporte));
  const disponibles = coincidencias.filter((c) => c.horarios.length > 0).sort((a, b) => a.distanciaKm - b.distanciaKm);
  const sinDisponibilidad = coincidencias
    .filter((c) => c.horarios.length === 0)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
  const total = disponibles.length + sinDisponibilidad.length;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        <FiltrosResultados deporte={deporte} zona={zona} fecha={fecha} franja={franja} />

        {total === 0 ? (
          <div className="mt-8">
            <EmptyState
              titulo={`No hay ${deporteLabel.toLowerCase()} en ${zonaLabel} para ${diaFrase}.`}
              descripcion="Pero seguro hay lugar si corrés alguno de estos tres criterios:"
              salidas={[
                {
                  label: `Con ${DEPORTES[0].etiqueta.toLowerCase()}, hay lugar en ${zonaLabel}`,
                  href: `/buscar?deporte=${DEPORTES[0].valor}&zona=${zona}&fecha=${fecha}&franja=${franja}`,
                },
                {
                  label: `Mañana probablemente haya más opciones`,
                  href: `/buscar?deporte=${deporte}&zona=${zona}&fecha=${proximosDias(2)[1].valor}&franja=${franja}`,
                },
                {
                  label: `Probá con otra franja horaria`,
                  href: `/buscar?deporte=${deporte}&zona=${zona}&fecha=${fecha}&franja=${franja === "noche" ? "tarde" : "noche"}`,
                },
              ]}
              ctaLabel="Avisame si se libera"
            />
          </div>
        ) : (
          <>
            <div className="mb-8 mt-8">
              <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
                Canchas en {zonaLabel}
              </h1>
              <p className="mt-1 text-grafito">
                Encontramos {total} lugar{total === 1 ? "" : "es"} para que juegues {diaFrase}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {disponibles.map((complejo) => (
                <VenueCard key={complejo.id} complejo={complejo} momentoLabel={momentoLabel} fecha={fecha} />
              ))}
              {sinDisponibilidad.map((complejo) => (
                <VenueCard key={complejo.id} complejo={complejo} momentoLabel={momentoLabel} fecha={fecha} />
              ))}
            </div>
          </>
        )}

        {/* Decorativo, como en la referencia — no hay pantalla de mapa en el inventario todavía. */}
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
