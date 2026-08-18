import { apiFetch } from "../cliente";
import { construirQuery } from "../query";
import type {
  CierreCajaReporteResponse,
  ClientesReporteResponse,
  FacturacionReporteResponse,
  GastosReporteResponse,
  HorariosPedidosReporteResponse,
  OcupacionReporteResponse,
  ResultadoReporteResponse,
} from "../tipos/reportes";

/**
 * ReporteController — /api/v1/establecimientos/{estId}/reportes/*. OWNER / ADMIN.
 *
 * `desde` y `hasta` son REQUERIDOS en los siete y ambos inclusive (LocalDate).
 * El período anterior con el que compara cada respuesta lo calcula el backend:
 * el rango inmediatamente previo de igual duración. El front no lo manda ni lo
 * deduce.
 */

type Periodo = { desde: string; hasta: string };

const base = (estId: number) => `/api/v1/establecimientos/${estId}/reportes`;

export const reportes = {
  facturacion: (estId: number, { desde, hasta }: Periodo) =>
    apiFetch<FacturacionReporteResponse>(
      `${base(estId)}/facturacion${construirQuery({ desde, hasta })}`,
    ),

  ocupacion: (estId: number, { desde, hasta }: Periodo) =>
    apiFetch<OcupacionReporteResponse>(
      `${base(estId)}/ocupacion${construirQuery({ desde, hasta })}`,
    ),

  /** `topN` recorta el ranking; el backend usa 10 si no se manda. */
  horariosPedidos: (estId: number, { desde, hasta, topN }: Periodo & { topN?: number }) =>
    apiFetch<HorariosPedidosReporteResponse>(
      `${base(estId)}/horarios-pedidos${construirQuery({ desde, hasta, topN })}`,
    ),

  clientes: (estId: number, { desde, hasta, topN }: Periodo & { topN?: number }) =>
    apiFetch<ClientesReporteResponse>(
      `${base(estId)}/clientes${construirQuery({ desde, hasta, topN })}`,
    ),

  gastos: (estId: number, { desde, hasta }: Periodo) =>
    apiFetch<GastosReporteResponse>(
      `${base(estId)}/gastos${construirQuery({ desde, hasta })}`,
    ),

  resultado: (estId: number, { desde, hasta }: Periodo) =>
    apiFetch<ResultadoReporteResponse>(
      `${base(estId)}/resultado${construirQuery({ desde, hasta })}`,
    ),

  cierresCaja: (estId: number, { desde, hasta }: Periodo) =>
    apiFetch<CierreCajaReporteResponse>(
      `${base(estId)}/cierres-caja${construirQuery({ desde, hasta })}`,
    ),
};
