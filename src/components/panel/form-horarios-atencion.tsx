"use client";

import { useState } from "react";
import { DIA_SEMANA_A_BACK, DIA_SEMANA_DESDE_BACK, aHoraBack } from "@/lib/api/fechas";
import { DIAS_SEMANA, type DiaSemana } from "@/mocks/tarifas";
import type { HorarioAtencionDto, DiaSemanaBack } from "@/lib/api/tipos/comunes";

type Fila = { dia: DiaSemana; cerrado: boolean; abre: string; cierra: string };

const POR_DEFECTO = { abre: "09:00", cierra: "23:00" };

/**
 * El backend guarda una LISTA de `HorarioAtencionDto`, uno por día abierto: un
 * día cerrado simplemente NO está en la lista. El formulario, en cambio,
 * necesita las siete filas siempre visibles (si no, no habría dónde tildar
 * "cerrado"), así que se completa lo que falta y se descarta al enviar.
 */
export function horariosAFilas(horarios: HorarioAtencionDto[]): Fila[] {
  return DIAS_SEMANA.map(({ valor }) => {
    const delBack = horarios.find((h) => DIA_SEMANA_DESDE_BACK[h.diaSemana as DiaSemanaBack] === valor);
    return delBack
      ? { dia: valor, cerrado: false, abre: delBack.horaApertura.slice(0, 5), cierra: delBack.horaCierre.slice(0, 5) }
      : { dia: valor, cerrado: true, ...POR_DEFECTO };
  });
}

function filasAHorarios(filas: Fila[]): HorarioAtencionDto[] {
  return filas
    .filter((f) => !f.cerrado)
    .map((f) => ({
      diaSemana: DIA_SEMANA_A_BACK[f.dia],
      horaApertura: aHoraBack(f.abre),
      horaCierre: aHoraBack(f.cierra),
    }));
}

/**
 * Por día de la semana, no un solo horario general — alimenta la
 * disponibilidad (agenda) y el % de ocupación de Reportes, así que tiene que
 * poder distinguir, por ejemplo, un domingo cerrado.
 *
 * La validación de acá se adelanta a la del backend para no gastar un 400:
 * `EstablecimientoService.validarHorarios` rechaza apertura == cierre (un día
 * así no bloquearía nada y equivale a estar cerrado, pero de forma confusa) y
 * más de un horario por día — esto último no puede pasar con este formulario,
 * que tiene exactamente una fila por día.
 */
export function FormHorariosAtencion({
  horarios,
  guardando,
  onGuardar,
}: {
  horarios: HorarioAtencionDto[];
  guardando: boolean;
  onGuardar: (horarios: HorarioAtencionDto[]) => void;
}) {
  const [filas, setFilas] = useState<Fila[]>(() => horariosAFilas(horarios));
  const [error, setError] = useState<string | null>(null);

  function actualizar(dia: DiaSemana, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f) => (f.dia === dia ? { ...f, ...cambios } : f)));
  }

  function guardar() {
    for (const f of filas) {
      if (f.cerrado) continue;
      const etiqueta = DIAS_SEMANA.find((x) => x.valor === f.dia)?.larga ?? f.dia;
      if (f.abre === f.cierra) {
        setError(`${etiqueta}: la apertura y el cierre no pueden ser la misma hora. Si no abrís, marcalo como cerrado.`);
        return;
      }
      if (f.abre > f.cierra) {
        setError(`${etiqueta}: el horario de cierre tiene que ser después del de apertura.`);
        return;
      }
    }
    setError(null);
    onGuardar(filasAHorarios(filas));
  }

  const todosCerrados = filas.every((f) => f.cerrado);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {filas.map((f) => {
          const etiqueta = DIAS_SEMANA.find((x) => x.valor === f.dia)?.larga ?? f.dia;
          return (
            <div key={f.dia} className="flex flex-wrap items-center gap-3 rounded-input bg-humo px-3.5 py-2.5">
              <span className="w-24 shrink-0 text-sm font-semibold text-tinta">{etiqueta}</span>
              <label className="flex items-center gap-1.5 text-xs text-grafito">
                <input
                  type="checkbox"
                  checked={f.cerrado}
                  onChange={(e) => actualizar(f.dia, { cerrado: e.target.checked })}
                  className="size-4 rounded border-borde accent-azul"
                />
                Cerrado
              </label>
              {!f.cerrado && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={f.abre}
                    onChange={(e) => actualizar(f.dia, { abre: e.target.value })}
                    aria-label={`Hora de apertura del ${etiqueta}`}
                    className="rounded-input bg-white px-2 py-1.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                  />
                  <span className="text-xs text-grafito">a</span>
                  <input
                    type="time"
                    value={f.cierra}
                    onChange={(e) => actualizar(f.dia, { cierra: e.target.value })}
                    aria-label={`Hora de cierre del ${etiqueta}`}
                    className="rounded-input bg-white px-2 py-1.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sin ningún día abierto no hay slots que ofrecer: la disponibilidad
          queda vacía y nadie puede reservar. El backend lo acepta, así que el
          aviso va acá. */}
      {todosCerrados && (
        <p className="text-sm text-pendiente">
          Con los siete días cerrados no se puede reservar en tu complejo: la grilla de disponibilidad queda vacía.
        </p>
      )}

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar horarios"}
      </button>
    </div>
  );
}
