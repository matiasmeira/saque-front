"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEPORTES } from "@/mocks/deportes";
import { proximosDias } from "@/components/saque/selector-fecha";
import { formatearPrecio } from "@/lib/formato";
import { aHHMM, aMinutos, ocupadoConVariacion, segmentosDelDia } from "@/lib/disponibilidad";
import type { Complejo } from "@/mocks/complejos";

/**
 * La grilla de disponibilidad de la ficha (A3): una cancha por fila,
 * igual que la agenda que ya conoce el dueño en su panel (C2) —
 * mismo lenguaje visual, pero de solo lectura y pública.
 *
 * Casilleros unidos, no uno por hora: un tramo reservado corrido
 * dibuja UNA barra continua, con precisión de minutos reales (no
 * redondeada a la hora). Las barras no llevan el rango de horario
 * escrito adentro — la hora exacta vive en el aria-label y, al
 * reservar, en el checkout; acá el color ya dice todo lo que hace
 * falta para explorar de un vistazo.
 *
 * El filtro de deporte importa acá y no en A2 porque en A2 el
 * deporte ya vino elegido desde el buscador — acá, en la ficha de
 * un complejo que puede ofrecer varios, hay que poder acotar.
 *
 * La fecha se puede pasar con las flechas. El mock solo tiene la
 * ocupación de "hoy"; para no repetir el mismo dibujo todos los
 * días, ocupadoConVariacion la desplaza de forma determinística
 * (ver TODO backend en src/lib/disponibilidad.ts).
 */
const PX_POR_HORA = 72;
const ANCHO_ETIQUETA = 176;

export function GrillaDisponibilidad({ complejo }: { complejo: Complejo }) {
  const dias = proximosDias(7);
  const [indiceDia, setIndiceDia] = useState(0);
  const [deporteFiltro, setDeporteFiltro] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fecha = dias[indiceDia];

  const deportesDelComplejo = Array.from(new Set(complejo.canchas.map((c) => c.deporte)));

  const horarioHoy = complejo.horarioAtencion[0];
  const [desdeStr, hastaStr] = horarioHoy.horario.split(" a ").map((s) => s.trim());
  const abre = `${desdeStr.padStart(2, "0")}:00`;
  const cierra = `${hastaStr.padStart(2, "0")}:00`;
  const abreMin = aMinutos(abre);
  const cierraCrudo = aMinutos(cierra);
  const cierraMin = cierraCrudo <= abreMin ? cierraCrudo + 1440 : cierraCrudo;
  const totalMin = cierraMin - abreMin;
  const anchoPista = (totalMin / 60) * PX_POR_HORA;

  const canchasFiltradas = deporteFiltro ? complejo.canchas.filter((c) => c.deporte === deporteFiltro) : complejo.canchas;

  const filas = canchasFiltradas.map((cancha) => ({
    cancha,
    segmentos: segmentosDelDia(ocupadoConVariacion(cancha.ocupado, indiceDia), abre, cierra),
  }));

  const horas: number[] = [];
  for (let m = Math.ceil(abreMin / 60) * 60; m < cierraMin; m += 60) horas.push(m);

  const primerLibreMin = useMemo(() => {
    let minimo: number | null = null;
    for (const { segmentos } of filas) {
      const libre = segmentos.find((s) => s.libre);
      if (libre && (minimo === null || libre.desde < minimo)) minimo = libre.desde;
    }
    return minimo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complejo.id, indiceDia, deporteFiltro]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft =
        primerLibreMin !== null ? Math.max(0, ((primerLibreMin - abreMin) / 60) * PX_POR_HORA - PX_POR_HORA) : 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primerLibreMin]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDeporteFiltro(null)}
            aria-pressed={deporteFiltro === null}
            className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
              deporteFiltro === null
                ? "bg-celeste-suave text-tinta"
                : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
            }`}
          >
            Todos
          </button>
          {deportesDelComplejo.map((valor) => {
            const activo = deporteFiltro === valor;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setDeporteFiltro(valor)}
                aria-pressed={activo}
                className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  activo
                    ? "bg-celeste-suave text-tinta"
                    : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
                }`}
              >
                {DEPORTES.find((d) => d.valor === valor)?.etiqueta ?? valor}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIndiceDia((i) => Math.max(0, i - 1))}
            disabled={indiceDia === 0}
            aria-label="Ver día anterior"
            className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo disabled:opacity-30"
          >
            <ChevronLeft className="size-[18px]" aria-hidden />
          </button>
          <span className="min-w-[100px] text-center font-display text-sm font-bold text-tinta">
            {fecha.etiqueta}
          </span>
          <button
            type="button"
            onClick={() => setIndiceDia((i) => Math.min(dias.length - 1, i + 1))}
            disabled={indiceDia === dias.length - 1}
            aria-label="Ver día siguiente"
            className="flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo disabled:opacity-30"
          >
            <ChevronRight className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-card bg-white">
        <div ref={scrollRef} className="overflow-x-auto">
          <div style={{ width: ANCHO_ETIQUETA + anchoPista }}>
            <div className="flex border-b border-borde bg-humo">
              <div
                className="sticky left-0 z-10 shrink-0 border-r border-borde bg-humo"
                style={{ width: ANCHO_ETIQUETA }}
              />
              <div className="relative" style={{ width: anchoPista, height: 32 }}>
                {horas.map((m) => (
                  <span
                    key={m}
                    className="absolute top-0 flex h-full items-center text-xs text-grafito"
                    style={{ left: ((m - abreMin) / 60) * PX_POR_HORA + 6 }}
                  >
                    {aHHMM(m).slice(0, 2)}
                  </span>
                ))}
              </div>
            </div>

            <div className="divide-y divide-borde">
              {filas.map(({ cancha, segmentos }) => (
                <div key={cancha.id} className="flex">
                  <div
                    className="sticky left-0 z-10 shrink-0 border-r border-borde bg-white p-3"
                    style={{ width: ANCHO_ETIQUETA }}
                  >
                    <p className="font-display text-sm font-bold text-tinta">
                      {cancha.nombre} · {DEPORTES.find((d) => d.valor === cancha.deporte)?.abreviatura}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-grafito">
                      {cancha.superficie} · {cancha.techada ? "Techada" : "Descubierta"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-tinta">{formatearPrecio(cancha.precio)}</p>
                  </div>

                  <div className="flex" style={{ width: anchoPista }}>
                    {segmentos.map((s) => {
                      const ancho = ((s.hasta - s.desde) / 60) * PX_POR_HORA;
                      const horaInicio = aHHMM(s.desde);
                      const horaFin = aHHMM(s.hasta);

                      if (!s.libre) {
                        return (
                          <div
                            key={s.desde}
                            className="my-1.5 mr-1 rounded-md bg-ocupado-suave"
                            style={{ width: ancho }}
                            aria-hidden
                          />
                        );
                      }

                      return (
                        <Link
                          key={s.desde}
                          href={`/reservar/${complejo.id}?cancha=${cancha.id}&fecha=${fecha.valor}&hora=${horaInicio}`}
                          aria-label={`Reservar ${cancha.nombre} el ${fecha.etiqueta} de ${horaInicio} a ${horaFin}`}
                          title={`${horaInicio}–${horaFin}`}
                          className="my-1.5 mr-1 rounded-md bg-disponible-suave transition-colors hover:bg-disponible"
                          style={{ width: ancho }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-6 text-sm text-grafito">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded bg-disponible-suave" aria-hidden />
          Disponible
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded bg-ocupado-suave" aria-hidden />
          Ocupado
        </span>
      </div>

      <p className="sr-only">
        Vista visual de disponibilidad. Para reservar con lector de pantalla, usá los campos de la
        sección Reservar más abajo.
      </p>
    </div>
  );
}
