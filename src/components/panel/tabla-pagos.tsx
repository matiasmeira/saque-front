import { Banknote, CreditCard, Landmark, Pencil, Wallet } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO, type EstadoLiquidacion, type MetodoPago, type Pago } from "@/mocks/pagos";

/** "29/07" — compacto para la tabla. */
function fechaCorta(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;
}

const ICONO_METODO: Record<MetodoPago, typeof Banknote> = {
  EFECTIVO: Banknote,
  TRANSFERENCIA: Landmark,
  MERCADO_PAGO: Wallet,
  TARJETA_DEBITO: CreditCard,
  TARJETA_CREDITO: CreditCard,
};

function etiquetaMetodo(metodo: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.valor === metodo)?.etiqueta ?? metodo;
}

const ESTILO_LIQUIDACION: Record<EstadoLiquidacion, string> = {
  acreditado: "bg-disponible-suave text-disponible",
  en_camino: "bg-pendiente-suave text-pendiente",
  pendiente: "bg-ocupado-suave text-grafito",
};

const ETIQUETA_LIQUIDACION: Record<EstadoLiquidacion, string> = {
  acreditado: "Acreditado",
  en_camino: "En camino",
  pendiente: "Pendiente",
};

const COLUMNAS = "grid-cols-[0.7fr_1.2fr_1fr_0.9fr_1.3fr_0.9fr_1.2fr_auto]";

/**
 * Detalle por reserva. El medio de pago (metodoPago) y si generó
 * comisión (generoComision) son dos columnas separadas a propósito
 * — son independientes: Mercado Pago no siempre genera comisión (el
 * dueño puede cobrar con su propio Point), y ningún otro medio la
 * genera nunca. Densa, sin bordes en todos lados (Parte 10): las
 * filas se separan por fondo alternado + hover.
 */
export function TablaPagos({ pagos, onEditar }: { pagos: Pago[]; onEditar: (pago: Pago) => void }) {
  return (
    <div className="overflow-hidden rounded-card bg-white">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Fecha</span>
        <span>Cliente</span>
        <span>Cancha</span>
        <span>Total</span>
        <span>Medio de pago</span>
        <span>Comisión</span>
        <span>Liquidación</span>
        <span className="sr-only">Acciones</span>
      </div>

      {pagos.map((pago, indice) => {
        const IconoMetodo = ICONO_METODO[pago.metodoPago];
        return (
          <div
            key={pago.reservaId}
            className={`grid ${COLUMNAS} items-center gap-3 px-4 py-3 ${indice % 2 === 1 ? "bg-humo/50" : "bg-white"}`}
          >
            <span className="text-sm text-grafito">{fechaCorta(pago.fecha)}</span>
            <span className="truncate text-sm font-semibold text-tinta">{pago.clienteNombre}</span>
            <span className="truncate text-sm text-grafito">{pago.canchaNombre}</span>
            <span className="text-sm text-tinta">{formatearPrecio(pago.totalTurno)}</span>
            <span className="flex items-center gap-1.5 text-sm text-tinta">
              <IconoMetodo className="size-3.5 shrink-0 text-grafito" aria-hidden />
              {etiquetaMetodo(pago.metodoPago)}
            </span>
            <span className={`text-sm ${pago.generoComision ? "text-cancelado" : "text-grafito"}`}>
              {pago.generoComision ? `−${formatearPrecio(pago.comision)}` : "$0"}
            </span>
            <span>
              {pago.generoComision ? (
                <>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_LIQUIDACION[pago.estadoLiquidacion]}`}>
                    {ETIQUETA_LIQUIDACION[pago.estadoLiquidacion]}
                  </span>
                  {pago.fechaAcreditacion && <span className="block text-[11px] text-grafito">{fechaCorta(pago.fechaAcreditacion)}</span>}
                </>
              ) : (
                <span className="text-sm text-grafito">—</span>
              )}
            </span>
            <span className="justify-self-end">
              <button
                type="button"
                onClick={() => onEditar(pago)}
                aria-label={`Editar cobro de ${pago.clienteNombre}`}
                className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
