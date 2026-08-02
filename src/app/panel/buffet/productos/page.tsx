"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaProductosBuffet } from "@/components/panel/tabla-productos-buffet";
import { FormFichaProducto, type DatosProducto } from "@/components/panel/form-ficha-producto";
import { ModalAjustarStock } from "@/components/panel/modal-ajustar-stock";
import { SkeletonProductosBuffet } from "@/components/panel/skeleton-productos-buffet";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePermisos } from "@/lib/permisos";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { estadoStock, PANEL_PRODUCTOS_BUFFET, type ProductoBuffet } from "@/mocks/buffet";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "ficha"; producto: ProductoBuffet | null } | { tipo: "stock"; producto: ProductoBuffet } | null;

// ver_stock_buffet alcanza para ver esta pantalla, pero dar de alta,
// editar y ajustar stock es solo dueño (mismo criterio que "Exportar
// CSV" en C5): un empleado del buffet consulta cuánto queda, no
// decide qué se vende ni corrige precios.
export default function PanelProductosBuffet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const puedeVerStock = tienePermiso("ver_stock_buffet");
  const destinoAlternativo = tienePermiso("vender_buffet") ? "/panel/buffet/vender" : tienePermiso("ver_agenda") ? "/panel/agenda" : null;

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [productos, setProductos] = useState<ProductoBuffet[]>([]);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);
  const [proximoId, setProximoId] = useState(1000);

  useEffect(() => {
    if (!puedeVerStock && destinoAlternativo) router.replace(destinoAlternativo);
  }, [puedeVerStock, destinoAlternativo, router]);

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

  if (bloqueadoPorCaja || !puedeVerStock) return <div className="min-h-dvh bg-humo" />;

  function crearProducto(datos: DatosProducto) {
    setProductos((prev) => [
      ...prev,
      { id: proximoId, nombre: datos.nombre, descripcion: datos.descripcion || undefined, precio: datos.precio, stock: datos.stock ?? 0, umbralAlerta: datos.umbralAlerta },
    ]);
    setProximoId((id) => id + 1);
    setPanelAbierto(null);
  }

  function editarProducto(id: number, datos: DatosProducto) {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, nombre: datos.nombre, descripcion: datos.descripcion || undefined, precio: datos.precio, umbralAlerta: datos.umbralAlerta } : p)),
    );
    setPanelAbierto(null);
  }

  function ajustarStock(id: number, cantidad: number) {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, stock: p.stock + cantidad } : p)));
    setPanelAbierto(null);
  }

  const conStockBajo = productos.filter((p) => estadoStock(p) === "bajo").length;
  const agotados = productos.filter((p) => estadoStock(p) === "agotado").length;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl font-bold text-tinta">Productos del buffet</h1>
            {rol === "dueno" && (
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "ficha", producto: null })}
                className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                <Plus className="size-4" aria-hidden />
                Nuevo producto
              </button>
            )}
          </div>

          {estadoCarga === "listo" && productos.length > 0 && (conStockBajo > 0 || agotados > 0) && (
            <div className="mb-4 flex items-start gap-2 rounded-input bg-pendiente-suave px-3.5 py-2.5 text-sm text-pendiente">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {conStockBajo > 0 && `${conStockBajo} ${conStockBajo === 1 ? "producto" : "productos"} con stock bajo`}
                {conStockBajo > 0 && agotados > 0 && " · "}
                {agotados > 0 && `${agotados} ${agotados === 1 ? "agotado" : "agotados"}`}
              </span>
            </div>
          )}

          {estadoCarga === "cargando" && <SkeletonProductosBuffet />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los productos.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && productos.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <Package className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no cargaste productos</p>
              <p className="max-w-xs text-sm text-grafito">Cargá lo que vendés en el buffet para poder usar el punto de venta.</p>
              {rol === "dueno" && (
                <button
                  type="button"
                  onClick={() => setPanelAbierto({ tipo: "ficha", producto: null })}
                  className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
                >
                  <Plus className="size-4" aria-hidden />
                  Nuevo producto
                </button>
              )}
            </div>
          )}

          {estadoCarga === "listo" && productos.length > 0 && (
            <TablaProductosBuffet
              productos={productos}
              puedeGestionar={rol === "dueno"}
              onEditar={(producto) => setPanelAbierto({ tipo: "ficha", producto })}
              onAjustarStock={(producto) => setPanelAbierto({ tipo: "stock", producto })}
            />
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "ficha" && (
        <DrawerPanel titulo={panelAbierto.producto ? "Editar producto" : "Nuevo producto"} subtitulo={panelAbierto.producto?.nombre} onClose={() => setPanelAbierto(null)}>
          <FormFichaProducto
            producto={panelAbierto.producto}
            onGuardar={(datos) => (panelAbierto.producto ? editarProducto(panelAbierto.producto.id, datos) : crearProducto(datos))}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "stock" && (
        <ModalPanel titulo="Ajustar stock" subtitulo={panelAbierto.producto.nombre} onClose={() => setPanelAbierto(null)}>
          <ModalAjustarStock producto={panelAbierto.producto} onGuardar={(cantidad) => ajustarStock(panelAbierto.producto.id, cantidad)} onCancelar={() => setPanelAbierto(null)} />
        </ModalPanel>
      )}
    </div>
  );
}
