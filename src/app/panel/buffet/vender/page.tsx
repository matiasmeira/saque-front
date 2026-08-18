"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Package } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { GrillaProductosVenta } from "@/components/panel/grilla-productos-venta";
import { TicketBuffet, type LineaTicket } from "@/components/panel/ticket-buffet";
import { SkeletonVentaBuffet } from "@/components/panel/skeleton-venta-buffet";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { hoyISO } from "@/lib/fecha";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productosBuffet, ventasBuffet } from "@/lib/api/endpoints/buffet";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useAgenda } from "@/hooks/api/use-agenda";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { ProductoBuffetResponse as ProductoBuffet } from "@/lib/api/tipos/buffet";
import { type MetodoPago } from "@/mocks/pagos";

type EstadoCarga = "cargando" | "error" | "listo";

export default function PanelVenderBuffet() {
  const router = useRouter();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  // El catálogo (GET .../productos-buffet) acepta a un empleado con este mismo
  // permiso: el que puede vender puede ver qué vender.
  const puedeVender = tienePermiso("REGISTRAR_VENTA_BUFFET");
  const destinoAlternativo = tienePermiso("OPERAR_CAJA") ? "/panel/caja" : null;


  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ productoId: number; cantidad: number }[]>([]);
  const [turnoId, setTurnoId] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [avisoUltimaVenta, setAvisoUltimaVenta] = useState<number | null>(null);

  useEffect(() => {
    if (!puedeVender && destinoAlternativo) router.replace(destinoAlternativo);
  }, [puedeVender, destinoAlternativo, router]);

  const consulta = useQuery({
    queryKey: keys.buffet.productos(establecimientoId ?? 0),
    queryFn: () => productosBuffet.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  // Turnos de hoy, para poder cargarle el consumo a una reserva.
  const { turnosPorFecha } = useAgenda(establecimientoId, [hoyISO()]);

  const estadoCarga: EstadoCarga = consulta.isPending
    ? "cargando"
    : consulta.isError
      ? "error"
      : "listo";

  /**
   * POST /api/v1/buffet/ventas. El backend descuenta el stock, calcula el
   * total y protege el POST con Idempotency-Key, así que un doble tap en un
   * mostrador no cobra dos veces.
   */
  const vender = useMutation({
    mutationFn: () =>
      ventasBuffet.crear({
        establecimientoId: establecimientoId!,
        reservaId: turnoId ? Number(turnoId) : undefined,
        metodoPago: metodoPago!,
        detalles: ticket.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      }),
    onSuccess: (venta) => {
      // El stock ya no se descuenta en el cliente: lo hizo el backend.
      queryClient.invalidateQueries({ queryKey: ["buffet"] });
      setTicket([]);
      setTurnoId("");
      setMetodoPago(null);
      setErrorAccion(null);
      setAvisoUltimaVenta(venta.total);
      setTimeout(() => setAvisoUltimaVenta(null), 2500);
    },
    onError: (e) => {
      setErrorAccion(
        e instanceof ApiError ? mensajeVisible(e) : "No pudimos registrar la venta.",
      );
    },
  });

  if (bloqueadoPorCaja || !puedeVender) return <div className="min-h-dvh bg-humo" />;

  const productos: ProductoBuffet[] = consulta.data ?? [];

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
    vender.mutate();
  }

  const cantidadesEnTicket = Object.fromEntries(ticket.map((l) => [l.productoId, l.cantidad]));
  const lineas: LineaTicket[] = ticket.map((l) => {
    const producto = productos.find((p) => p.id === l.productoId)!;
    return { producto, cantidad: l.cantidad, subtotal: producto.precio * l.cantidad };
  });
  const total = lineas.reduce((acc, l) => acc + l.subtotal, 0);

  const turnosDeHoy = (turnosPorFecha[hoyISO()] ?? [])
    .filter((t) => t.estado !== "cancelado")
    .map((t) => ({
      id: t.id,
      label: `${t.horaInicio} · ${t.cliente.nombre}`,
    }));

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Vender en el buffet</h1>

          {errorAccion && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonVentaBuffet />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los productos.</p>
              <button
                type="button"
                onClick={() => consulta.refetch()}
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
