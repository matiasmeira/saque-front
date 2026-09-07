"use client";

import { useState } from "react";

import { ModalPanel } from "@/components/panel/modal-panel";
import { useCancelarTurnoFijo } from "@/hooks/api/use-turnos-fijos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { DIA_SEMANA_DESDE_BACK, aFechaHora } from "@/lib/api/fechas";
import type { CancelacionTurnoFijoResponse, TurnoFijoListadoResponse } from "@/lib/api/tipos/turnos-fijos";
import { hoyISO } from "@/lib/fecha";
import { useHoraActual } from "@/lib/hora-actual";
import { DIAS_SEMANA } from "@/lib/panel/tarifas";
import { ocurrenciasACancelar, ocurrenciasDelPeriodo } from "@/lib/panel/turno-fijo";

/** "2026-09-06T14:32:07" — hora local sin offset, en el mismo formato que ocurrenciasACancelar espera. */
function ahoraComoISO(ahora: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}

type EtiquetaMotivo = { uno: string; varios: string };

/** Motivos crudos que puede mandar `omitidas` — ver ESTADOS_INTOCABLES del backend. */
const ETIQUETAS_MOTIVO_OMISION: Record<string, EtiquetaMotivo> = {
  FINALIZADA: { uno: "ya se jugó", varios: "ya se jugaron" },
  AUSENTE: { uno: "quedó marcado como ausente", varios: "quedaron marcados como ausentes" },
  CANCELADA: { uno: "ya estaba cancelado", varios: "ya estaban cancelados" },
  CANCELADA_PRERESERVA: {
    uno: "la preseña había vencido sin confirmar",
    varios: "las preseñas habían vencido sin confirmar",
  },
};

/**
 * "2 quedaron como estaban porque ya se jugaron." Agrupa por motivo para no
 * repetir la frase por cada ocurrencia omitida; si hay motivos mezclados
 * (raro: implica que alguna ocurrencia futura ya estaba en un estado
 * intocable antes de esta baja) desglosa por razón en vez de forzar una sola
 * frase que no cubriría a todas.
 */
function resumenOmitidas(omitidas: CancelacionTurnoFijoResponse["omitidas"]): string {
  const porMotivo = new Map<string, number>();
  for (const o of omitidas) porMotivo.set(o.motivo, (porMotivo.get(o.motivo) ?? 0) + 1);

  if (porMotivo.size === 1) {
    const [[motivo, cantidad]] = porMotivo;
    const etiqueta = ETIQUETAS_MOTIVO_OMISION[motivo];
    const razon = (cantidad === 1 ? etiqueta?.uno : etiqueta?.varios) ?? motivo;
    return `${cantidad} ${cantidad === 1 ? "quedó" : "quedaron"} como estaba${cantidad === 1 ? "" : "n"} porque ${razon}.`;
  }

  const detalle = [...porMotivo.entries()]
    .map(([motivo, cantidad]) => {
      const etiqueta = ETIQUETAS_MOTIVO_OMISION[motivo];
      return `${cantidad} ${(cantidad === 1 ? etiqueta?.uno : etiqueta?.varios) ?? motivo}`;
    })
    .join(", ");
  return `${omitidas.length} quedaron como estaban: ${detalle}.`;
}

/**
 * Confirma la baja de una serie completa (POST /turnos-fijos/{id}/cancelar).
 *
 * El conteo en vivo reconstruye el calendario TEÓRICO del período con
 * ocurrenciasDelPeriodo (el mismo generador que usa el alta) y le aplica el
 * corte de ocurrenciasACancelar. No es una promesa exacta — no filtra por
 * estado, así que un turno ya finalizado entra igual en el conteo — es el
 * ALCANCE del corte, para que el dueño sepa a qué se compromete antes de
 * confirmar. El resumen final que se muestra después SÍ es exacto: viene
 * directo de la respuesta del backend, `omitidas` incluida.
 */
export function DialogoCancelarTurnoFijo({
  turnoFijo,
  onClose,
}: {
  turnoFijo: TurnoFijoListadoResponse;
  onClose: () => void;
}) {
  const hoy = hoyISO();
  const [desde, setDesde] = useState(hoy);
  const ahora = useHoraActual();
  const cancelar = useCancelarTurnoFijo();

  const ocurrenciasTeoricas = ocurrenciasDelPeriodo(
    turnoFijo.fechaInicioPeriodo,
    turnoFijo.fechaFinPeriodo,
    turnoFijo.diaSemana,
  ).map((fecha) => aFechaHora(fecha, turnoFijo.horaInicio));

  const cantidad = ocurrenciasACancelar(ocurrenciasTeoricas, desde, ahoraComoISO(ahora)).length;

  const diaLabel =
    DIAS_SEMANA.find((d) => d.valor === DIA_SEMANA_DESDE_BACK[turnoFijo.diaSemana])?.larga ?? turnoFijo.diaSemana;
  const cliente = turnoFijo.jugadorNombre ?? turnoFijo.nombreClienteManual ?? "Sin nombre";

  if (cancelar.isSuccess) {
    const { canceladas, omitidas } = cancelar.data;
    return (
      <ModalPanel titulo="Serie cancelada" subtitulo={turnoFijo.canchaNombre} onClose={onClose}>
        <p className="text-sm text-tinta">
          Se {canceladas === 1 ? "dio" : "dieron"} de baja <strong>{canceladas}</strong>{" "}
          {canceladas === 1 ? "turno" : "turnos"}.
        </p>
        {omitidas.length > 0 && <p className="mt-2 text-sm text-grafito">{resumenOmitidas(omitidas)}</p>}
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
    <ModalPanel titulo="Cancelar serie" subtitulo={`${turnoFijo.canchaNombre} · ${diaLabel} · ${cliente}`} onClose={onClose}>
      <p className="text-sm text-grafito">
        Se cancelan los turnos de esta serie a partir de la fecha elegida. Los que ya se jugaron o quedaron
        marcados como ausentes no se tocan.
      </p>

      <div className="mt-4">
        <label htmlFor="cancelar-turno-fijo-desde" className="mb-1 block text-xs font-semibold text-grafito">
          Cancelar desde el
        </label>
        <input
          id="cancelar-turno-fijo-desde"
          type="date"
          value={desde}
          min={hoy}
          onChange={(e) => setDesde(e.target.value)}
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
      </div>

      <div className="mt-4 rounded-input bg-celeste-suave px-3 py-2.5 text-sm text-tinta">
        {cantidad === 0 ? (
          <>Ningún turno futuro entra en ese corte. La serie igual queda marcada como cancelada.</>
        ) : (
          <>
            Se van a dar de baja hasta <strong>{cantidad}</strong> {cantidad === 1 ? "turno" : "turnos"}.
          </>
        )}
      </div>

      {cancelar.isError && (
        <p role="alert" className="mt-3 text-sm text-cancelado">
          {cancelar.error instanceof ApiError ? mensajeVisible(cancelar.error) : "No pudimos cancelar la serie."}
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
          onClick={() => cancelar.mutate({ id: turnoFijo.id, desde })}
          disabled={cancelar.isPending}
          className="h-11 flex-1 rounded-full bg-cancelado text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {cancelar.isPending ? "Cancelando..." : "Cancelar serie"}
        </button>
      </div>
    </ModalPanel>
  );
}
