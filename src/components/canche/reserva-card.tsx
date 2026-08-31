import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { StatusBadge, type Estado } from "@/components/canche/status-badge";
import { partirFechaHora } from "@/lib/api/fechas";
import { etiquetaDeporte } from "@/lib/deportes";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import type { EstadoReserva } from "@/lib/api/tipos/comunes";
import type { ReservaResponse } from "@/lib/api/tipos/reservas";

/**
 * Mapeo de los SEIS estados del backend a la paleta de badges.
 *
 * El mock tenía cuatro ("confirmada" | "pendiente" | "cancelada" | "jugada") y
 * le faltaban los dos que más confunden si se muestran mal:
 *
 *  - AUSENTE: el jugador no se presentó. Antes no existía del lado del
 *    jugador, así que un no-show se veía igual que un turno jugado.
 *  - CANCELADA_PRERESERVA: venció sin confirmar. Es distinto de una
 *    cancelación explícita y merece su propio copy — el usuario no canceló
 *    nada, se le venció el tiempo.
 */
const VISUAL_POR_ESTADO: Record<EstadoReserva, { estado: Estado; label: string }> = {
  CONFIRMADA: { estado: "disponible", label: "Confirmada" },
  PENDIENTE_SENA: { estado: "pendiente", label: "Pendiente de seña" },
  CANCELADA: { estado: "cancelado", label: "Cancelada" },
  CANCELADA_PRERESERVA: { estado: "cancelado", label: "Expiró sin confirmar" },
  FINALIZADA: { estado: "ocupado", label: "Jugada" },
  AUSENTE: { estado: "ausente", label: "No te presentaste" },
};

export function ReservaCard({
  reserva,
  destacada = false,
  onCancelar,
}: {
  reserva: ReservaResponse;
  destacada?: boolean;
  onCancelar?: (reserva: ReservaResponse) => void;
}) {
  const { fecha, hora } = partirFechaHora(reserva.fechaHoraInicio);
  const { hora: horaFin } = partirFechaHora(reserva.fechaHoraFin);
  const visual = VISUAL_POR_ESTADO[reserva.estado];

  // El backend valida el plazo real contra la política del establecimiento
  // (horasCancelacionAntesPartido, que ningún DTO expone). El front no puede
  // anticiparlo: ofrece cancelar en los estados donde tiene sentido y deja
  // que el 400 explique si no se puede.
  const cancelable =
    reserva.estado === "CONFIRMADA" || reserva.estado === "PENDIENTE_SENA";

  return (
    <article
      className={`rounded-card p-5 ${destacada ? "bg-white ring-2 ring-azul" : "bg-white"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-tinta">
            {reserva.canchaNombre}
          </h3>
          <p className="mt-0.5 text-sm text-grafito">
            {etiquetaDeporte(reserva.deporteSeleccionado)}
          </p>
        </div>
        <StatusBadge estado={visual.estado} label={visual.label} />
      </div>

      <div className="space-y-1.5 text-sm text-grafito">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {fechaLarga(fecha)} · {hora} a {horaFin}
        </p>
        {/*
          ReservaResponse no trae el establecimiento: sólo canchaId y
          canchaNombre. Sin nombre ni dirección del complejo no hay "dónde"
          que mostrar ni link a Google Maps. Ver PLAN_CONEXION.md §6.
        */}
        <p className="flex items-center gap-1.5 text-borde">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="italic">Complejo no disponible en el listado</span>
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-borde pt-3">
        <div>
          <span className="block text-xs text-grafito">Total</span>
          <span className="font-display text-lg font-bold text-tinta">
            {formatearPrecio(reserva.precioTotal)}
          </span>
          {reserva.senaPagada > 0 && (
            <span className="ml-2 text-xs text-grafito">
              (seña {formatearPrecio(reserva.senaPagada)})
            </span>
          )}
        </div>

        {cancelable && onCancelar && (
          <button
            type="button"
            onClick={() => onCancelar(reserva)}
            className="h-9 rounded-full border border-borde px-4 text-xs font-semibold text-grafito transition-colors hover:border-cancelado hover:text-cancelado"
          >
            Cancelar
          </button>
        )}

        {reserva.estado === "FINALIZADA" && (
          <Link
            href="/buscar"
            className="inline-flex h-9 items-center rounded-full border border-azul px-4 text-xs font-semibold text-azul transition-colors hover:bg-azul hover:text-white"
          >
            Volver a jugar
          </Link>
        )}
      </div>
    </article>
  );
}
