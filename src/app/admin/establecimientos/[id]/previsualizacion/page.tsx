"use client";

import { use } from "react";
import { AlertTriangle } from "lucide-react";
import { usePrevisualizacionEstablecimiento } from "@/hooks/api/use-admin-establecimientos";
import { ContenidoComplejo } from "@/components/canche/contenido-complejo";
import { ApiError, mensajeVisible } from "@/lib/api/errores";

/**
 * La ficha como la vería el público, aunque el establecimiento todavía no
 * esté verificado — por eso es una pantalla propia de /admin y no el
 * /complejo/[slug] público (que 404 para lo no verificado, y de todos modos
 * un no verificado puede no tener slug todavía). El cuerpo es
 * ContenidoComplejo, el mismo que usa la ficha pública y la previsualización
 * del dueño, en modo sólo lectura (fuente "panel", por id).
 *
 * "Horarios" es la única sección sin equivalente en la ficha pública: el
 * dato que el admin necesita para decidir verificar, por eso queda fuera del
 * marco de ContenidoComplejo, en su propia sección más abajo.
 */
export default function PrevisualizacionEstablecimientoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consulta = usePrevisualizacionEstablecimiento(Number(id));

  if (consulta.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded bg-humo" />
          <div className="h-4 w-40 rounded bg-humo" />
          <div className="h-40 w-full rounded-card bg-humo" />
        </div>
      </main>
    );
  }

  if (consulta.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex flex-col items-center gap-3 rounded-card bg-white py-16 text-center shadow-card">
          <AlertTriangle className="size-8 text-cancelado" aria-hidden />
          <p className="font-semibold text-tinta">
            {consulta.error instanceof ApiError
              ? mensajeVisible(consulta.error)
              : "No pudimos cargar la previsualización."}
          </p>
        </div>
      </main>
    );
  }

  // consulta.data es PrevisualizacionEstablecimientoResponse, no la ficha
  // plana: viene envuelta en `detalle` (ver tipos/establecimientos.ts). Antes
  // de este unwrap esta pantalla nunca había abierto en el navegador y
  // renderizaba con todos los campos de complejo `undefined`.
  const complejo = consulta.data.detalle;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-5 pt-10 sm:px-8 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-grafito">
          Vista previa · como la ve el público
        </p>
      </div>

      <ContenidoComplejo
        complejo={complejo}
        fuenteGrilla={{ tipo: "panel", establecimientoId: Number(id) }}
      />

      {complejo.horariosAtencion.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-5 pb-28 sm:px-8 lg:px-10 lg:pb-10">
          <section className="rounded-card bg-white p-6 shadow-card">
            <h2 className="font-display text-sm font-bold text-tinta">Horarios</h2>
            <ul className="mt-2 space-y-1 text-sm text-tinta">
              {complejo.horariosAtencion.map((h, i) => (
                <li key={i}>
                  {h.diaSemana}: {h.horaApertura.slice(0, 5)} a {h.horaCierre.slice(0, 5)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
