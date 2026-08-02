/**
 * C8 — el argumento de retención: números que le muestran al dueño
 * que el complejo le rinde, siempre contra el período anterior (un
 * número solo no convence, "+12% vs. el mes pasado" sí).
 *
 * Tipado contra los 4 DTOs reales del backend — cada bloque del
 * reporte es una respuesta independiente, envuelta en el genérico
 * Comparativo<T> (actual/anterior, mismo período de duración). No
 * hay un "DatosPeriodo" monolítico: Facturación, Ocupación, Horarios
 * pedidos y Clientes son 4 requests distintos en el backend real.
 *
 * TODO: reporte de demanda insatisfecha (búsquedas sin lugar) — no
 * en esta versión. Hace falta tráfico real de búsquedas del
 * buscador (A2) para que tenga sentido, no se puede mockear con
 * algo de valor.
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { diasEntre, sumarDias } from "@/lib/fecha";
import { PANEL_CANCHAS } from "@/mocks/canchas";
import { PANEL_CLIENTES } from "@/mocks/clientes";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";
import { diaSemanaDeFecha, type DiaSemana } from "@/mocks/tarifas";

export type Comparativo<T> = { actual: T; anterior: T };

export type PuntoSerie = { fecha: string; monto: number };
export type DesgloseMetodo = { metodo: MetodoPago; monto: number };

export type FacturacionReporteResponse = {
  facturacionTotal: number;
  /** por los 5 métodos reales — no existe una distinción online/mostrador en el backend */
  desglosePorMetodo: DesgloseMetodo[];
  serieFacturacion: PuntoSerie[];
};

export type Franja = "Mañana" | "Tarde" | "Noche";
export type OcupacionFranja = { franja: Franja; porcentaje: number };
export type OcupacionCancha = { canchaId: number; canchaNombre: string; porcentaje: number };

export type OcupacionReporteResponse = {
  ocupacionGeneral: number;
  ocupacionPorFranja: OcupacionFranja[];
  ocupacionPorCancha: OcupacionCancha[];
  /** viene del backend tal cual — se muestra como nota al pie del bloque de ocupación */
  notaMetodologica: string;
};

export type HorarioPedido = { dia: DiaSemana; hora: string; reservas: number };

export type HorariosPedidosReporteResponse = {
  horariosMasPedidos: HorarioPedido[];
};

export type TopCliente = { nombre: string; reservas: number };

export type ClientesReporteResponse = {
  clientesNuevos: number;
  totalAusencias: number;
  topClientes: TopCliente[];
};

export type Reporte = {
  facturacion: Comparativo<FacturacionReporteResponse>;
  ocupacion: Comparativo<OcupacionReporteResponse>;
  horariosPedidos: Comparativo<HorariosPedidosReporteResponse>;
  clientes: Comparativo<ClientesReporteResponse>;
};

function shuffle<T>(lista: T[], rand: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const HORAS_PICO = ["18:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
const DIAS_SEMANA_ORDEN: DiaSemana[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

/** Un único generador determinístico por período — los 4 DTOs se recortan de acá para que los números queden consistentes entre sí (ej. desglosePorMetodo suma cerca de facturacionTotal). */
function generarDatosPeriodo(desde: string, hasta: string) {
  const dias = diasEntre(desde, hasta);
  const rand = crearRand(hashSeed(`reporte-${desde}-${hasta}`));

  // Facturación día a día — más alta los fines de semana, con
  // variación diaria para que el gráfico no sea una línea recta.
  const promedioDiario = 55000 + rand() * 45000;
  const serieFacturacion: PuntoSerie[] = [];
  let facturacionTotal = 0;
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    const esFinde = diaSemanaDeFecha(fecha) === "sab" || diaSemanaDeFecha(fecha) === "dom";
    const variacion = 0.55 + rand() * 0.85;
    const monto = Math.round((promedioDiario * variacion * (esFinde ? 1.4 : 1)) / 500) * 500;
    serieFacturacion.push({ fecha, monto });
    facturacionTotal += monto;
  }

  // Desglose por método real — pesos base + variación por período,
  // no fuerza que sumen exactamente facturacionTotal (un dashboard
  // real tiene el mismo margen de redondeo).
  const pesosBase: Record<MetodoPago, number> = {
    MERCADO_PAGO: 0.34,
    EFECTIVO: 0.28,
    TRANSFERENCIA: 0.18,
    TARJETA_DEBITO: 0.12,
    TARJETA_CREDITO: 0.08,
  };
  const desglosePorMetodo: DesgloseMetodo[] = METODOS_PAGO.map(({ valor }) => {
    const variacion = 0.78 + rand() * 0.44;
    return { metodo: valor, monto: Math.round((facturacionTotal * pesosBase[valor] * variacion) / 500) * 500 };
  }).sort((a, b) => b.monto - a.monto);

  const notaMetodologica =
    "La ocupación se calcula sobre las horas de atención publicadas por cada cancha activa, sin contar bloqueos por mantenimiento.";

  const ocupacionGeneral = Math.round(38 + rand() * 38);

  const ocupacionPorFranja: OcupacionFranja[] = [
    { franja: "Mañana", porcentaje: Math.round(12 + rand() * 23) },
    { franja: "Tarde", porcentaje: Math.round(32 + rand() * 28) },
    { franja: "Noche", porcentaje: Math.round(58 + rand() * 35) },
  ];

  const ocupacionPorCancha: OcupacionCancha[] = PANEL_CANCHAS.filter((c) => c.isActive)
    .map((c) => ({ canchaId: c.id, canchaNombre: c.nombre, porcentaje: Math.round(28 + rand() * 58) }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  const combinaciones = DIAS_SEMANA_ORDEN.flatMap((dia) => HORAS_PICO.map((hora) => ({ dia, hora })));
  const elegidos = shuffle(combinaciones, rand).slice(0, 5);
  const base = 9 + Math.floor(rand() * 6);
  const horariosMasPedidos: HorarioPedido[] = elegidos
    .map((combo, i) => ({ ...combo, reservas: Math.max(2, base - i * (1 + Math.floor(rand() * 2))) }))
    .sort((a, b) => b.reservas - a.reservas);

  const clientesNuevos = 1 + Math.floor(rand() * (3 + dias / 6));
  const totalAusencias = Math.floor(rand() * (2 + dias / 5));

  const topClientes: TopCliente[] = shuffle(PANEL_CLIENTES, rand)
    .slice(0, 5)
    .map((c) => ({ nombre: c.nombre, reservas: 2 + Math.floor(rand() * (4 + dias / 4)) }))
    .sort((a, b) => b.reservas - a.reservas);

  return {
    facturacionTotal,
    desglosePorMetodo,
    serieFacturacion,
    ocupacionGeneral,
    ocupacionPorFranja,
    ocupacionPorCancha,
    notaMetodologica,
    horariosMasPedidos,
    clientesNuevos,
    totalAusencias,
    topClientes,
  };
}

export function generarReporte(desde: string, hasta: string): Reporte {
  const dias = diasEntre(desde, hasta);
  const desdeAnterior = sumarDias(desde, -dias);
  const hastaAnterior = sumarDias(desde, -1);
  const actual = generarDatosPeriodo(desde, hasta);
  const anterior = generarDatosPeriodo(desdeAnterior, hastaAnterior);

  return {
    facturacion: {
      actual: { facturacionTotal: actual.facturacionTotal, desglosePorMetodo: actual.desglosePorMetodo, serieFacturacion: actual.serieFacturacion },
      anterior: { facturacionTotal: anterior.facturacionTotal, desglosePorMetodo: anterior.desglosePorMetodo, serieFacturacion: anterior.serieFacturacion },
    },
    ocupacion: {
      actual: {
        ocupacionGeneral: actual.ocupacionGeneral,
        ocupacionPorFranja: actual.ocupacionPorFranja,
        ocupacionPorCancha: actual.ocupacionPorCancha,
        notaMetodologica: actual.notaMetodologica,
      },
      anterior: {
        ocupacionGeneral: anterior.ocupacionGeneral,
        ocupacionPorFranja: anterior.ocupacionPorFranja,
        ocupacionPorCancha: anterior.ocupacionPorCancha,
        notaMetodologica: anterior.notaMetodologica,
      },
    },
    horariosPedidos: {
      actual: { horariosMasPedidos: actual.horariosMasPedidos },
      anterior: { horariosMasPedidos: anterior.horariosMasPedidos },
    },
    clientes: {
      actual: { clientesNuevos: actual.clientesNuevos, totalAusencias: actual.totalAusencias, topClientes: actual.topClientes },
      anterior: { clientesNuevos: anterior.clientesNuevos, totalAusencias: anterior.totalAusencias, topClientes: anterior.topClientes },
    },
  };
}
