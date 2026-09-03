"use client";

import { useState, type FormEvent } from "react";
import { Check, Info } from "lucide-react";
import { usePoliticaCancelacion } from "@/hooks/api/use-politica-cancelacion";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { ActualizarPoliticaCancelacionRequest, PoliticaCancelacionResponse } from "@/lib/api/tipos/establecimientos";

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

const HORAS_MAX = 168;
const MINUTOS_MAX = 1440;

/**
 * Política de cancelación del establecimiento (horas de anticipación +
 * minutos de gracia). Autocontenida: trae sus propios datos y es dueña de
 * su query key, igual que FormFotos/SeccionDiasNoLaborables.
 *
 * A diferencia de días no laborables, siempre hay un único registro
 * (default 24h / 30min): se edita in-place, no se crea/elimina.
 */
export function SeccionPoliticaCancelacion({ establecimientoId }: { establecimientoId: number }) {
  const { politica, cargando, error, refetch, actualizar } = usePoliticaCancelacion(establecimientoId);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  function guardar(datos: ActualizarPoliticaCancelacionRequest) {
    setGuardado(false);
    actualizar.mutate(datos, {
      onSuccess: () => {
        setErrorAccion(null);
        setGuardado(true);
      },
      onError: (e) => setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar la política de cancelación."),
    });
  }

  if (cargando) return <div className="h-32 animate-pulse rounded-card bg-humo" />;

  if (error || !politica) {
    return (
      <div className="rounded-input bg-cancelado-suave p-5 text-center">
        <p className="text-sm font-semibold text-tinta">No pudimos cargar la política de cancelación.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-azul hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormPoliticaCancelacion politica={politica} guardando={actualizar.isPending} onGuardar={guardar} />

      {errorAccion && (
        <p role="alert" className="text-sm text-cancelado">
          {errorAccion}
        </p>
      )}

      {guardado && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-disponible">
          <Check className="size-4 shrink-0" aria-hidden />
          Guardado.
        </p>
      )}

      {guardado && politica.reservasFuturasAfectadas !== null && (
        <p className="flex items-start gap-1.5 rounded-input bg-humo p-3.5 text-sm text-grafito">
          <Info className="mt-0.5 size-4 shrink-0 text-azul" aria-hidden />
          Este cambio afecta a {politica.reservasFuturasAfectadas} reserva{politica.reservasFuturasAfectadas === 1 ? "" : "s"} futura
          {politica.reservasFuturasAfectadas === 1 ? "" : "s"}: van a quedar bajo la nueva política de cancelación.
        </p>
      )}
    </div>
  );
}

/**
 * Se monta ya con `politica` cargada (ver el `cargando`/`error` de arriba),
 * así el estado local se inicializa una sola vez con el valor real — sin
 * efectos para sincronizarlo, igual que FormDatosComplejo.
 */
function FormPoliticaCancelacion({
  politica,
  guardando,
  onGuardar,
}: {
  politica: PoliticaCancelacionResponse;
  guardando: boolean;
  onGuardar: (datos: ActualizarPoliticaCancelacionRequest) => void;
}) {
  const [horas, setHoras] = useState(String(politica.horasCancelacionAntesPartido));
  const [minutos, setMinutos] = useState(String(politica.minutosGraciaCancelacion));
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  function guardar(e: FormEvent) {
    e.preventDefault();
    const horasNum = Number(horas);
    const minutosNum = Number(minutos);

    if (horas.trim() === "" || !Number.isInteger(horasNum) || horasNum < 0 || horasNum > HORAS_MAX) {
      return setErrorValidacion(`Las horas de cancelación tienen que ser un número entero entre 0 y ${HORAS_MAX}.`);
    }
    if (minutos.trim() === "" || !Number.isInteger(minutosNum) || minutosNum < 0 || minutosNum > MINUTOS_MAX) {
      return setErrorValidacion(`Los minutos de gracia tienen que ser un número entero entre 0 y ${MINUTOS_MAX}.`);
    }
    setErrorValidacion(null);
    onGuardar({ horasCancelacionAntesPartido: horasNum, minutosGraciaCancelacion: minutosNum });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="politica-horas" className="mb-1 block text-xs font-semibold text-grafito">
            Horas de anticipación para cancelar
          </label>
          <input
            id="politica-horas"
            type="number"
            min={0}
            max={HORAS_MAX}
            required
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            className={campoClase}
          />
        </div>
        <div>
          <label htmlFor="politica-minutos" className="mb-1 block text-xs font-semibold text-grafito">
            Minutos de gracia tras reservar
          </label>
          <input
            id="politica-minutos"
            type="number"
            min={0}
            max={MINUTOS_MAX}
            required
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            className={campoClase}
          />
        </div>
      </div>

      <p className="text-xs text-grafito">
        El jugador puede cancelar sin perder la seña si faltan al menos esas horas para el turno, o si todavía está dentro de esos minutos desde
        que hizo la reserva.
      </p>

      {errorValidacion && (
        <p role="alert" className="text-sm text-cancelado">
          {errorValidacion}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar política"}
      </button>
    </form>
  );
}
