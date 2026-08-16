import { estadoStock as estadoStockPorCantidad, type EstadoStock } from "@/lib/stock";
/**
 * C11/C12 — buffet del complejo. Dos entidades del backend
 * (ProductoBuffet, Venta con sus DetalleVenta) más un campo que
 * todavía no existe ahí (ver TODO abajo).
 *
 * Venta.reservaId usa el mismo espacio de ids que Pago.reservaId
 * (mocks/pagos.ts): un string que puede venir de un Turno de hoy
 * (agenda.ts, id `${canchaId}-${fecha}-${inicio}`) o de una
 * ReservaHistorial pasada (clientes.ts, id `hist-${clienteId}-${i}`).
 * Es DELIBERADO que sea string y no number pese a que la nota del
 * pedido lo sugería numérico: en este frontend el id real de una
 * reserva siempre fue string, y el selector de C12 ("cargar a un
 * turno") tiene que poder buscar contra esos ids de verdad.
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { hoyISO, sumarDias } from "@/lib/fecha";
import { PANEL_HISTORIAL } from "@/mocks/clientes";
import { METODOS_PAGO, type MetodoPago } from "@/mocks/pagos";

export type ProductoBuffet = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
};

export type { EstadoStock } from "@/lib/stock";

export function estadoStock(producto: { stock: number }): EstadoStock {
  return estadoStockPorCantidad(producto.stock);
}

// TODO backend: agregar campo umbralAlerta a ProductoBuffet — hoy la
// entidad real no lo tiene, se pidió explícitamente dejarlo marcado.
export const PANEL_PRODUCTOS_BUFFET: ProductoBuffet[] = [
  { id: 1, nombre: "Agua mineral 500ml", precio: 1500, stock: 40 },
  { id: 2, nombre: "Gaseosa 500ml", precio: 2200, stock: 32 },
  { id: 3, nombre: "Isotónica 500ml", precio: 2800, stock: 8 },
  { id: 4, nombre: "Cerveza rubia 473ml", precio: 3200, stock: 24 },
  { id: 5, nombre: "Alfajor triple", precio: 1800, stock: 15 },
  { id: 6, nombre: "Papas fritas chicas", precio: 2000, stock: 0 },
  { id: 7, nombre: "Barrita de cereal", precio: 1400, stock: 20 },
  { id: 8, nombre: "Sanguche de miga x3", precio: 3500, stock: 4 },
  { id: 9, nombre: "Café", precio: 1200, stock: 3 },
  { id: 10, nombre: "Energizante 250ml", precio: 3000, stock: 18 },
];

export type EstadoVenta = "CONFIRMADA" | "CANCELADA";

export type DetalleVenta = {
  id: number;
  cantidad: number;
  subtotal: number;
  productoBuffetId: number;
  productoNombre: string;
};

export type Venta = {
  id: number;
  /** datetime local "YYYY-MM-DDTHH:MM" */
  fechaHora: string;
  total: number;
  estado: EstadoVenta;
  /** null = venta suelta, sin turno asociado */
  reservaId: string | null;
  metodoPago: MetodoPago;
  detalles: DetalleVenta[];
};

function shuffle<T>(lista: T[], rand: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function generarVenta(id: number, fecha: string, rand: () => number, idsReservas: string[]): Venta {
  const cantidadLineas = 1 + Math.floor(rand() * 3);
  const productos = shuffle(PANEL_PRODUCTOS_BUFFET, rand).slice(0, cantidadLineas);
  const detalles: DetalleVenta[] = productos.map((p, i) => {
    const cantidad = 1 + Math.floor(rand() * 3);
    return { id: id * 10 + i, cantidad, subtotal: cantidad * p.precio, productoBuffetId: p.id, productoNombre: p.nombre };
  });
  const total = detalles.reduce((acc, d) => acc + d.subtotal, 0);
  const metodoPago = METODOS_PAGO[Math.floor(rand() * METODOS_PAGO.length)].valor;
  // El 40% de las ventas se cargan a un turno en curso, el resto es
  // gente que pasó por el buffet sin estar jugando (o vino antes/
  // después de su turno sin que valga la pena asociarla).
  const reservaId = rand() < 0.4 && idsReservas.length > 0 ? idsReservas[Math.floor(rand() * idsReservas.length)] : null;
  const estado: EstadoVenta = rand() < 0.05 ? "CANCELADA" : "CONFIRMADA";
  const hora = `${String(8 + Math.floor(rand() * 15)).padStart(2, "0")}:${rand() < 0.5 ? "00" : "30"}`;
  return { id, fechaHora: `${fecha}T${hora}`, total, estado, reservaId, metodoPago, detalles };
}

const rand = crearRand(hashSeed("ventas-buffet"));
const idsReservasHistorial = PANEL_HISTORIAL.filter((h) => h.estado === "ocupado").map((h) => h.id);

// TODO backend: Venta no tiene campo metodoPago en la entidad actual.
// Agregarlo — el buffet se cobra con los 5 medios reales y hay que
// poder auditar cuál se usó, igual que con los turnos (mocks/pagos.ts).
export const PANEL_VENTAS: Venta[] = Array.from({ length: 45 }, (_, i) => {
  const fecha = sumarDias(hoyISO(), -Math.floor(rand() * 30));
  return generarVenta(i + 1, fecha, rand, idsReservasHistorial);
}).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));

export function ventasDelPeriodo(ventas: Venta[], desde: string, hasta: string): Venta[] {
  return ventas.filter((v) => {
    const fecha = v.fechaHora.slice(0, 10);
    return fecha >= desde && fecha <= hasta;
  });
}
