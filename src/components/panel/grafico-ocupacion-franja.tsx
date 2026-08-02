"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OcupacionFranja } from "@/mocks/reportes";

/** Ocupación por franja horaria — para que el dueño vea sus picos y sus horas muertas de un vistazo. */
export function GraficoOcupacionFranja({ datos }: { datos: OcupacionFranja[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Tooltip formatter={(value) => [`${value}%`, "Ocupación"]} contentStyle={{ borderRadius: 10, border: "1px solid var(--color-borde)", fontSize: 13 }} />
          <Bar dataKey="porcentaje" fill="var(--color-celeste)" radius={[6, 6, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
