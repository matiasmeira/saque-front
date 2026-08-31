"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

const ZOOM_PREVIEW = 16;

/**
 * Pin propio en vez del ícono default de Leaflet: éste depende de imágenes
 * (marker-icon.png, etc.) que el bundler de Next no resuelve solo y rompen
 * silenciosamente (ícono ausente) si no se las registra a mano. Un SVG
 * inline no tiene ese problema y hace juego con el celeste/azul del resto
 * del panel en vez del pin azul genérico de Leaflet.
 */
const iconoPin = L.divIcon({
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="#0e56c9"/>
    <circle cx="15" cy="15" r="5.5" fill="#fff"/>
  </svg>`,
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

/**
 * El `center` de MapContainer sólo se usa al montar (documentado así en
 * react-leaflet): sin esto, elegir otra localidad o resolver una dirección
 * nueva no mueve el mapa, sólo el marker.
 */
function Recentrar({ lat, lng }: { lat: number; lng: number }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.setView([lat, lng], mapa.getZoom());
  }, [lat, lng, mapa]);
  return null;
}

/**
 * Pin de la ubicación del complejo. Llena el contenedor que le pase quien lo
 * use (sin alto propio: el panel necesita otro que la ficha pública) — el
 * caller decide tamaño y radio con su propio div.
 *
 * `onMover` es opcional: sin él el pin no es arrastrable, para el uso de
 * sólo lectura en la ficha pública. Con él (panel de configuración) es la
 * corrección manual para cuando el geocoder no tiene la calle en el
 * nomenclador (countries, barrios cerrados, direcciones nuevas).
 */
export function MapaUbicacion({
  lat,
  lng,
  onMover,
}: {
  lat: number;
  lng: number;
  onMover?: (coords: { lat: number; lng: number }) => void;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={ZOOM_PREVIEW} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recentrar lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        icon={iconoPin}
        draggable={Boolean(onMover)}
        eventHandlers={
          onMover
            ? {
                dragend: (e) => {
                  const posicion = e.target.getLatLng();
                  onMover({ lat: posicion.lat, lng: posicion.lng });
                },
              }
            : undefined
        }
      />
    </MapContainer>
  );
}
