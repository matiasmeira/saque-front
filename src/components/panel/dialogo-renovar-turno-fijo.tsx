"use client";

import { ModalPanel } from "@/components/panel/modal-panel";
import { useRenovarTurnoFijo } from "@/hooks/api/use-turnos-fijos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { DIA_SEMANA_DESDE_BACK } from "@/lib/api/fechas";
import type { TurnoFijoListadoResponse } from "@/lib/api/tipos/turnos-fijos";
import { hoyISO } from "@/lib/fecha";
import { DIAS_SEMANA } from "@/lib/panel/tarifas";
import { inicioDeRenovacion } from "@/lib/panel/turno-fijo";

/** "2026-09-07" → "07/09/2026" */
function ddmmaaaa(fechaISO: string): string {
  return `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}/${fechaISO.slice(0, 4)}`;
}

/**
 * Confirma la renovación de una serie (POST /turnos-fijos/{id}/renovar): crea la serie
 * del año siguiente con la misma cancha, horario, día y cliente. Sin body — el backend
 * calcula el período solo.
 *
 * El período que se anticipa ANTES de confirmar espeja el cálculo del backend: arranca
 * el 1 de enero del año siguiente al de `fechaFinPeriodo` (o hoy si ese 1 de enero ya
 * pasó, vía `inicioDeRenovacion`) y llega hasta el 31 de diciembre de ese mismo año
 * destino. Es un alta todo-o-nada de hasta 52 reservas: el dueño tiene que ver a qué se
 * compromete antes de apretar el botón, igual que en DialogoCancelarTurnoFijo.
 */
export function DialogoRenovarTurnoFijo({
  turnoFijo,
  onClose,
}: {
  turnoFijo: TurnoFijoListadoResponse;
  onClose: () => void;
}) {
  const renovar = useRenovarTurnoFijo();

  const anioDestino = Number(turnoFijo.fechaFinPeriodo.slice(0, 4)) + 1;
  const inicio = inicioDeRenovacion(turnoFijo.fechaFinPeriodo, hoyISO());
  const fin = `${anioDestino}-12-31`;

  const diaLabel =
    DIAS_SEMANA.find((d) => d.valor === DIA_SEMANA_DESDE_BACK[turnoFijo.diaSemana])?.larga ?? turnoFijo.diaSemana;
  const cliente = turnoFijo.jugadorNombre ?? turnoFijo.nombreClienteManual ?? "Sin nombre";

  if (renovar.isSuccess) {
    const nueva = renovar.data;
    return (
      <ModalPanel titulo="Serie renovada" subtitulo={turnoFijo.canchaNombre} onClose={onClose}>
        <p className="text-sm text-tinta">
          Se creó la nueva serie con <strong>{nueva.ocurrencias.length}</strong>{" "}
          {nueva.ocurrencias.length === 1 ? "turno" : "turnos"}, del{" "}
          <strong>{ddmmaaaa(nueva.fechaInicioPeriodo)}</strong> al <strong>{ddmmaaaa(nueva.fechaFinPeriodo)}</strong>.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Entendido
        </button>
      </ModalPanel>
    );
  }

  return (
    <ModalPanel
      titulo="Renovar serie"
      subtitulo={`${turnoFijo.canchaNombre} · ${diaLabel} · ${cliente}`}
      onClose={onClose}
    >
      <p className="text-sm text-grafito">
        Se crea una serie nueva para el año que viene, con la misma cancha, horario, día y cliente.
      </p>

      <div className="mt-4 rounded-input bg-celeste-suave px-3 py-2.5 text-sm text-tinta">
        Va del <strong>{ddmmaaaa(inicio)}</strong> al <strong>{ddmmaaaa(fin)}</strong>.
      </div>

      {renovar.isError && (
        <p role="alert" className="mt-3 text-sm text-cancelado">
          {renovar.error instanceof ApiError ? mensajeVisible(renovar.error) : "No pudimos renovar la serie."}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={() => renovar.mutate(turnoFijo.id)}
          disabled={renovar.isPending}
          className="h-11 flex-1 rounded-full bg-azul text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {renovar.isPending ? "Renovando..." : "Renovar serie"}
        </button>
      </div>
    </ModalPanel>
  );
}
