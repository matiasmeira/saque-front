/**
 * Pagos y liquidaciones (C7) — la pantalla más sensible del panel:
 * acá el dueño audita cuánto le cobra la plataforma.
 *
 * Corrección de modelo: el medio de pago y la comisión de Saque son
 * INDEPENDIENTES. El medio (metodoPago) es uno de los 5 reales del
 * backend. La comisión no se deriva del medio — se cobra solo si la
 * seña pasó por el Split de Saque (generoComision), algo que puede
 * ser false aunque el medio haya sido MERCADO_PAGO (el dueño puede
 * cobrar con su propio Point, sin pasar por Saque). Por eso ya NO
 * existe una distinción "cobrado online vs. cobrado en mostrador":
 * no existe en el backend y no es confiable — MercadoPago puede
 * cobrarse presencial con un Point.
 *
 * Se genera a partir de PANEL_HISTORIAL (clientes.ts) — son las
 * mismas reservas que ya aparecen en la ficha de cada cliente (C6),
 * ahora vistas desde el lado de la plata.
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { hoyISO, sumarDias } from "@/lib/fecha";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_CANCHAS, type Cancha } from "@/mocks/canchas";
import { PANEL_CLIENTES, PANEL_HISTORIAL, type Cliente } from "@/mocks/clientes";

// Coincide con MetodoPago del backend — no confundir con la comisión,
// que es un flag aparte (generoComision).
export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO" | "TARJETA_DEBITO" | "TARJETA_CREDITO";

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "EFECTIVO", etiqueta: "Efectivo" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia" },
  { valor: "MERCADO_PAGO", etiqueta: "Mercado Pago" },
  { valor: "TARJETA_DEBITO", etiqueta: "Tarjeta de débito" },
  { valor: "TARJETA_CREDITO", etiqueta: "Tarjeta de crédito" },
];

export type EstadoLiquidacion = "acreditado" | "en_camino" | "pendiente";

export type Pago = {
  reservaId: string;
  fecha: string;
  clienteNombre: string;
  canchaNombre: string;
  totalTurno: number;
  metodoPago: MetodoPago;
  /** true solo si esta reserva pasó por el Split de Saque — independiente del metodoPago */
  generoComision: boolean;
  /** $450 si generoComision, 0 si no */
  comision: number;
  /** solo relevante cuando generoComision es true: si no, no hay nada que Saque tenga que liquidar */
  estadoLiquidacion: EstadoLiquidacion;
  fechaAcreditacion?: string;
};

// Confirmado: comisión de monto fijo, no porcentual.
export const COMISION_FIJA = 450;

/** Qué tan probable es cada medio — las canchas con seña tienden más a Mercado Pago, pero cualquiera puede pagarse de cualquier forma. */
function elegirMetodo(cancha: Cancha, rand: () => number): MetodoPago {
  const r = rand();
  if (cancha.montoSena > 0) {
    if (r < 0.5) return "MERCADO_PAGO";
    if (r < 0.68) return "EFECTIVO";
    if (r < 0.82) return "TRANSFERENCIA";
    if (r < 0.92) return "TARJETA_DEBITO";
    return "TARJETA_CREDITO";
  }
  if (r < 0.38) return "EFECTIVO";
  if (r < 0.6) return "TRANSFERENCIA";
  if (r < 0.8) return "MERCADO_PAGO";
  if (r < 0.9) return "TARJETA_DEBITO";
  return "TARJETA_CREDITO";
}

function generarPago(reservaId: string, fecha: string, cliente: Cliente, cancha: Cancha, totalTurno: number): Pago {
  const rand = crearRand(hashSeed(`pago-${reservaId}`));

  const metodoPago = elegirMetodo(cancha, rand);

  // Independiente del medio: si fue Mercado Pago Y el complejo está
  // en plan comisión, LA MAYORÍA pasa por el Split — pero no todas,
  // porque el dueño puede cobrar con su propio Point sin que Saque
  // se entere ni cobre nada. Con cualquier otro medio, nunca genera
  // comisión (no pasó por Saque).
  const puedeGenerarComision = metodoPago === "MERCADO_PAGO" && PANEL_COMPLEJO.plan === "comision";
  const generoComision = puedeGenerarComision && rand() < 0.75;
  const comision = generoComision ? COMISION_FIJA : 0;

  let estadoLiquidacion: EstadoLiquidacion;
  let fechaAcreditacion: string | undefined;
  if (!generoComision) {
    // Nada pasó por el Split — no hay nada que Saque tenga que liquidar.
    estadoLiquidacion = "acreditado";
  } else if (rand() < 0.1) {
    // Una liquidación real a veces se traba — variedad a propósito.
    estadoLiquidacion = "pendiente";
  } else {
    const estimada = sumarDias(fecha, 2);
    if (estimada <= hoyISO()) {
      estadoLiquidacion = "acreditado";
      fechaAcreditacion = estimada;
    } else {
      estadoLiquidacion = "en_camino";
      fechaAcreditacion = estimada;
    }
  }

  return {
    reservaId,
    fecha,
    clienteNombre: cliente.nombre,
    canchaNombre: cancha.nombre,
    totalTurno,
    metodoPago,
    generoComision,
    comision,
    estadoLiquidacion,
    fechaAcreditacion,
  };
}

// TODO backend: el DTO de pagos por reserva tiene que incluir el
// flag generoComision (o pasoPorSplit) además del metodoPago.
// Confirmar que existe; si no, agregarlo — la comisión se define por
// ese flag, nunca inferida del medio. La liquidación real viene de
// la API de MercadoPago (Split de Pagos); acá va simulada.
export const PANEL_PAGOS: Pago[] = PANEL_HISTORIAL.filter((h) => h.estado === "ocupado")
  .map((h) => {
    const cliente = PANEL_CLIENTES.find((c) => c.id === h.clienteId)!;
    const cancha = PANEL_CANCHAS.find((c) => c.id === h.canchaId)!;
    return generarPago(h.id, h.fecha, cliente, cancha, h.monto);
  })
  .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

export function pagosDelPeriodo(pagos: Pago[], desde: string, hasta: string): Pago[] {
  return pagos.filter((p) => p.fecha >= desde && p.fecha <= hasta);
}
