"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatearPrecio } from "@/lib/formato";
import type { PuntoSerie } from "@/mocks/reportes";

/**
 * Facturación día a día, con la línea del período anterior
 * superpuesta en gris para comparar — se indexan por "día N del
 * período" (no por fecha calendario) porque el período anterior cae
 * en otro mes, no tiene sentido alinearlos por fecha real.
 */
export function GraficoFacturacion({ actual, anterior }: { actual: PuntoSerie[]; anterior: PuntoSerie[] }) {
  const datos = actual.map((punto, i) => ({
    dia: i + 1,
    actual: punto.monto,
    anterior: anterior[i]?.monto ?? 0,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-borde)" vertical={false} />
          <XAxis
            dataKey="dia"
            tickFormatter={(d) => `D${d}`}
            tick={{ fontSize: 11, fill: "var(--color-grafito)" }}
            axisLine={{ stroke: "var(--color-borde)" }}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
            tick={{ fontSize: 11, fill: "var(--color-grafito)" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value, name) => [formatearPrecio(Number(value) || 0), name === "actual" ? "Este período" : "Período anterior"]}
            labelFormatter={(d) => `Día ${d}`}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--color-borde)", fontSize: 13 }}
          />
          <Line type="monotone" dataKey="anterior" name="anterior" stroke="var(--color-grafito)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          <Line type="monotone" dataKey="actual" name="actual" stroke="var(--color-azul)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
