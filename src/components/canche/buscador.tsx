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
 * La hoja es de ancho completo (no un "card" angosto) y sube sobre
 * el hero con margen negativo: así el corte entre el panel tinta y
 * el fondo claro queda cubierto de punta a punta, sin línea dura.
 * z-10 explícito es necesario porque el hero tiene position:relative
 * (por el SVG de fondo) y un elemento posicionado siempre pinta por
 * encima de uno sin posición, sin importar el orden en el HTML.
 *
 * Los chips de fecha son atajos, no un segundo lugar donde vive el
 * estado: solo escriben en el campo "Cuándo" y no muestran
 * seleccionado — si mostraran estado propio, "Hoy" competiría con
 * el mismo valor ya visible en el campo.
 */
export function Buscador() {
  const router = useRouter();
  const dias = proximosDias(14);
  // "Próximo sábado/domingo" puede caer en "Hoy" o "Mañana" (ej. hoy viernes
  // -> mañana YA es el próximo sábado): sin el dedupe por valor, esos dos
  // chips quedan con la misma key y React tira el warning de keys duplicadas.
  const valoresVistos = new Set<string>();
  const chips = [
    dias[0],
    dias[1],
    dias.find((d) => d.fecha.getDay() === 6)!,
    dias.find((d) => d.fecha.getDay() === 0)!,
  ].filter((chip) => {
    if (valoresVistos.has(chip.valor)) return false;
    valoresVistos.add(chip.valor);
    return true;
  });

  const [deporte, setDeporte] = useState<string>(DEPORTES[0].valor);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [fecha, setFecha] = useState(dias[0].valor);
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
      className="relative z-10 -mt-10 rounded-t-card bg-white sm:-mt-16"
    >
      <div className="mx-auto max-w-5xl px-5 pb-8 pt-7 sm:px-8">
        <div className="divide-y divide-borde">
          <CampoFormulario icon={<Dumbbell className="size-[18px]" aria-hidden />} label="Deporte" htmlFor="deporte">
            <Selector id="deporte" value={deporte} onChange={setDeporte} opciones={DEPORTES} />
          </CampoFormulario>

          <CampoFormulario icon={<MapPin className="size-[18px]" aria-hidden />} label="Dónde" htmlFor="ubicacion">
            <SelectorUbicacion id="ubicacion" value={ubicacion} onChange={setUbicacion} />
          </CampoFormulario>

          <div className="grid grid-cols-2 divide-x divide-borde">
            <CampoFormulario
              icon={<CalendarDays className="size-[18px]" aria-hidden />}
              label="Cuándo"
              htmlFor="fecha"
              className="pr-4"
            >
              <SelectorFecha id="fecha" value={fecha} onChange={setFecha} />
            </CampoFormulario>

            <CampoFormulario
              icon={<Clock className="size-[18px]" aria-hidden />}
              label="Franja"
              htmlFor="franja"
              className="pl-4"
            >
              <Selector id="franja" value={franja} onChange={setFranja} opciones={FRANJAS} />
            </CampoFormulario>
          </div>
        </div>

        <div className="border-t border-borde pt-5">
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.valor}
                type="button"
                onClick={() => setFecha(chip.valor)}
                className="h-11 rounded-full border border-borde bg-white px-4 text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
              >
                {chip.etiqueta}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={buscar}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-azul font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Buscar canchas
          </button>
        </div>
      </div>
    </section>
  );
}
