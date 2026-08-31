"use client";

import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { SelectorUbicacion, type Ubicacion } from "@/components/canche/selector-ubicacion";
import { geocodificarDireccion } from "@/lib/api/georef";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";
import type { PlanSuscripcion } from "@/lib/api/tipos/comunes";

/**
 * Leaflet toca `window` al armar sus íconos, así que sólo puede vivir en el
 * cliente: `ssr:false` sirve porque este archivo ya es `"use client"`
 * (fuera de un Client Component, Next tira error al usarlo).
 */
const MapaUbicacion = dynamic(
  () => import("@/components/canche/mapa-ubicacion").then((mod) => mod.MapaUbicacion),
  { ssr: false },
);

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

const MS_DEBOUNCE_DIRECCION = 400;

export type DatosEstablecimiento = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  requiereSena: boolean;
  requiereTelefonoVerificado: boolean;
};

/**
 * Identidad del complejo. Todo lo que hay acá existe en
 * `EstablecimientoRequest`; nada más.
 *
 * Lo que se fue, y por qué:
 *  - **Teléfono y CUIT**: no existen ni en la entidad ni en el DTO. Eran dos
 *    campos que se tipeaban y no viajaban a ningún lado.
 *  - **Deportes**: no son del establecimiento sino de cada cancha
 *    (`CanchaRequest.deportes`). El marketplace los deriva de las canchas
 *    activas, así que elegirlos acá no habría cambiado nada de lo que ve el
 *    jugador.
 *
 * Lo que se sumó: **latitud/longitud** (son `@NotNull` en el request, o sea que
 * el PUT ni siquiera pasa sin ellas) y **requiereSena**.
 *
 * Sin `establecimiento` (prop opcional) queda en modo creación: arranca con
 * los campos vacíos y no hay coordenadas por defecto, así que hay que elegir
 * una localidad antes de poder guardar.
 */
export function FormDatosComplejo({
  establecimiento,
  plan,
  guardando,
  onGuardar,
}: {
  establecimiento?: EstablecimientoResponse;
  /** TRIAL y FREE no pueden desactivar la seña: el backend la fuerza. */
  plan: PlanSuscripcion | undefined;
  guardando: boolean;
  onGuardar: (datos: DatosEstablecimiento) => void;
}) {
  const [nombre, setNombre] = useState(establecimiento?.nombre ?? "");
  const [direccion, setDireccion] = useState(establecimiento?.direccion ?? "");
  const [requiereSena, setRequiereSena] = useState(establecimiento?.requiereSena ?? false);
  const [requiereTelefonoVerificado, setRequiereTelefonoVerificado] = useState(
    establecimiento?.requiereTelefonoVerificado ?? false,
  );
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  /**
   * Corrección manual del pin, junto con la dirección/localidad para la que
   * se hizo. No se sincroniza con un efecto: se guarda el contexto y, al
   * leerlo (ver `pinVigente`), se ignora si ese contexto ya cambió — mismo
   * criterio que usa `SelectorUbicacion` para su texto derivado, para no caer
   * en el antipatrón que marca react-hooks/set-state-in-effect.
   */
  const [pin, setPin] = useState<{
    lat: number;
    lng: number;
    direccion: string;
    provincia?: string;
    departamento?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce: geocodificar en cada tecla sería una request por letra.
  const [direccionDebounced, setDireccionDebounced] = useState(direccion.trim());
  useEffect(() => {
    const id = setTimeout(() => setDireccionDebounced(direccion.trim()), MS_DEBOUNCE_DIRECCION);
    return () => clearTimeout(id);
  }, [direccion]);

  const pinVigente =
    pin && pin.direccion === direccionDebounced && pin.provincia === ubicacion?.provincia && pin.departamento === ubicacion?.departamento
      ? pin
      : null;

  function moverPin(coords: { lat: number; lng: number }) {
    setPin({ ...coords, direccion: direccionDebounced, provincia: ubicacion?.provincia, departamento: ubicacion?.departamento });
  }

  /**
   * Geocodifica la dirección exacta contra georef, usando la localidad
   * elegida como contexto ("Rivadavia 5000" sin provincia devuelve
   * cualquier Rivadavia del país). Sin localidad, o si la calle no está en
   * el nomenclador, esto no dispara y se cae al centroide de la localidad.
   */
  const direccionGeocodificada = useQuery({
    queryKey: ["georef", "direccion", direccionDebounced, ubicacion?.provincia, ubicacion?.departamento],
    queryFn: ({ signal }) =>
      geocodificarDireccion(
        direccionDebounced,
        { provincia: ubicacion!.provincia!, departamento: ubicacion?.departamento },
        signal,
      ),
    enabled: direccionDebounced.length >= 5 && Boolean(ubicacion?.provincia),
    staleTime: 60 * 60_000,
    retry: false,
  });
  const geocodificado = direccionGeocodificada.data;

  /**
   * El "el pin" que se guarda y se muestra en el mapa: gana el arrastre
   * manual, después la dirección geocodificada, después el centroide de la
   * localidad, y en modo edición, la coordenada que ya tenía el complejo.
   */
  const coords =
    pinVigente ??
    (geocodificado ? { lat: geocodificado.lat, lng: geocodificado.lng } : null) ??
    (ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null) ??
    (establecimiento ? { lat: establecimiento.latitud, lng: establecimiento.longitud } : null);

  /**
   * El backend hace `esPlanLimitado(plan) || request.requiereSena()`: en TRIAL y
   * FREE la seña queda en true SIEMPRE, mande lo que mande el front. Se
   * deshabilita el control en vez de dejar que alguien lo destilde, guarde, y
   * vea que vuelve a encenderse solo sin ninguna explicación.
   */
  const senaForzada = plan === "TRIAL" || plan === "FREE";

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre del complejo.");
    if (!direccion.trim()) return setError("Falta la dirección.");
    if (!coords) return setError("Elegí una localidad para ubicar el complejo.");
    setError(null);
    onGuardar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud: coords.lat,
      longitud: coords.lng,
      requiereSena: senaForzada ? true : requiereSena,
      requiereTelefonoVerificado,
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="config-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre del complejo
        </label>
        <input id="config-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="config-direccion" className="mb-1 block text-xs font-semibold text-grafito">
          Dirección
        </label>
        <input id="config-direccion" required value={direccion} onChange={(e) => setDireccion(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="config-ubicacion" className="mb-1 block text-xs font-semibold text-grafito">
          Localidad
        </label>
        <div className="rounded-input bg-humo px-3 py-1.5">
          <SelectorUbicacion id="config-ubicacion" value={ubicacion} onChange={setUbicacion} />
        </div>
        {/* La localidad ubica la dirección con precisión (georef necesita
            provincia/departamento para no confundir, p. ej., "Rivadavia
            5000" de Wilde con el de Cañuelas) y es el respaldo si esa calle
            no está en el nomenclador. El pin del mapa es el ajuste final. */}
        <p className="mt-1 text-xs text-grafito">
          {pinVigente
            ? `Ajustaste el pin a mano: se va a guardar ahí (${pinVigente.lat.toFixed(4)}, ${pinVigente.lng.toFixed(4)}).`
            : direccionGeocodificada.isFetching
              ? "Buscando la dirección exacta…"
              : geocodificado
                ? `Se va a guardar en ${geocodificado.etiqueta} (${geocodificado.lat.toFixed(4)}, ${geocodificado.lng.toFixed(4)}).`
                : ubicacion
                  ? `No encontramos esa calle: se va a guardar cerca del centro de ${ubicacion.etiqueta} (${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}). Arrastrá el pin para afinarlo.`
                  : establecimiento
                    ? `Ubicación actual: ${establecimiento.latitud.toFixed(4)}, ${establecimiento.longitud.toFixed(4)}. Elegí una localidad para ubicar la dirección con precisión.`
                    : "Buscá la localidad donde está el complejo."}
        </p>

        {coords && (
          <div className="mt-3 h-56 w-full overflow-hidden rounded-input">
            <MapaUbicacion lat={coords.lat} lng={coords.lng} onMover={moverPin} />
          </div>
        )}
      </div>

      <div className="rounded-input bg-humo p-3.5">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={senaForzada ? true : requiereSena}
            disabled={senaForzada}
            onChange={(e) => setRequiereSena(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-borde accent-azul disabled:opacity-60"
          />
          <span>
            <span className="block text-sm font-semibold text-tinta">Pedir seña para reservar</span>
            <span className="block text-xs text-grafito">
              {senaForzada
                ? "En el plan gratuito la seña es obligatoria y no se puede desactivar."
                : "El jugador tiene que pagar una seña para que su turno quede confirmado."}
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-input bg-humo p-3.5">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={requiereTelefonoVerificado}
            onChange={(e) => setRequiereTelefonoVerificado(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-borde accent-azul"
          />
          <span>
            <span className="block text-sm font-semibold text-tinta">
              Exigir teléfono verificado para reservar
            </span>
            <span className="block text-xs text-grafito">
              El jugador va a necesitar verificar su celular desde su perfil antes de poder reservar acá.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar datos"}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-grafito">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          Los deportes salen de tus canchas, no de acá.
        </p>
      </div>
    </form>
  );
}
