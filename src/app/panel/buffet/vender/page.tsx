"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Package } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { GrillaProductosVenta } from "@/components/panel/grilla-productos-venta";
import { TicketBuffet, type LineaTicket } from "@/components/panel/ticket-buffet";
import { SkeletonVentaBuffet } from "@/components/panel/skeleton-venta-buffet";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { hoyISO } from "@/lib/fecha";
import { PANEL_COMPLEJO, turnosDelDia } from "@/mocks/agenda";
import { PANEL_CANCHAS } from "@/mocks/canchas";
import { PANEL_PRODUCTOS_BUFFET, type DetalleVenta, type ProductoBuffet, type Venta } from "@/mocks/buffet";
import { type MetodoPago } from "@/mocks/pagos";

type EstadoCarga = "cargando" | "error" | "listo";

// vender_buffet lo puede tener el dueño o cualquier empleado — a
// diferencia de C11, acá no hay un recorte extra por rol: el que
// puede vender, vende. ?mockError=1 y ?mockVacio=1 fuerzan esos
// estados, mismo patrón que el resto del panel.
export default function PanelVenderBuffet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const puedeVender = tienePermiso("vender_buffet");
  const destinoAlternativo = tienePermiso("ver_stock_buffet") ? "/panel/buffet/productos" : tienePermiso("ver_agenda") ? "/panel/agenda" : null;

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [productos, setProductos] = useState<ProductoBuffet[]>([]);
  const [ticket, setTicket] = useState<{ productoId: number; cantidad: number }[]>([]);
  const [turnoId, setTurnoId] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [avisoUltimaVenta, setAvisoUltimaVenta] = useState<number | null>(null);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    if (!puedeVender && destinoAlternativo) router.replace(destinoAlternativo);
  }, [puedeVender, destinoAlternativo, router]);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setProductos(mockVacio ? [] : PANEL_PRODUCTOS_BUFFET.map((p) => ({ ...p })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  if (bloqueadoPorCaja || !puedeVender) return <div className="min-h-dvh bg-humo" />;

  function agregarUnidad(producto: ProductoBuffet) {
    setTicket((prev) => {
      const linea = prev.find((l) => l.productoId === producto.id);
      const cantidadActual = linea?.cantidad ?? 0;
      if (cantidadActual >= producto.stock) return prev;
      if (linea) return prev.map((l) => (l.productoId === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      return [...prev, { productoId: producto.id, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, delta: number) {
    setTicket((prev) =>
      prev
        .map((l) => {
          if (l.productoId !== productoId) return l;
          const producto = productos.find((p) => p.id === productoId);
          const maximo = producto?.stock ?? l.cantidad;
          return { ...l, cantidad: Math.min(maximo, Math.max(0, l.cantidad + delta)) };
        })
        .filter((l) => l.cantidad > 0),
    );
  }

  function quitarLinea(productoId: number) {
    setTicket((prev) => prev.filter((l) => l.productoId !== productoId));
  }

  function confirmarVenta() {
    if (lineas.length === 0 || !metodoPago) return;
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    const detalles: DetalleVenta[] = lineas.map((l, i) => ({
      id: ahora.getTime() + i,
      cantidad: l.cantidad,
      subtotal: l.subtotal,
      productoBuffetId: l.producto.id,
      productoNombre: l.producto.nombre,
    }));
    const venta: Venta = { id: ahora.getTime(), fechaHora: `${hoyISO()}T${hora}`, total, estado: "CONFIRMADA", reservaId: turnoId || null, metodoPago, detalles };
    void venta; // TODO backend: POST de la venta — acá el mock solo descuenta stock y limpia el ticket.

    setProductos((prev) => prev.map((p) => {
      const linea = ticket.find((l) => l.productoId === p.id);
      return linea ? { ...p, stock: p.stock - linea.cantidad } : p;
    }));
    setTicket([]);
    setTurnoId("");
    setMetodoPago(null);
    setAvisoUltimaVenta(total);
    setTimeout(() => setAvisoUltimaVenta(null), 2500);
  }

  const cantidadesEnTicket = Object.fromEntries(ticket.map((l) => [l.productoId, l.cantidad]));
  const lineas: LineaTicket[] = ticket.map((l) => {
    const producto = productos.find((p) => p.id === l.productoId)!;
    return { producto, cantidad: l.cantidad, subtotal: producto.precio * l.cantidad };
  });
  const total = lineas.reduce((acc, l) => acc + l.subtotal, 0);

  const turnosDeHoy = turnosDelDia(hoyISO())
    .filter((t) => t.estado !== "cancelado")
    .map((t) => ({
      id: t.id,
      label: `${t.horaInicio} · ${PANEL_CANCHAS.find((c) => c.id === t.canchaId)?.nombre ?? "Cancha"} · ${t.cliente.nombre}`,
    }));

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Vender en el buffet</h1>

          {estadoCarga === "cargando" && <SkeletonVentaBuffet />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los productos.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && productos.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Package className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no hay productos cargados</p>
              <p className="max-w-xs text-sm text-grafito">Pedile al dueño que cargue el catálogo en Productos del buffet.</p>
            </div>
          )}

          {estadoCarga === "listo" && productos.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
              <GrillaProductosVenta productos={productos} cantidadesEnTicket={cantidadesEnTicket} onAgregar={agregarUnidad} />
              <div className="lg:sticky lg:top-6">
                <TicketBuffet
                  lineas={lineas}
                  total={total}
                  turnos={turnosDeHoy}
                  turnoId={turnoId}
                  onCambiarTurno={setTurnoId}
                  metodoPago={metodoPago}
                  onCambiarMetodo={setMetodoPago}
                  onIncrementar={(id) => cambiarCantidad(id, 1)}
                  onDecrementar={(id) => cambiarCantidad(id, -1)}
                  onQuitar={quitarLinea}
                  onCobrar={confirmarVenta}
                  avisoUltimaVenta={avisoUltimaVenta}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
