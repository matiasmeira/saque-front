"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin } from "lucide-react";
import { DEPORTES } from "@/lib/deportes";
import { FRANJAS } from "@/lib/franjas";
import { CampoFormulario } from "@/components/canche/campo-formulario";
import { Selector } from "@/components/canche/selector";
import { SelectorFecha, proximosDias } from "@/components/canche/selector-fecha";
import { SelectorUbicacion, type Ubicacion } from "@/components/canche/selector-ubicacion";

/**
 * El buscador de la home.
 *
 * Arranca con valores usables sin esperar nada: "Dónde" nace vacío y
 * no depende de permiso de geolocalización ni de ningún dato que
 * llegue después. La home nunca muestra un estado de carga como
 * protagonista. Buscar sin ubicación es válido: el backend devuelve
 * entonces todos los complejos ordenados por calificación.
 *
 * Es un card flotante (no de ancho completo) que sube sobre el hero
 * con margen negativo, para que quede "flotando" sobre la foto/panel
 * tinta en vez de cortar la pantalla en dos franjas. z-10 explícito es
 * necesario porque el hero tiene position:relative (por el SVG de
 * fondo) y un elemento posicionado siempre pinta por encima de uno
 * sin posición, sin importar el orden en el HTML.
 *
 * Neumorfismo: la card y cada campo comparten el mismo fondo (humo),
 * la separación la dan --shadow-neu-raised/-inset en vez de un borde.
 * Por eso no hay chips de atajo de fecha ("Hoy"/"Mañana"/etc.): en
 * este lenguaje visual un chip aislado no tiene contra qué "hundirse"
 * o "sobresalir" de forma consistente con el resto, y el campo
 * Cuándo ya cubre lo mismo.
 */
export function Buscador() {
  const router = useRouter();

  const [deporte, setDeporte] = useState<string>(DEPORTES[0].valor);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [fecha, setFecha] = useState(proximosDias(1)[0].valor);
  const [franja, setFranja] = useState(FRANJAS[2].valor);

  /**
   * La ubicación es opcional: sin lat/lng el listado devuelve todos los
   * complejos ordenados por calificación, así que el botón nunca se bloquea
   * esperando que el usuario elija un lugar.
   */
  function buscar() {
    const params = new URLSearchParams({ deporte, fecha, franja });
    if (ubicacion) {
      params.set("lat", String(ubicacion.lat));
      params.set("lng", String(ubicacion.lng));
      params.set("lugar", ubicacion.etiqueta);
    }
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <section
      aria-label="Buscador de canchas"
      className="relative z-10 mx-auto -mt-12 w-[calc(100%-2.5rem)] max-w-4xl rounded-card bg-white shadow-card sm:-mt-16 sm:w-[calc(100%-4rem)]"
    >
      <div className="px-5 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <CampoFormulario
            icon={<Dumbbell className="size-[18px]" aria-hidden />}
            label="Deporte"
            htmlFor="deporte"
            className="rounded-input border border-borde px-4 transition-colors duration-200 hover:border-azul"
          >
            <Selector id="deporte" value={deporte} onChange={setDeporte} opciones={DEPORTES} />
          </CampoFormulario>

          <CampoFormulario
            icon={<MapPin className="size-[18px]" aria-hidden />}
            label="Dónde"
            htmlFor="ubicacion"
            className="rounded-input border border-borde px-4 transition-colors duration-200 hover:border-azul"
          >
            <SelectorUbicacion id="ubicacion" value={ubicacion} onChange={setUbicacion} />
          </CampoFormulario>

          <CampoFormulario
            icon={<CalendarDays className="size-[18px]" aria-hidden />}
            label="Cuándo"
            htmlFor="fecha"
            className="rounded-input border border-borde px-4 transition-colors duration-200 hover:border-azul"
          >
            <SelectorFecha id="fecha" value={fecha} onChange={setFecha} />
          </CampoFormulario>

          <CampoFormulario
            icon={<Clock className="size-[18px]" aria-hidden />}
            label="Franja"
            htmlFor="franja"
            className="rounded-input border border-borde px-4 transition-colors duration-200 hover:border-azul"
          >
            <Selector id="franja" value={franja} onChange={setFranja} opciones={FRANJAS} />
          </CampoFormulario>
        </div>

        <button
          type="button"
          onClick={buscar}
          className="mt-5 flex h-14 w-full items-center justify-center rounded-full border border-azul-oscuro bg-azul font-display text-base font-bold text-white transition-all duration-150 ease-out hover:bg-azul-oscuro active:scale-[0.98]"
        >
          Buscar canchas
        </button>
      </div>
    </section>
  );
}
