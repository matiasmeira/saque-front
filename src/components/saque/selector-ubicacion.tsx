"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Loader2 } from "lucide-react";

import { buscarLocalidades, ubicacionActual, type Localidad } from "@/lib/api/georef";

/**
 * Elección de dónde buscar: autocompletado sobre las localidades de Argentina
 * (georef-ar-api) más un atajo a la ubicación del navegador.
 *
 * El backend sólo entiende lat/lng, así que todo lo que se elija acá termina
 * en coordenadas. La ubicación es opcional: sin ella el listado devuelve todos
 * los complejos ordenados por calificación, y por eso este control nunca
 * bloquea la búsqueda.
 */

export type Ubicacion = {
  lat: number;
  lng: number;
  /** Sólo para mostrar y para que el link sea compartible. */
  etiqueta: string;
};

const MS_DEBOUNCE = 300;

export function SelectorUbicacion({
  value,
  onChange,
  id,
}: {
  value: Ubicacion | null;
  onChange: (ubicacion: Ubicacion | null) => void;
  id?: string;
}) {
  const idGenerado = useId();
  const idInput = id ?? idGenerado;

  /**
   * El texto del input es DERIVADO, no sincronizado con un efecto: mientras el
   * usuario no haya tipeado nada muestra la etiqueta de la ubicación elegida
   * (que puede venir de la URL), y en cuanto escribe pasa a mandar lo suyo.
   * Sincronizarlo con un useEffect + setState desincroniza un frame y además
   * es el antipatrón que marca react-hooks/set-state-in-effect.
   */
  const [textoEditado, setTextoEditado] = useState<string | null>(null);
  const texto = textoEditado ?? value?.etiqueta ?? "";

  const [termino, setTermino] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Debounce: sin esto se dispara una request por tecla.
  useEffect(() => {
    const id = setTimeout(() => setTermino(texto.trim()), MS_DEBOUNCE);
    return () => clearTimeout(id);
  }, [texto]);

  useEffect(() => {
    function alClickAfuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    return () => document.removeEventListener("mousedown", alClickAfuera);
  }, []);

  const sugerencias = useQuery({
    queryKey: ["georef", "localidades", termino],
    queryFn: ({ signal }) => buscarLocalidades(termino, signal),
    // Menos de 3 letras devuelve demasiado ruido para ser útil.
    enabled: termino.length >= 3,
    staleTime: 60 * 60_000,
    retry: false,
  });

  function elegir(localidad: Localidad) {
    onChange({
      lat: localidad.lat,
      lng: localidad.lng,
      etiqueta: `${localidad.nombre}, ${localidad.provincia}`,
    });
    // Vuelve a mostrar la etiqueta del valor elegido, no lo que se había tipeado.
    setTextoEditado(null);
    setAbierto(false);
    setErrorUbicacion(null);
  }

  async function usarMiUbicacion() {
    setBuscandoUbicacion(true);
    setErrorUbicacion(null);
    try {
      const { lat, lng } = await ubicacionActual();
      onChange({ lat, lng, etiqueta: "Mi ubicación" });
      setTextoEditado(null);
      setAbierto(false);
    } catch (e) {
      setErrorUbicacion(e instanceof Error ? e.message : "No pudimos ubicarte.");
    } finally {
      setBuscandoUbicacion(false);
    }
  }

  function alEscribir(nuevo: string) {
    setTextoEditado(nuevo);
    setAbierto(true);
    // Al editar el texto, la ubicación elegida deja de ser válida: se limpia
    // para no buscar en un lugar que el usuario ya descartó.
    if (value) onChange(null);
  }

  const listaVisible =
    abierto && termino.length >= 3 && (sugerencias.isPending || sugerencias.data || sugerencias.isError);

  return (
    <div ref={contenedorRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          id={idInput}
          type="text"
          value={texto}
          onChange={(e) => alEscribir(e.target.value)}
          onFocus={() => setAbierto(true)}
          placeholder="Ciudad o localidad"
          autoComplete="off"
          role="combobox"
          aria-expanded={Boolean(listaVisible)}
          aria-controls={`${idInput}-sugerencias`}
          className="w-full bg-transparent text-tinta placeholder:text-grafito focus:outline-none"
        />
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoUbicacion}
          title="Usar mi ubicación"
          aria-label="Usar mi ubicación"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo hover:text-azul disabled:text-borde"
        >
          {buscandoUbicacion ? (
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
          ) : (
            <Crosshair className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>

      {errorUbicacion && (
        <p role="alert" className="mt-1 text-xs text-cancelado">
          {errorUbicacion}
        </p>
      )}

      {listaVisible && (
        <ul
          id={`${idInput}-sugerencias`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-card border border-borde bg-white py-1 shadow-lg"
        >
          {sugerencias.isPending && (
            <li className="px-4 py-2 text-sm text-grafito">Buscando...</li>
          )}

          {sugerencias.isError && (
            <li className="px-4 py-2 text-sm text-grafito">
              No pudimos buscar localidades. Podés buscar sin ubicación.
            </li>
          )}

          {sugerencias.data?.length === 0 && (
            <li className="px-4 py-2 text-sm text-grafito">Sin resultados.</li>
          )}

          {sugerencias.data?.map((localidad) => (
            <li key={localidad.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => elegir(localidad)}
                className="block w-full px-4 py-2 text-left text-sm text-tinta transition-colors hover:bg-humo"
              >
                {localidad.nombre}
                <span className="text-grafito"> · {localidad.provincia}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
