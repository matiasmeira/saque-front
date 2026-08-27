"use client";

import dynamic from "next/dynamic";

/**
 * `complejo/[slug]/page.tsx` es un Server Component (fetch server-side,
 * JSON-LD para SEO) y Leaflet toca `window` al armar sus íconos: el
 * `ssr:false` que eso exige sólo se puede pedir desde un Client Component,
 * de ahí este wrapper en vez de llamar a MapaUbicacion directo desde la
 * página.
 */
const MapaUbicacion = dynamic(
  () => import("@/components/saque/mapa-ubicacion").then((mod) => mod.MapaUbicacion),
  { ssr: false },
);

export function MapaComplejo({ lat, lng }: { lat: number; lng: number }) {
  return <MapaUbicacion lat={lat} lng={lng} />;
}
