"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin } from "lucide-react";
import { DEPORTES } from "@/lib/deportes";
import { FRANJAS } from "@/lib/franjas";
import { Selector } from "@/components/canche/selector";
import { SelectorFecha } from "@/components/canche/selector-fecha";
import { SelectorUbicacion, type Ubicacion } from "@/components/canche/selector-ubicacion";

/**
 * Barra de filtros compacta de A2 — versión horizontal de los
 * mismos campos que A1 (Selector, SelectorFecha, SelectorUbicacion), no una
 * segunda implementación. Cada cambio renavega /buscar con los params
 * actualizados: es lo más simple que sigue siendo real (sin estado
 * duplicado del lado del cliente que se pueda desincronizar de la URL).
 *
 * Estos cuatro campos son TODO lo que `GET /publico/complejos` sabe filtrar
 * (deporte, fecha, hora y geo). Había además un botón "Más filtros" que abría
 * una hoja con precio, superficie, techada y servicios: ninguno de esos filtros
 * existe en el endpoint, y superficie y techada ni siquiera existen en el
 * modelo. Los controles se movían pero el listado nunca cambiaba, así que la
 * hoja se sacó — ver B8 en PLAN_CONEXION.md.
 */
type Filtros = { deporte: string; fecha: string; franja: string };

function CampoCompacto({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="min-w-[130px] flex-1">
      <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wide text-grafito">{label}</label>
      <div className="flex items-center gap-2 rounded-input border border-borde bg-humo px-3 py-2">
        <span className="shrink-0 text-azul">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export function FiltrosResultados({
  deporte,
  fecha,
  franja,
  ubicacion,
}: Filtros & { ubicacion: Ubicacion | null }) {
  const router = useRouter();
  const valores: Filtros = { deporte, fecha, franja };

  function navegar(filtros: Filtros, nuevaUbicacion: Ubicacion | null) {
    const params = new URLSearchParams(filtros);
    if (nuevaUbicacion) {
      params.set("lat", String(nuevaUbicacion.lat));
      params.set("lng", String(nuevaUbicacion.lng));
      params.set("lugar", nuevaUbicacion.etiqueta);
    }
    router.push(`/buscar?${params.toString()}`);
  }

  function actualizar(cambios: Partial<Filtros>) {
    navegar({ ...valores, ...cambios }, ubicacion);
  }

  return (
    <div className="rounded-card bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <CampoCompacto icon={<Dumbbell className="size-[18px]" aria-hidden />} label="Deporte">
            <Selector id="f-deporte" value={deporte} onChange={(v) => actualizar({ deporte: v })} opciones={DEPORTES} />
          </CampoCompacto>

          <CampoCompacto icon={<MapPin className="size-[18px]" aria-hidden />} label="Ubicación">
            <SelectorUbicacion
              id="f-ubicacion"
              value={ubicacion}
              onChange={(nueva) => navegar(valores, nueva)}
            />
          </CampoCompacto>

          <CampoCompacto icon={<CalendarDays className="size-[18px]" aria-hidden />} label="Fecha">
            <SelectorFecha id="f-fecha" value={fecha} onChange={(v) => actualizar({ fecha: v })} />
          </CampoCompacto>

          <CampoCompacto icon={<Clock className="size-[18px]" aria-hidden />} label="Horario">
            <Selector id="f-franja" value={franja} onChange={(v) => actualizar({ franja: v })} opciones={FRANJAS} />
          </CampoCompacto>
      </div>
    </div>
  );
}
