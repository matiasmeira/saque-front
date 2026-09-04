"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { validarPasoPoliticas, type DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { PlanSuscripcion } from "@/lib/api/tipos/comunes";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

export function PasoPoliticas({
  plan,
  guardando,
  error,
  establecimientoParcial,
  onAtras,
  onConfirmar,
}: {
  plan: PlanSuscripcion | undefined;
  guardando: boolean;
  error: string | null;
  establecimientoParcial: EstablecimientoResponse | null;
  onAtras: () => void;
  onConfirmar: (datos: DatosPasoPoliticas) => void;
}) {
  const senaForzada = plan === "FREE";

  const [requiereSena, setRequiereSena] = useState(false);
  const [requiereTelefonoVerificado, setRequiereTelefonoVerificado] = useState(false);
  const [montoSenaDefault, setMontoSenaDefault] = useState("0");
  const [horas, setHoras] = useState("24");
  const [minutos, setMinutos] = useState("30");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const senaActiva = senaForzada || requiereSena;

  function confirmar(e: FormEvent) {
    e.preventDefault();
    const datos = {
      horasCancelacionAntesPartido: Number(horas),
      minutosGraciaCancelacion: Number(minutos),
      montoSenaDefault: Number(montoSenaDefault),
    };
    const erroresValidacion = validarPasoPoliticas(datos);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    onConfirmar({
      requiereSena: senaActiva,
      requiereTelefonoVerificado,
      ...datos,
    });
  }

  return (
    <form onSubmit={confirmar} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Políticas de reserva</h2>
        <p className="mt-1 text-sm text-grafito">Definí cómo querés que funcionen las reservas en tu complejo.</p>
      </div>

      <div className="space-y-3 rounded-input border border-borde p-4">
        <label className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-tinta">Requiere seña para reservar</span>
            <span className="block text-xs text-grafito">
              {senaForzada
                ? "En el plan gratuito la seña es obligatoria y no se puede desactivar."
                : "Solicita un pago parcial anticipado para confirmar la cancha."}
            </span>
          </span>
          <input
            type="checkbox"
            checked={senaActiva}
            disabled={senaForzada}
            onChange={(e) => setRequiereSena(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 rounded border-borde accent-azul disabled:opacity-60"
          />
        </label>

        {senaActiva && (
          <div className="border-t border-borde pt-3">
            <label htmlFor="wizard-monto-sena" className="mb-1 block text-xs font-semibold text-grafito">
              Monto de seña por defecto ($)
            </label>
            <input
              id="wizard-monto-sena"
              type="number"
              min={0}
              value={montoSenaDefault}
              onChange={(e) => setMontoSenaDefault(e.target.value)}
              placeholder="Ej. 1500"
              className={campoClase}
            />
            <p className="mt-1 text-xs text-grafito">
              Se usa para prellenar la seña cuando crees una cancha nueva en el paso siguiente — después la
              podés cambiar cancha por cancha.
            </p>
            {errores.montoSenaDefault && (
              <p className="mt-1 text-xs text-cancelado" role="alert">
                {errores.montoSenaDefault}
              </p>
            )}
          </div>
        )}
      </div>

      <label className="flex items-start justify-between gap-3 rounded-input border border-borde p-4">
        <span>
          <span className="block text-sm font-semibold text-tinta">Requiere teléfono verificado</span>
          <span className="block text-xs text-grafito">Los usuarios van a tener que validar su número por SMS.</span>
        </span>
        <input
          type="checkbox"
          checked={requiereTelefonoVerificado}
          onChange={(e) => setRequiereTelefonoVerificado(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded border-borde accent-azul"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 border-t border-borde pt-6 sm:grid-cols-2">
        <div>
          <label htmlFor="wizard-horas" className="mb-1 block text-xs font-semibold text-grafito">
            Horas de anticipación para cancelar
          </label>
          <input id="wizard-horas" type="number" min={0} max={168} value={horas} onChange={(e) => setHoras(e.target.value)} className={campoClase} />
          {errores.horasCancelacionAntesPartido && (
            <p className="mt-1 text-xs text-cancelado" role="alert">
              {errores.horasCancelacionAntesPartido}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="wizard-minutos" className="mb-1 block text-xs font-semibold text-grafito">
            Minutos de gracia tras reservar
          </label>
          <input id="wizard-minutos" type="number" min={0} max={1440} value={minutos} onChange={(e) => setMinutos(e.target.value)} className={campoClase} />
          {errores.minutosGraciaCancelacion && (
            <p className="mt-1 text-xs text-cancelado" role="alert">
              {errores.minutosGraciaCancelacion}
            </p>
          )}
        </div>
      </div>

      {error && establecimientoParcial && (
        <div className="rounded-input bg-pendiente-suave p-4 text-sm">
          <p className="font-semibold text-tinta">
            Ya creamos &quot;{establecimientoParcial.nombre}&quot;, pero no pudimos terminar de guardar la
            política de cancelación: {error}
          </p>
          <p className="mt-1 text-grafito">
            Los datos de arriba no se vuelven a enviar en un reintento — sólo la política de cancelación. Si
            preferís, podés completarla más tarde desde Configuración.
          </p>
          <Link href="/panel/agenda" className="mt-2 inline-block font-semibold text-azul hover:underline">
            Ir al panel de todos modos
          </Link>
        </div>
      )}

      {error && !establecimientoParcial && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={guardando || Boolean(establecimientoParcial)}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          {guardando ? "Creando complejo..." : "Crear complejo"}
          {!guardando && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
