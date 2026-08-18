"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatearPrecio } from "@/lib/formato";
import type { PuntoFacturacionDiariaDto } from "@/lib/api/tipos/reportes";

/**
 * Facturación día a día, con la línea del período anterior superpuesta en gris.
 *
 * El backend manda la serie ya PAREADA: cada punto trae el monto del día N del
 * período actual junto al del día N del anterior. Antes acá se recibían dos
 * arrays y se alineaban por índice; ahora no hay nada que alinear, la serie va
 * derecho a Recharts.
 *
 * El eje sigue siendo "día N del período" y no la fecha calendario: el período
 * anterior cae en otro mes y alinearlos por fecha real no significaría nada.
 * `diaIndice` viene 0-based, se muestra 1-based.
 */
export function GraficoFacturacion({ serie }: { serie: PuntoFacturacionDiariaDto[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-borde)" vertical={false} />
          <XAxis
            dataKey="diaIndice"
            tickFormatter={(d) => `D${Number(d) + 1}`}
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
            formatter={(value, name) => [
              formatearPrecio(Number(value) || 0),
              name === "montoActual" ? "Este período" : "Período anterior",
            ]}
            labelFormatter={(d) => `Día ${Number(d) + 1}`}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--color-borde)", fontSize: 13 }}
          />
          <Line type="monotone" dataKey="montoAnterior" stroke="var(--color-grafito)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          <Line type="monotone" dataKey="montoActual" stroke="var(--color-azul)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
