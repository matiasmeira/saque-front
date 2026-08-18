"use client";

import { useState } from "react";
import { ArrowRightLeft, Calendar, Clock, Phone, Repeat, User } from "lucide-react";
import { StatusBadge } from "@/components/saque/status-badge";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useHoraActual } from "@/lib/hora-actual";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import type { MetodoPago } from "@/lib/api/tipos/comunes";
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
  esDueno,
  onMarcarPagado,
  onCancelar,
  onMover,
  onMarcarAusente,
  onDeshacerAusencia,
}: {
  turno: Turno;
  cancha: Cancha;
  /** físicas activas, distintas de la actual, que comparten algún deporte con ella */
  canchasCompatibles: Cancha[];
  /** permisos cobrar_turnos / cancelar_turnos del usuario actual — el dueño siempre los tiene */
  puedeCobrar: boolean;
  puedeCancelar: boolean;
  /** "Deshacer ausencia" es solo del dueño — nunca en Modo Caja */
  esDueno: boolean;
  onMarcarPagado: (metodoPago: MetodoPago) => void;
  onCancelar: () => void;
  onMover: (canchaDestinoId: number) => void;
  onMarcarAusente: () => void;
  onDeshacerAusencia: () => void;
}) {
  const [destino, setDestino] = useState(canchasCompatibles[0]?.id ?? "");
  const [confirmando, setConfirmando] = useState<"ausente" | "deshacer-ausencia" | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");

  // Con datos reales `senia` es lo que YA se cobró (ReservaResponse.senaPagada):
  // el monto de la seña a cobrar vive en la cancha, no en la reserva.
  const conSenia = turno.senia > 0;

  const horaActual = useHoraActual();
  const yaEmpezo = new Date(`${turno.fecha}T${turno.horaInicio}`) <= horaActual;
  const puedeMarcarAusente = (turno.estado === "ocupado" || turno.estado === "pendiente") && yaEmpezo;
  const puedeDeshacerAusencia = turno.estado === "ausente" && esDueno;

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
            className="w-full rounded-input bg-white px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
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
            className="flex h-10 w-full items-center justify-center rounded-full border border-azul font-display text-sm font-bold text-azul transition-colors hover:bg-celeste-suave focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            Mover turno
          </button>
        </div>
      )}

      {turno.estado !== "cancelado" && (puedeCobrar || puedeCancelar || puedeMarcarAusente || puedeDeshacerAusencia) && (
        <div className="space-y-2 pt-2">
          {/*
            Cobrar es PATCH /reservas/{id}/finalizar, y su DTO exige metodoPago
            (@NotNull). Sin elegirlo el backend devuelve 400, así que el
            selector no es un adorno: es parte del contrato. Antes esta pantalla
            no lo pedía y el cobro era un simple flag local.

            Sólo aparece sobre reservas CONFIRMADAS: finalizar una que sigue en
            PENDIENTE_SENA también devuelve 400.
          */}
          {puedeCobrar && (
            <div className="rounded-input border border-borde p-3">
              <label
                htmlFor="metodo-pago"
                className="mb-1.5 block text-xs font-semibold text-grafito"
              >
                ¿Con qué pagó?
              </label>
              <select
                id="metodo-pago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                className="mb-2.5 h-10 w-full rounded-input border border-borde bg-humo px-2 text-sm text-tinta focus:border-azul focus:outline-none"
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onMarcarPagado(metodoPago)}
                className="flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cobrar y cerrar turno
              </button>
            </div>
          )}
          {puedeCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="flex h-11 w-full items-center justify-center rounded-full border-2 border-cancelado font-display text-sm font-bold text-cancelado transition-colors hover:bg-cancelado-suave focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Cancelar turno
            </button>
          )}
          {puedeMarcarAusente && (
            <button
              type="button"
              onClick={() => setConfirmando("ausente")}
              className="flex h-11 w-full items-center justify-center rounded-full border-2 border-ausente font-display text-sm font-bold text-ausente transition-colors hover:bg-ausente-suave focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Marcar ausente
            </button>
          )}
          {puedeDeshacerAusencia && (
            <button
              type="button"
              onClick={() => setConfirmando("deshacer-ausencia")}
              className="flex h-11 w-full items-center justify-center rounded-full border-2 border-azul font-display text-sm font-bold text-azul transition-colors hover:bg-celeste-suave focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Deshacer ausencia
            </button>
          )}
        </div>
      )}

      {confirmando && (
        <ModalPanel
          titulo={confirmando === "ausente" ? "Marcar ausente" : "Deshacer ausencia"}
          onClose={() => setConfirmando(null)}
        >
          <p className="text-sm text-grafito">
            {confirmando === "ausente"
              ? "El jugador no se presentó. Marcar el turno como ausente."
              : "El turno vuelve a mostrarse como confirmado."}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-tinta transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmando === "ausente") onMarcarAusente();
                else onDeshacerAusencia();
                setConfirmando(null);
              }}
              className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              Confirmar
            </button>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
