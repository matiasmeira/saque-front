"use client";

import { FormSolicitudVerificacion } from "@/components/panel/form-solicitud-verificacion";
import type { DatosSolicitudVerificacion } from "@/lib/panel/verificacion";
import { textoPasoVerificacion } from "@/lib/panel/nuevo-complejo";

/**
 * Paso 6, el último del wizard: la solicitud de verificación. Son los 4 datos
 * reales que disparan la solicitud de verdad. El dueño puede saltearla
 * ("omitir por ahora"): el complejo ya existe y sigue armable, sólo queda
 * PENDIENTE hasta que la mande (el panel se lo va a recordar).
 *
 * Si el complejo exige seña, un aviso cuenta cómo funciona hoy: la reserva queda
 * pendiente 10 minutos y las señas no se confirman hasta que llegue el cobro
 * online con Mercado Pago. Mercado Pago no existe en el backend, así que este paso
 * no depende de ningún cobro online.
 */
export function PasoVerificacion({
  complejoAdicional,
  requiereSena,
  solicitandoVerificacion,
  errorVerificacion,
  camposInvalidosVerificacion,
  onAtras,
  onSolicitarVerificacion,
  onOmitirVerificacion,
  onLimpiarErrorVerificacion,
}: {
  /** Complejo adicional: no se promete el mes de prueba, que es del primero. */
  complejoAdicional: boolean;
  requiereSena: boolean;
  solicitandoVerificacion: boolean;
  errorVerificacion: string | null;
  camposInvalidosVerificacion?: Record<string, string>;
  onAtras: () => void;
  onSolicitarVerificacion: (datos: DatosSolicitudVerificacion) => void;
  onOmitirVerificacion: () => void;
  onLimpiarErrorVerificacion: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Verificación</h2>
        <p className="mt-1 text-sm text-grafito">{textoPasoVerificacion(complejoAdicional)}</p>
      </div>

      {requiereSena && (
        <div className="rounded-input border border-borde bg-humo p-4 text-sm text-grafito">
          Cuando un jugador reserva un turno con seña, la reserva queda pendiente 10 minutos. El cobro online de la
          seña con Mercado Pago llega pronto: hasta entonces, las reservas con seña no se confirman.
        </div>
      )}

      <div className="space-y-4">
        <FormSolicitudVerificacion
          guardando={solicitandoVerificacion}
          error={errorVerificacion}
          camposInvalidos={camposInvalidosVerificacion}
          onGuardar={onSolicitarVerificacion}
          onBloqueoLocal={onLimpiarErrorVerificacion}
        />

        <button
          type="button"
          onClick={onOmitirVerificacion}
          disabled={solicitandoVerificacion}
          className="text-sm font-semibold text-azul hover:underline disabled:cursor-not-allowed disabled:text-grafito disabled:no-underline"
        >
          Omitir por ahora, lo hago después desde el panel
        </button>
      </div>

      <div className="flex items-center pt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={solicitandoVerificacion}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          Atrás
        </button>
      </div>
    </div>
  );
}
