import Link from "next/link";
import { CalendarDays, Navigation, Repeat } from "lucide-react";
import { StatusBadge, type Estado } from "@/components/saque/status-badge";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { urlCheckout } from "@/lib/reserva-intencion";
import { DEPORTES } from "@/mocks/deportes";
import {
  canchaDeReserva,
  complejoDeReserva,
  proximaFechaRepetible,
  puedeCancelarse,
  type ReservaJugador,
} from "@/mocks/reservas-jugador";

const VISUAL_POR_ESTADO: Record<ReservaJugador["estado"], { estado: Estado; label: string }> = {
  confirmada: { estado: "disponible", label: "Confirmada" },
  pendiente: { estado: "pendiente", label: "Pendiente de pago" },
  cancelada: { estado: "cancelado", label: "Cancelada" },
  jugada: { estado: "ocupado", label: "Jugada" },
};

/**
 * Una reserva del historial del jugador (A9). "destacada" es solo un
 * tratamiento visual más grande para la próxima reserva — mismo
 * marcado, sin bloque de color propio (Parte 10: los colores de
 * estado son los únicos que llevan fondo saturado en la app).
 */
export function ReservaCard({
  reserva,
  destacada = false,
  onCancelar,
}: {
  reserva: ReservaJugador;
  destacada?: boolean;
  onCancelar?: (reserva: ReservaJugador) => void;
}) {
  const complejo = complejoDeReserva(reserva);
  const cancha = canchaDeReserva(reserva);
  if (!complejo || !cancha) return null;

  const deporteLabel = DEPORTES.find((d) => d.valor === cancha.deporte)?.etiqueta ?? cancha.deporte;
  const visual = VISUAL_POR_ESTADO[reserva.estado];
  const mostrarCancelar = Boolean(onCancelar) && puedeCancelarse(reserva);
  const hrefRepetir = urlCheckout({
    complejo: reserva.complejoId,
    cancha: reserva.canchaId,
    fecha: proximaFechaRepetible(reserva),
    hora: reserva.hora,
  });
  const hrefMapa = `https://www.google.com/maps/search/?api=1&query=${complejo.lat},${complejo.lng}`;

  return (
    <article className={`rounded-card bg-white ${destacada ? "p-6" : "p-5"}`}>
      {destacada && <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-azul">Tu próxima reserva</p>}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-display font-bold text-tinta ${destacada ? "text-xl" : "text-base"}`}>{complejo.nombre}</h3>
          <p className="mt-0.5 text-sm text-grafito">
            {cancha.nombre} · {deporteLabel}
          </p>
        </div>
        <StatusBadge estado={visual.estado} label={visual.label} className="shrink-0" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-grafito">
        <CalendarDays className="size-4 shrink-0 text-azul" aria-hidden />
        <p className={`font-display font-semibold text-tinta ${destacada ? "text-base" : "text-sm"}`}>
          {fechaLarga(reserva.fecha)}, {reserva.hora}
        </p>
      </div>

      {destacada && (
        <p className="mt-1 text-sm text-grafito">
          {reserva.senia > 0
            ? `Seña pagada ${formatearPrecio(reserva.senia)} · resto ${formatearPrecio(reserva.montoTotal - reserva.senia)} en el complejo`
            : `Pagás el total (${formatearPrecio(reserva.montoTotal)}) en el complejo`}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={hrefMapa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo"
        >
          <Navigation className="size-4" aria-hidden />
          Cómo llegar
        </a>
        <Link
          href={hrefRepetir}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-borde px-3.5 text-sm font-semibold text-tinta transition-colors hover:bg-humo"
        >
          <Repeat className="size-4" aria-hidden />
          Repetir reserva
        </Link>
        {mostrarCancelar && (
          <button
            type="button"
            onClick={() => onCancelar?.(reserva)}
            className="inline-flex h-10 items-center rounded-full px-3.5 text-sm font-semibold text-cancelado transition-colors hover:bg-cancelado-suave"
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}
