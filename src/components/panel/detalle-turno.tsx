"use client";

import { useState } from "react";
import { ArrowRightLeft, Calendar, Clock, Phone, Repeat, User } from "lucide-react";
import { StatusBadge } from "@/components/saque/status-badge";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import type { Cancha } from "@/mocks/canchas";
import type { Turno } from "@/mocks/agenda";

/**
 * Detalle del turno ocupado: quién, teléfono, cuánto pagó, cancelar,
 * marcar como pagado (Parte 9, C2). Del diseño anterior se conserva
 * a propósito el estilo — header tinta, datos con íconos, seña
 * destacada, "Marcar como pagado" lleno y "Cancelar turno" en rojo
 * outline — es lo único de ese diseño que la spec pidió mantener.
 *
 * "Mover a otra cancha" es nuevo: la válvula manual para cuando una
 * reserva en una física del pool deja sin disponibilidad a una
 * compuesta que comparte ese pool — el dueño la reubica a mano y
 * libera el bloque, sin tener que cancelarla y recrearla.
 */
export function DetalleTurno({
  turno,
  cancha,
  canchasCompatibles,
  puedeCobrar,
  puedeCancelar,
  onMarcarPagado,
  onCancelar,
  onMover,
}: {
  turno: Turno;
  cancha: Cancha;
  /** físicas activas, distintas de la actual, que comparten algún deporte con ella */
  canchasCompatibles: Cancha[];
  /** permisos cobrar_turnos / cancelar_turnos del usuario actual — el dueño siempre los tiene */
  puedeCobrar: boolean;
  puedeCancelar: boolean;
  onMarcarPagado: () => void;
  onCancelar: () => void;
  onMover: (canchaDestinoId: number) => void;
}) {
  const conSenia = turno.senia > 0;
  const [destino, setDestino] = useState(canchasCompatibles[0]?.id ?? "");

  return (
    <div className="space-y-5">
      <StatusBadge estado={turno.estado} />

      <dl className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <User className="size-4 shrink-0 text-grafito" aria-hidden />
          <span className={`font-semibold text-tinta ${turno.estado === "cancelado" ? "line-through" : ""}`}>
            {turno.cliente.nombre}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="size-4 shrink-0 text-grafito" aria-hidden />
          <a href={`tel:${turno.cliente.telefono}`} className="text-azul hover:underline">
            {turno.cliente.telefono}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="size-4 shrink-0 text-grafito" aria-hidden />
          <span>{fechaLarga(turno.fecha)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="size-4 shrink-0 text-grafito" aria-hidden />
          <span>
            {turno.horaInicio}–{turno.horaFin} · {cancha.nombre}
          </span>
        </div>
        {turno.repiteSemanal && (
          <div className="flex items-center gap-3">
            <Repeat className="size-4 shrink-0 text-grafito" aria-hidden />
            <span>Se repite todas las semanas</span>
          </div>
        )}
      </dl>

      <div className="rounded-card bg-humo p-4">
        <div className="flex items-center justify-between text-sm text-grafito">
          <span>Total de la cancha</span>
          <span className="font-semibold text-tinta">{formatearPrecio(turno.monto)}</span>
        </div>
        {conSenia && (
          <div
            className={`mt-3 flex items-center justify-between rounded-input px-3 py-2.5 ${
              turno.seniaPagada ? "bg-disponible-suave" : "bg-pendiente-suave"
            }`}
          >
            <span className={`text-sm font-semibold ${turno.seniaPagada ? "text-disponible" : "text-pendiente"}`}>
              Seña {turno.seniaPagada ? "pagada" : "pendiente"}
            </span>
            <span className={`font-display font-bold ${turno.seniaPagada ? "text-disponible" : "text-pendiente"}`}>
              {formatearPrecio(turno.senia)}
            </span>
          </div>
        )}
      </div>

      {turno.estado !== "cancelado" && canchasCompatibles.length > 0 && (
        <div className="space-y-2 rounded-card bg-humo p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
            <ArrowRightLeft className="size-4 shrink-0 text-grafito" aria-hidden />
            Mover a otra cancha
          </p>
          <select
            value={destino}
            onChange={(e) => setDestino(Number(e.target.value))}
            aria-label="Cancha destino"
            className="w-full rounded-input border border-borde bg-white px-3 py-2.5 text-tinta focus:border-azul focus:outline-none"
          >
            {canchasCompatibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => destino && onMover(Number(destino))}
            className="flex h-10 w-full items-center justify-center rounded-full border border-azul font-display text-sm font-bold text-azul transition-colors hover:bg-celeste-suave"
          >
            Mover turno
          </button>
        </div>
      )}

      {turno.estado !== "cancelado" && (puedeCobrar || puedeCancelar) && (
        <div className="space-y-2 pt-2">
          {puedeCobrar && conSenia && !turno.seniaPagada && (
            <button
              type="button"
              onClick={onMarcarPagado}
              className="flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
            >
              Marcar como pagado
            </button>
          )}
          {puedeCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="flex h-11 w-full items-center justify-center rounded-full border-2 border-cancelado font-display text-sm font-bold text-cancelado transition-colors hover:bg-cancelado-suave"
            >
              Cancelar turno
            </button>
          )}
        </div>
      )}
    </div>
  );
}
