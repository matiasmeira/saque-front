"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin, SlidersHorizontal } from "lucide-react";
import { DEPORTES } from "@/lib/deportes";
import { FRANJAS } from "@/mocks/franjas";
import { Selector } from "@/components/saque/selector";
import { SelectorFecha } from "@/components/saque/selector-fecha";
import { SelectorUbicacion, type Ubicacion } from "@/components/saque/selector-ubicacion";
import { FilterSheet } from "@/components/saque/filter-sheet";

/**
 * Barra de filtros compacta de A2 — versión horizontal de los
 * mismos campos que A1 (Selector, SelectorFecha, SelectorUbicacion), no una
 * segunda implementación. Cada cambio renavega /buscar con los params
 * actualizados: es lo más simple que sigue siendo real (sin estado
 * duplicado del lado del cliente que se pueda desincronizar de la URL).
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
  const [sheetAbierta, setSheetAbierta] = useState(false);
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
    <>
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

          <button
            type="button"
            onClick={() => setSheetAbierta(true)}
            className="flex h-[46px] items-center gap-2 rounded-full border border-azul px-6 text-sm font-semibold text-azul transition-colors hover:bg-azul hover:text-white"
          >
            <SlidersHorizontal className="size-[18px]" aria-hidden />
            Más filtros
          </button>
        </div>
      </div>

      <FilterSheet open={sheetAbierta} onClose={() => setSheetAbierta(false)} />
    </>
  );
}
