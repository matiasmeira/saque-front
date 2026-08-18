import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import type { MetodoPago } from "@/lib/api/tipos/comunes";

/**
 * Catálogo de presentación de los 5 valores del enum `MetodoPago` del backend.
 *
 * Estaba en `mocks/pagos.ts`, que además generaba pagos falsos con comisiones y
 * estados de liquidación que no existen en el backend (B3). Al borrar ese mock
 * había que sacar de ahí lo único real que tenía: cómo se escribe cada método.
 *
 * Lo consumen la caja, los gastos, el buffet, la agenda y los reportes — cinco
 * pantallas que tienen que llamar "Mercado Pago" a lo mismo.
 */
export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string; Icono: typeof Banknote }[] = [
  { valor: "EFECTIVO", etiqueta: "Efectivo", Icono: Banknote },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia", Icono: Landmark },
  { valor: "MERCADO_PAGO", etiqueta: "Mercado Pago", Icono: Wallet },
  { valor: "TARJETA_DEBITO", etiqueta: "Tarjeta de débito", Icono: CreditCard },
  { valor: "TARJETA_CREDITO", etiqueta: "Tarjeta de crédito", Icono: CreditCard },
];

const POR_VALOR = new Map(METODOS_PAGO.map((m) => [m.valor, m]));

export function etiquetaMetodoPago(valor: MetodoPago): string {
  return POR_VALOR.get(valor)?.etiqueta ?? valor;
}

export function iconoMetodoPago(valor: MetodoPago): typeof Banknote {
  return POR_VALOR.get(valor)?.Icono ?? Banknote;
}
