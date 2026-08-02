"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin } from "lucide-react";
import { DEPORTES } from "@/mocks/deportes";
import { ZONAS } from "@/mocks/zonas";
import { FRANJAS } from "@/mocks/franjas";
import { CampoFormulario } from "@/components/saque/campo-formulario";
import { Selector } from "@/components/saque/selector";
import { SelectorFecha, proximosDias } from "@/components/saque/selector-fecha";

/**
 * El buscador de la home.
 *
 * Arranca con valores usables sin esperar nada: "Dónde" nace en
 * "Cerca mío" (primera opción del mock) y no depende de permiso de
 * geolocalización ni de ningún dato que llegue después. La home
 * nunca muestra un estado de carga como protagonista.
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
  const chips = [
    dias[0],
    dias[1],
    dias.find((d) => d.fecha.getDay() === 6)!,
    dias.find((d) => d.fecha.getDay() === 0)!,
  ];

  const [deporte, setDeporte] = useState(DEPORTES[0].valor);
  const [zona, setZona] = useState(ZONAS[0].valor);
  const [fecha, setFecha] = useState(dias[0].valor);
  const [franja, setFranja] = useState(FRANJAS[2].valor);

  function buscar() {
    const params = new URLSearchParams({ deporte, zona, fecha, franja });
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

          <CampoFormulario icon={<MapPin className="size-[18px]" aria-hidden />} label="Dónde" htmlFor="zona">
            <Selector id="zona" value={zona} onChange={setZona} opciones={ZONAS} />
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
