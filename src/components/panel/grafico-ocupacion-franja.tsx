"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatearPorcentaje } from "@/lib/formato";
import type { FranjaHoraria } from "@/lib/api/tipos/comunes";
import type { OcupacionPorFranjaDto } from "@/lib/api/tipos/reportes";

/**
 * Los rangos son criterio del reporte, no una regla de negocio: el backend
 * define mañana 06–13, tarde 13–19 y noche 19–24 (FranjaHoraria.java).
 */
const ETIQUETA_FRANJA: Record<FranjaHoraria, string> = {
  MANANA: "Mañana (6–13)",
  TARDE: "Tarde (13–19)",
  NOCHE: "Noche (19–24)",
};

/**
 * Ocupación por franja horaria — para que el dueño vea sus picos y sus horas
 * muertas de un vistazo.
 *
 * El porcentaje llega con dos decimales (43.75); la barra usa el valor crudo y
 * sólo el texto se acorta. El `horasReservadas` / `horasDisponibles` que el
 * backend usó para calcularlo va en el tooltip, que es donde alguien va a
 * querer saber si un 100% son ocho horas o media.
 */
export function GraficoOcupacionFranja({ datos }: { datos: OcupacionPorFranjaDto[] }) {
  const puntos = datos.map((d) => ({
    franja: ETIQUETA_FRANJA[d.franja] ?? d.franja,
    porcentaje: d.porcentajeOcupacion.actual,
    horasReservadas: d.horasReservadas.actual,
    horasDisponibles: d.horasDisponibles.actual,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={puntos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-borde)" vertical={false} />
          <XAxis dataKey="franja" tick={{ fontSize: 12, fill: "var(--color-grafito)" }} axisLine={{ stroke: "var(--color-borde)" }} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--color-grafito)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${formatearPorcentaje(Number(value) || 0)} — ${Math.round(Number(item?.payload?.horasReservadas ?? 0))} de ${Math.round(Number(item?.payload?.horasDisponibles ?? 0))} h`,
              "Ocupación",
            ]}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--color-borde)", fontSize: 13 }}
          />
          <Bar dataKey="porcentaje" fill="var(--color-celeste)" radius={[6, 6, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
