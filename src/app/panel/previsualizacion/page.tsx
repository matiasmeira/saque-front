"use client";

import Link from "next/link";
import { AlertTriangle, Eye, MapPin, ShieldQuestion } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { GaleriaFotos } from "@/components/canche/galeria-fotos";
import { MapaComplejo } from "@/components/canche/mapa-complejo";
import { ReservaBlock } from "@/components/canche/reserva-block";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { usePrevisualizacionPropia } from "@/hooks/api/use-establecimiento-riesgo";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { etiquetaDeporte } from "@/lib/deportes";
import { formatearPrecio } from "@/lib/formato";
import { servicio as buscarServicio } from "@/lib/servicios";
import type { PrevisualizacionEstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Cómo se ve la ficha pública de este complejo, aunque todavía no esté
 * verificado o esté deshabilitado -- es la única forma de mirarla antes de
 * que la vea el público, por eso pesa más cuando NO está verificado (ver
 * SidebarPanel/HeaderPanel: no hay gateo especial acá, cualquier dueño puede
 * entrar en cualquier momento).
 *
 * No monta GrillaDisponibilidad (hace su propio fetch por slug, y un
 * complejo no verificado puede no tener slug público todavía): las canchas
 * se listan de sólo lectura, mismo patrón que la previsualización de admin
 * en /admin/establecimientos/[id]/previsualizacion.
 */
export default function PanelPrevisualizacion() {
  const { establecimientoId, establecimiento, cargando } = useEstablecimientoActivo();
  const consulta = usePrevisualizacionPropia(establecimientoId);

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8 pb-28">
          <h1 className="mb-2 font-display text-2xl font-extrabold tracking-tight text-tinta">Previsualización</h1>

          <p className="mb-6 flex items-start gap-2.5 rounded-input bg-celeste-suave p-4 text-sm text-tinta">
            <Eye className="mt-0.5 size-4 shrink-0" aria-hidden />
            Así ve el público tu ficha cuando esté disponible. Es sólo una vista previa: no se puede reservar desde acá.
          </p>

          {(cargando || (establecimientoId !== null && consulta.isPending)) && (
            <div className="h-96 animate-pulse rounded-card bg-white" />
          )}

          {!cargando && establecimientoId === null && (
            <div className="rounded-card bg-white py-16 text-center shadow-card">
              <p className="font-semibold text-tinta">No encontramos ningún complejo asociado a tu cuenta.</p>
              <Link href="/panel/configuracion" className="mt-2 inline-block text-sm font-semibold text-azul hover:underline">
                Ir a Configuración
              </Link>
            </div>
          )}

          {consulta.isError && (
            <div className="flex flex-col items-center gap-3 rounded-card bg-white py-16 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">
                {consulta.error instanceof ApiError ? mensajeVisible(consulta.error) : "No pudimos cargar la previsualización."}
              </p>
            </div>
          )}

          {consulta.data && establecimiento && (
            <VistaPrevia previsualizacion={consulta.data} isActive={establecimiento.isActive} />
          )}
        </main>
      </div>
    </div>
  );
}

function VistaPrevia({
  previsualizacion,
  isActive,
}: {
  previsualizacion: PrevisualizacionEstablecimientoResponse;
  isActive: boolean;
}) {
  const { detalle, estadoVerificacion } = previsualizacion;

  const motivos: string[] = [];
  if (!isActive) motivos.push("está deshabilitado");
  if (estadoVerificacion !== "VERIFICADO") motivos.push("todavía no está verificado");

  return (
    <div>
      {motivos.length > 0 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-input bg-pendiente-suave p-4 text-sm text-tinta">
          <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-pendiente" aria-hidden />
          <p>
            El público todavía no ve esta ficha: tu complejo {motivos.join(" y ")}.{" "}
            <Link href="/panel/configuracion#zona-de-riesgo" className="font-semibold hover:underline">
              Resolvelo desde Configuración
            </Link>
            .
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <GaleriaFotos fotos={detalle.fotos} nombreComplejo={detalle.nombre} />

        <div className="p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {detalle.deportes.map((valor) => (
              <span key={valor} className="rounded-full border border-borde px-3 py-1 text-sm text-grafito">
                {etiquetaDeporte(valor)}
              </span>
            ))}
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-tinta">{detalle.nombre}</h2>
          <div className="mt-2 flex items-center gap-1.5 text-grafito">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <p className="text-sm">{detalle.direccion}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <section id="canchas" className="scroll-mt-4">
                <h3 className="mb-3 font-display text-lg font-bold text-tinta">Canchas</h3>
                {detalle.canchas.length === 0 ? (
                  <p className="text-sm text-grafito">Todavía no cargaste ninguna cancha.</p>
                ) : (
                  <ul className="space-y-2">
                    {detalle.canchas.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 rounded-input bg-humo px-4 py-3 text-sm">
                        <span className="text-tinta">
                          {c.nombre} · {c.deportes.map(etiquetaDeporte).join(", ")}
                        </span>
                        {c.precioDesde !== null && <span className="text-grafito">desde {formatearPrecio(c.precioDesde)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detalle.servicios.length > 0 && (
                <section>
                  <h3 className="mb-3 font-display text-lg font-bold text-tinta">Servicios</h3>
                  <div className="flex flex-wrap gap-2">
                    {detalle.servicios.map((valor) => {
                      const s = buscarServicio(valor);
                      const Icono = s?.Icono;
                      return (
                        <span
                          key={valor}
                          className="inline-flex items-center gap-2 rounded-full border border-borde px-4 py-2 text-sm text-grafito"
                        >
                          {Icono && <Icono className="size-4" aria-hidden />}
                          {s?.etiqueta ?? valor}
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 font-display text-lg font-bold text-tinta">Cómo llegar</h3>
                <div className="relative h-56 overflow-hidden rounded-card bg-humo">
                  <MapaComplejo lat={detalle.latitud} lng={detalle.longitud} />
                </div>
              </section>
            </div>

            <ReservaBlock complejo={detalle} />
          </div>
        </div>
      </div>
    </div>
  );
}
