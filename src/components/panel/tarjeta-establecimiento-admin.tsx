import Link from "next/link";
import { AlertTriangle, ExternalLink, Globe, MapPin, MessageCircle } from "lucide-react";
import { fechaCompleta, formatearCuit, tiempoRelativo } from "@/lib/formato";
import type { EstablecimientoAdminItem } from "@/lib/api/tipos/establecimientos";

const ESTADO_BADGE: Record<EstablecimientoAdminItem["estadoVerificacion"], string> = {
  PENDIENTE: "bg-ocupado-suave text-ocupado",
  EN_REVISION: "bg-pendiente-suave text-pendiente",
  VERIFICADO: "bg-disponible-suave text-disponible",
  RECHAZADO: "bg-cancelado-suave text-cancelado",
};

const ESTADO_LABEL: Record<EstablecimientoAdminItem["estadoVerificacion"], string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  VERIFICADO: "Verificado",
  RECHAZADO: "Rechazado",
};

/**
 * Todo lo que hace falta para decidir sin salir a buscar nada por su cuenta:
 * Maps, WhatsApp y la red social son links, no texto suelto. Las acciones
 * (verificar/rechazar) sólo existen en EN_REVISION — en los demás estados se
 * muestra el resultado de la última decisión.
 */
export function TarjetaEstablecimientoAdmin({
  item,
  onVerificar,
  onRechazar,
  verificando,
  rechazando,
}: {
  item: EstablecimientoAdminItem;
  onVerificar: () => void;
  onRechazar: () => void;
  verificando: boolean;
  rechazando: boolean;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitud},${item.longitud}`;
  const soloDigitosTelefono = item.telefonoContacto?.replace(/\D/g, "") ?? "";
  const enCurso = verificando || rechazando;

  return (
    <div className="rounded-card bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-tinta">{item.nombre}</h2>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-0.5 flex items-center gap-1 text-sm text-azul hover:underline"
          >
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {item.direccion}
          </a>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ESTADO_BADGE[item.estadoVerificacion]}`}
        >
          {ESTADO_LABEL[item.estadoVerificacion]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-grafito">Dueño</dt>
          <dd className="text-tinta">
            {item.duenoNombre} ·{" "}
            <a href={`mailto:${item.duenoEmail}`} className="text-azul hover:underline">
              {item.duenoEmail}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold text-grafito">Razón social</dt>
          <dd className="text-tinta">{item.razonSocial ?? "—"}</dd>
        </div>

        <div>
          <dt className="text-xs font-semibold text-grafito">CUIT</dt>
          <dd className="text-tinta">{item.cuit ? formatearCuit(item.cuit) : "—"}</dd>
        </div>

        <div>
          <dt className="text-xs font-semibold text-grafito">Contacto</dt>
          <dd className="flex flex-wrap items-center gap-2 text-tinta">
            {item.telefonoContacto ?? "—"}
            {soloDigitosTelefono && (
              <a
                href={`https://wa.me/${soloDigitosTelefono}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-xs font-semibold text-disponible hover:underline"
              >
                <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
              </a>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold text-grafito">Red social</dt>
          <dd>
            {item.urlRedSocial ? (
              <a
                href={item.urlRedSocial}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-azul hover:underline"
              >
                <Globe className="size-3.5 shrink-0" aria-hidden />
                {item.urlRedSocial}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold text-grafito">Solicitud</dt>
          <dd
            className="text-tinta"
            title={
              item.fechaSolicitudVerificacion
                ? fechaCompleta(item.fechaSolicitudVerificacion.slice(0, 10))
                : undefined
            }
          >
            {item.fechaSolicitudVerificacion ? tiempoRelativo(item.fechaSolicitudVerificacion) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-4">
        <Link
          href={`/admin/establecimientos/${item.id}/previsualizacion`}
          target="_blank"
          className="flex items-center gap-1 text-sm font-semibold text-azul hover:underline"
        >
          Ver previsualización <ExternalLink className="size-3.5" aria-hidden />
        </Link>

        {item.estadoVerificacion === "EN_REVISION" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRechazar}
              disabled={enCurso}
              className="flex h-10 items-center rounded-full border border-cancelado px-4 text-sm font-bold text-cancelado transition-colors hover:bg-cancelado-suave disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rechazando ? "Rechazando…" : "Rechazar"}
            </button>
            <button
              type="button"
              onClick={onVerificar}
              disabled={enCurso}
              className="flex h-10 items-center rounded-full bg-azul px-4 text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verificando ? "Verificando…" : "Verificar"}
            </button>
          </div>
        )}

        {/* El backend no expone una fecha de rechazo en este DTO (fechaVerificacion
            la setea sólo `verificar`, ver AdminEstablecimientoVerificacionService).
            Existe en la auditoría (RECHAZAR_ESTABLECIMIENTO) pero no acá, y para
            la cola no hace falta: un rechazo es reciente por definición — el
            dueño lo corrige y resolicita, volviendo a EN_REVISION. */}
        {item.estadoVerificacion === "RECHAZADO" && (
          <p className="flex max-w-md items-start gap-1.5 text-sm text-cancelado">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{item.motivoRechazo ?? "Sin motivo registrado."}</span>
          </p>
        )}

        {item.estadoVerificacion === "VERIFICADO" && item.fechaVerificacion && (
          <p className="text-sm text-grafito">Verificado el {fechaCompleta(item.fechaVerificacion.slice(0, 10))}</p>
        )}
      </div>
    </div>
  );
}
