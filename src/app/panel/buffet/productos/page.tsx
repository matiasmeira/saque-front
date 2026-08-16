"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { estadoStock } from "@/lib/stock";
import { productosBuffet } from "@/lib/api/endpoints/buffet";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { ProductoBuffetResponse } from "@/lib/api/tipos/buffet";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "ficha"; producto: ProductoBuffetResponse | null } | { tipo: "stock"; producto: ProductoBuffetResponse } | null;

// ver_stock_buffet alcanza para ver esta pantalla, pero dar de alta,
// editar y ajustar stock es solo dueño (mismo criterio que "Exportar
// CSV" en C5): un empleado del buffet consulta cuánto queda, no
// decide qué se vende ni corrige precios.
export default function PanelProductosBuffet() {
  const router = useRouter();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const puedeVerStock = tienePermiso("ver_stock_buffet");
  const destinoAlternativo = tienePermiso("vender_buffet") ? "/panel/buffet/vender" : tienePermiso("ver_agenda") ? "/panel/agenda" : null;

  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  useEffect(() => {
    if (!puedeVerStock && destinoAlternativo) router.replace(destinoAlternativo);
  }, [puedeVerStock, destinoAlternativo, router]);

  const consulta = useQuery({
    queryKey: keys.buffet.productos(establecimientoId ?? 0),
    queryFn: () => productosBuffet.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  const estadoCarga: EstadoCarga = consulta.isPending
    ? "cargando"
    : consulta.isError
      ? "error"
      : "listo";

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["buffet"] });
    setPanelAbierto(null);
    setErrorAccion(null);
  }

  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  const guardar = useMutation({
    mutationFn: ({ id, datos }: { id: number | null; datos: DatosProducto }) => {
      const body = {
        nombre: datos.nombre,
        descripcion: datos.descripcion || undefined,
        precio: datos.precio,
        stock: datos.stock ?? 0,
      };
      return id === null
        ? productosBuffet.crear(establecimientoId!, body)
        : productosBuffet.actualizar(establecimientoId!, id, body);
    },
    onSuccess: invalidar,
    onError: (e) => alFallar(e, "No pudimos guardar el producto."),
  });

  // El backend IGNORA `stock` en el PUT: moverlo es un PATCH aparte, con la
  // cantidad como DELTA. Por eso el modal de ajuste no reemplaza, suma.
  const ajustar = useMutation({
    mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) =>
      productosBuffet.ajustarStock(establecimientoId!, id, { cantidad }),
    onSuccess: invalidar,
    onError: (e) => alFallar(e, "No pudimos ajustar el stock."),
  });

  if (bloqueadoPorCaja || !puedeVerStock) return <div className="min-h-dvh bg-humo" />;

  const productos: ProductoBuffetResponse[] = consulta.data ?? [];

  function crearProducto(datos: DatosProducto) {
    guardar.mutate({ id: null, datos });
  }

  function editarProducto(id: number, datos: DatosProducto) {
    guardar.mutate({ id, datos });
  }

  function ajustarStock(id: number, cantidad: number) {
    ajustar.mutate({ id, cantidad });
  }

  const conStockBajo = productos.filter((p) => estadoStock(p.stock) === "bajo").length;
  const agotados = productos.filter((p) => estadoStock(p.stock) === "agotado").length;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Productos del buffet</h1>
            {rol === "dueno" && (
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "ficha", producto: null })}
                className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Nuevo producto
              </button>
            )}
          </div>

          {estadoCarga === "listo" && productos.length > 0 && (conStockBajo > 0 || agotados > 0) && (
            <div className="mb-6 flex items-start gap-2 rounded-input bg-pendiente-suave px-3.5 py-2.5 text-sm text-pendiente">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {conStockBajo > 0 && `${conStockBajo} ${conStockBajo === 1 ? "producto" : "productos"} con stock bajo`}
                {conStockBajo > 0 && agotados > 0 && " · "}
                {agotados > 0 && `${agotados} ${agotados === 1 ? "agotado" : "agotados"}`}
              </span>
            </div>
          )}

          {errorAccion && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonProductosBuffet />}

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
              <p className="font-display font-bold text-tinta">Todavía no cargaste productos</p>
              <p className="max-w-xs text-sm text-grafito">Cargá lo que vendés en el buffet para poder usar el punto de venta.</p>
              {rol === "dueno" && (
                <button
                  type="button"
                  onClick={() => setPanelAbierto({ tipo: "ficha", producto: null })}
                  className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
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
