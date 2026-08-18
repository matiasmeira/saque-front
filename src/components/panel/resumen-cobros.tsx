import { formatearPrecio } from "@/lib/formato";

function Tarjeta({ etiqueta, valor, nota, destacado }: { etiqueta: string; valor: string; nota?: string; destacado?: boolean }) {
  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className={`mt-1.5 font-display text-3xl font-extrabold tabular-nums ${destacado ? "text-disponible" : "text-tinta"}`}>{valor}</p>
      {nota && <p className="mt-2 text-xs text-grafito">{nota}</p>}
    </div>
  );
}

/**
 * De dónde vino la plata del período: turnos por un lado, buffet por el otro.
 *
 * Reemplaza al resumen de cuatro números del mock, que sumaba una comisión de
 * plataforma y un neto — el backend no tiene comisiones, ni liquidaciones, ni
 * Split (B3). Lo que quedó son las dos fuentes que sí existen y su suma.
 *
 * Las dos vienen de endpoints distintos y cuentan cosas distintas: turnos son
 * reservas FINALIZADA (`/reportes/facturacion`) y buffet son ventas CONFIRMADA
 * (`/buffet/ventas/metricas`). Ninguno incluye al otro, así que sumarlos no
 * cuenta nada dos veces.
 *
 * `null` es "esa consulta falló", no cero: se muestra un guión y el total se
 * apaga, porque un total al que le falta una de las dos mitades es un número
 * equivocado, no un número incompleto.
 */
export function ResumenCobros({ turnos, buffet }: { turnos: number | null; buffet: number | null }) {
  const completo = turnos !== null && buffet !== null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Tarjeta
        etiqueta="Turnos"
        valor={turnos === null ? "—" : formatearPrecio(turnos)}
        nota={turnos === null ? "No se pudo cargar" : "Reservas finalizadas en el período"}
      />
      <Tarjeta
        etiqueta="Buffet"
        valor={buffet === null ? "—" : formatearPrecio(buffet)}
        nota={buffet === null ? "No se pudo cargar" : "Ventas confirmadas — las canceladas no suman"}
      />
      <Tarjeta
        etiqueta="Total cobrado"
        valor={completo ? formatearPrecio(turnos + buffet) : "—"}
        nota={completo ? undefined : "Falta una de las dos fuentes"}
        destacado={completo}
      />
    </div>
  );
}
