"use client";

import { use } from "react";
import { AlertTriangle, MapPin, Star } from "lucide-react";
import { usePrevisualizacionEstablecimiento } from "@/hooks/api/use-admin-establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { etiquetaDeporte } from "@/lib/deportes";
import { formatearPrecio } from "@/lib/formato";
import { servicio as buscarServicio } from "@/lib/servicios";

/**
 * La ficha como la vería el público, aunque el establecimiento todavía no
 * esté verificado — por eso es una pantalla propia de /admin y no el
 * /complejo/[slug] público (que 404 para lo no verificado, y de todos modos
 * un no verificado puede no tener slug todavía). Es de sólo lectura: nada de
 * reservar ni ver disponibilidad, no aplica antes de aprobar el alta.
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
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${complejo.latitud},${complejo.longitud}`;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grafito">
        Vista previa · como la ve el público
      </p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">{complejo.nombre}</h1>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1 flex items-center gap-1 text-sm text-azul hover:underline"
      >
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        {complejo.direccion}
      </a>

      {complejo.promedioCalificacion !== null && (
        <p className="mt-2 flex items-center gap-1 text-sm text-tinta">
          <Star className="size-4 fill-pendiente text-pendiente" aria-hidden />
          {complejo.promedioCalificacion.toFixed(1)} ({complejo.cantidadCalificaciones} calificaciones)
        </p>
      )}

      {complejo.fotos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {complejo.fotos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- vista de sólo lectura, sin necesidad de next/image acá
            <img key={url} src={url} alt="" className="h-32 w-full rounded-card object-cover" />
          ))}
        </div>
      )}

      <section className="mt-6 rounded-card bg-white p-6 shadow-card">
        <h2 className="font-display text-sm font-bold text-tinta">Deportes</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {complejo.deportes.map((d) => (
            <span key={d} className="rounded-full bg-humo px-3 py-1 text-xs font-semibold text-tinta">
              {etiquetaDeporte(d)}
            </span>
          ))}
        </div>

        {complejo.servicios.length > 0 && (
          <>
            <h2 className="mt-5 font-display text-sm font-bold text-tinta">Servicios</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {complejo.servicios.map((s) => (
                <span key={s} className="rounded-full bg-humo px-3 py-1 text-xs font-semibold text-tinta">
                  {buscarServicio(s)?.etiqueta ?? s}
                </span>
              ))}
            </div>
          </>
        )}

        {complejo.canchas.length > 0 && (
          <>
            <h2 className="mt-5 font-display text-sm font-bold text-tinta">Canchas</h2>
            <ul className="mt-2 space-y-1 text-sm text-tinta">
              {complejo.canchas.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span>
                    {c.nombre} · {c.deportes.map(etiquetaDeporte).join(", ")}
                  </span>
                  {c.precioDesde !== null && (
                    <span className="text-grafito">desde {formatearPrecio(c.precioDesde)}</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {complejo.horariosAtencion.length > 0 && (
          <>
            <h2 className="mt-5 font-display text-sm font-bold text-tinta">Horarios</h2>
            <ul className="mt-2 space-y-1 text-sm text-tinta">
              {complejo.horariosAtencion.map((h, i) => (
                <li key={i}>
                  {h.diaSemana}: {h.horaApertura.slice(0, 5)} a {h.horaCierre.slice(0, 5)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
