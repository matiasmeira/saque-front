"use client";

import Link from "next/link";
import { AlertTriangle, Eye, ShieldQuestion } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ContenidoComplejo } from "@/components/canche/contenido-complejo";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { usePrevisualizacionPropia } from "@/hooks/api/use-establecimiento-riesgo";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { PrevisualizacionEstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Cómo se ve la ficha pública de este complejo, aunque todavía no esté
 * verificado o esté deshabilitado -- es la única forma de mirarla antes de
 * que la vea el público, por eso pesa más cuando NO está verificado (ver
 * SidebarPanel/HeaderPanel: no hay gateo especial acá, cualquier dueño puede
 * entrar en cualquier momento).
 *
 * El cuerpo es ContenidoComplejo, el mismo que usa la ficha pública: misma
 * grilla, galería, servicios y mapa, pero alimentado por
 * GET /establecimientos/{id}/previsualizacion (fuente "panel", por id, no
 * por slug -- un complejo no verificado puede no tener slug público
 * todavía) y en modo sólo lectura (ver ModoGrilla). Mismo patrón que la
 * previsualización de admin en /admin/establecimientos/[id]/previsualizacion.
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

          {consulta.data && establecimiento && establecimientoId !== null && (
            <VistaPrevia
              previsualizacion={consulta.data}
              isActive={establecimiento.isActive}
              establecimientoId={establecimientoId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function VistaPrevia({
  previsualizacion,
  isActive,
  establecimientoId,
}: {
  previsualizacion: PrevisualizacionEstablecimientoResponse;
  isActive: boolean;
  establecimientoId: number;
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

      {/* ContenidoComplejo trae su propio contenedor (px-10 en lg) y acá ya
          está dentro del px-8 del main y del sidebar de w-56: con tanto
          padding apilado, en 1024-1035px la columna del botón de reserva
          queda en ~144px y "Ver turnos disponibles" se parte en dos
          líneas. El margen negativo en lg le devuelve 24px por lado sin
          tocar el componente compartido (la ficha pública no cambia). */}
      <div className="lg:-mx-6">
        <ContenidoComplejo
          complejo={detalle}
          fuenteGrilla={{ tipo: "panel", establecimientoId }}
          nivelTitulo="h2"
        />
      </div>
    </div>
  );
}
