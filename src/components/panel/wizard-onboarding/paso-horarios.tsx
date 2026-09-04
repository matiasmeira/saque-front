"use client";

import { useState } from "react";
import { FormHorariosAtencion } from "@/components/panel/form-horarios-atencion";
import { horariosDelPatron, type PatronHorario } from "@/lib/panel/wizard-onboarding";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

const PATRONES: { valor: PatronHorario; etiqueta: string; descripcion: string }[] = [
  { valor: "mismo", etiqueta: "Mismo horario todos los días", descripcion: "Una franja única, los 7 días." },
  {
    valor: "semana-finde",
    etiqueta: "Lunes a viernes y fin de semana distinto",
    descripcion: "Una franja para la semana, otra para sábado y domingo.",
  },
  { valor: "dia-por-dia", etiqueta: "Día por día", descripcion: "Cargo cada día por separado." },
];

/**
 * Paso 3 del wizard. Los radios de patrón sólo deciden con QUÉ valores se
 * pre-carga `FormHorariosAtencion` — el `key={patron}` lo remonta al cambiar
 * de patrón (mismo truco que `PrecioBaseCancha` con `key={cancha.id}` en
 * /panel/precios), así que la validación y el guardado de ese formulario no
 * se tocan.
 */
export function PasoHorarios({
  horarios,
  guardando,
  error,
  onGuardar,
}: {
  horarios: HorarioAtencionDto[];
  guardando: boolean;
  error: string | null;
  onGuardar: (horarios: HorarioAtencionDto[]) => void;
}) {
  const [patron, setPatron] = useState<PatronHorario>("dia-por-dia");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Horarios de atención</h2>
        <p className="mt-1 text-sm text-grafito">Alimentan la disponibilidad y el % de ocupación de Reportes.</p>
      </div>

      <div className="space-y-2">
        {PATRONES.map((p) => (
          <label
            key={p.valor}
            className={`flex cursor-pointer items-start gap-3 rounded-input border p-3 transition-colors ${
              patron === p.valor ? "border-azul bg-celeste-suave/40" : "border-borde hover:border-azul"
            }`}
          >
            <input
              type="radio"
              name="patron-horario"
              checked={patron === p.valor}
              onChange={() => setPatron(p.valor)}
              className="mt-0.5 size-4 shrink-0 accent-azul"
            />
            <span>
              <span className="block text-sm font-semibold text-tinta">{p.etiqueta}</span>
              <span className="block text-xs text-grafito">{p.descripcion}</span>
            </span>
          </label>
        ))}
      </div>

      <FormHorariosAtencion
        key={patron}
        horarios={horariosDelPatron(patron, horarios)}
        guardando={guardando}
        onGuardar={onGuardar}
      />

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
