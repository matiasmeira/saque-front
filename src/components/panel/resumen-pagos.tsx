import { formatearPrecio } from "@/lib/formato";

function Tarjeta({ etiqueta, valor, nota, tono }: { etiqueta: string; valor: string; nota?: string; tono?: "negativo" | "destacado" }) {
  const color = tono === "negativo" ? "text-cancelado" : tono === "destacado" ? "text-disponible" : "text-tinta";
  return (
    <div className="rounded-card bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiqueta}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${color}`}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-grafito">{nota}</p>}
    </div>
  );
}

/**
 * Cuatro números, y ninguno es un "neto" sin rastro: turnos y buffet
 * son fuentes separadas (el buffet nunca pasa por el Split de Saque,
 * es plata del complejo tal cual — ver mocks/buffet.ts), la comisión
 * sale de sumar el flag generoComision de cada turno, y el neto es
 * la suma de las tres de arriba. Verde/rojo son colores de estado,
 * no de marca.
 */
export function ResumenPagos({
  facturacionTurnos,
  facturacionBuffet,
  comision,
  neto,
}: {
  facturacionTurnos: number;
  facturacionBuffet: number;
  comision: number;
  neto: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tarjeta etiqueta="Turnos" valor={formatearPrecio(facturacionTurnos)} />
      <Tarjeta etiqueta="Buffet" valor={formatearPrecio(facturacionBuffet)} nota="Nunca genera comisión — es plata del complejo" />
      <Tarjeta
        etiqueta="Comisión de Saque"
        valor={comision > 0 ? `−${formatearPrecio(comision)}` : formatearPrecio(0)}
        nota="Solo turnos que pasaron por el Split"
        tono="negativo"
      />
      <Tarjeta etiqueta="Neto" valor={formatearPrecio(neto)} nota="Turnos + buffet − comisión" tono="destacado" />
    </div>
  );
}
