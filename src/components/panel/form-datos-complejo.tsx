"use client";

import { useState, type FormEvent } from "react";
import { MapPin } from "lucide-react";
import { SelectorUbicacion, type Ubicacion } from "@/components/saque/selector-ubicacion";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";
import type { PlanSuscripcion } from "@/lib/api/tipos/comunes";

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

export type DatosEstablecimiento = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  requiereSena: boolean;
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
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * El backend hace `esPlanLimitado(plan) || request.requiereSena()`: en TRIAL y
   * FREE la seña queda en true SIEMPRE, mande lo que mande el front. Se
   * deshabilita el control en vez de dejar que alguien lo destilde, guarde, y
   * vea que vuelve a encenderse solo sin ninguna explicación.
   */
  const senaForzada = plan === "TRIAL" || plan === "FREE";

  const latitud = ubicacion?.lat ?? establecimiento?.latitud;
  const longitud = ubicacion?.lng ?? establecimiento?.longitud;

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre del complejo.");
    if (!direccion.trim()) return setError("Falta la dirección.");
    if (latitud == null || longitud == null) return setError("Elegí la localidad del complejo.");
    setError(null);
    onGuardar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud,
      longitud,
      requiereSena: senaForzada ? true : requiereSena,
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
        {/* La dirección es texto libre y el backend no la geocodifica: las
            coordenadas se eligen aparte, y son las que deciden si el complejo
            aparece en una búsqueda "cerca mío". El centroide de la localidad
            alcanza para eso; "usar mi ubicación", parado en el complejo, es
            más preciso. */}
        <p className="mt-1 text-xs text-grafito">
          {ubicacion
            ? `Se va a guardar en ${ubicacion.etiqueta} (${latitud!.toFixed(4)}, ${longitud!.toFixed(4)}).`
            : establecimiento
              ? `Ubicación actual: ${latitud!.toFixed(4)}, ${longitud!.toFixed(4)}. Buscá una localidad sólo si querés cambiarla.`
              : "Buscá la localidad donde está el complejo."}
        </p>
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
