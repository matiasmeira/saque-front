"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import { FormSolicitudVerificacion } from "@/components/panel/form-solicitud-verificacion";
import type { DatosSolicitudVerificacion } from "@/lib/panel/verificacion";
import type { EstadoMercadoPagoResponse } from "@/lib/api/tipos/mercadopago";

/**
 * Paso 6, el último del wizard. Dos concerns independientes:
 *
 *  - Mercado Pago: con seña obligatoria, hace falta conectar una cuenta
 *    antes de terminar (spec §3). Sin seña obligatoria, la card se reemplaza
 *    por un texto.
 *  - Verificación: los 4 datos reales que dispara la solicitud de
 *    verificación de verdad — antes "Publicar complejo" no mandaba ningún
 *    request. El dueño puede saltearla ("omitir por ahora"): el complejo ya
 *    existe y sigue armable, sólo queda PENDIENTE hasta que la mande (el
 *    panel se lo va a recordar).
 *
 * El gate de seña bloquea las DOS salidas del paso (enviar y omitir), no
 * sólo una: no tiene sentido dejar avanzar sin forma de cobrar cuando el
 * complejo la exige.
 */
export function PasoCobros({
  requiereSena,
  estadoMercadoPago,
  cargandoEstado,
  conectando,
  errorMercadoPago,
  solicitandoVerificacion,
  errorVerificacion,
  camposInvalidosVerificacion,
  onConectar,
  onAtras,
  onSolicitarVerificacion,
  onOmitirVerificacion,
  onLimpiarErrorVerificacion,
}: {
  requiereSena: boolean;
  estadoMercadoPago: EstadoMercadoPagoResponse | null;
  cargandoEstado: boolean;
  conectando: boolean;
  errorMercadoPago: string | null;
  solicitandoVerificacion: boolean;
  errorVerificacion: string | null;
  camposInvalidosVerificacion?: Record<string, string>;
  onConectar: () => void;
  onAtras: () => void;
  onSolicitarVerificacion: (datos: DatosSolicitudVerificacion) => void;
  onOmitirVerificacion: () => void;
  onLimpiarErrorVerificacion: () => void;
}) {
  const conectado = estadoMercadoPago?.conectado ?? false;
  const bloqueadoPorSena = requiereSena && !conectado;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Cobros</h2>
        <p className="mt-1 text-sm text-grafito">Conectá Mercado Pago para cobrar señas de forma online.</p>
      </div>

      {!requiereSena && (
        <div className="rounded-input border border-borde bg-humo p-4 text-sm text-grafito">
          Tu complejo no exige seña para reservar, así que esto no es necesario ahora — podés conectarlo cuando
          quieras desde Configuración.
        </div>
      )}

      {requiereSena && cargandoEstado && (
        <div className="rounded-input border border-borde p-4 text-sm text-grafito">
          Comprobando la conexión con Mercado Pago...
        </div>
      )}

      {requiereSena && !cargandoEstado && !conectado && (
        <div className="space-y-3 rounded-input border border-borde p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-celeste-suave">
              <Wallet className="size-5 text-azul" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-tinta">Mercado Pago desconectado</p>
              <p className="text-xs text-grafito">Con seña obligatoria, necesitás conectar una cuenta para publicar.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onConectar}
            disabled={conectando}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:opacity-60"
          >
            {conectando ? "Redirigiendo..." : "Conectar Mercado Pago"}
            {!conectando && <ExternalLink className="size-4" aria-hidden />}
          </button>
        </div>
      )}

      {requiereSena && !cargandoEstado && conectado && (
        <div className="flex items-center gap-3 rounded-input border border-borde bg-disponible-suave p-4">
          <CheckCircle2 className="size-8 shrink-0 text-disponible" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-tinta">Mercado Pago conectado</p>
            {estadoMercadoPago?.cuenta && <p className="text-xs text-grafito">{estadoMercadoPago.cuenta}</p>}
          </div>
        </div>
      )}

      {errorMercadoPago && (
        <p className="text-sm text-cancelado" role="alert">
          {errorMercadoPago}
        </p>
      )}

      <Link href="/panel/agenda" className="inline-block font-semibold text-azul hover:underline">
        Ir al panel y conectar Mercado Pago más tarde
      </Link>

      <div className="space-y-4 border-t border-borde pt-6">
        <div>
          <h3 className="font-display text-lg font-bold text-tinta">Verificación</h3>
          <p className="mt-1 text-sm text-grafito">
            Enviá estos datos para que confirmemos que el complejo es real. Hasta que lo aprobemos no vas a aparecer
            en el buscador ni vas a poder recibir reservas — el mes de prueba gratis arranca recién cuando se
            apruebe, así que no perdés días esperando.
          </p>
        </div>

        <FormSolicitudVerificacion
          guardando={solicitandoVerificacion}
          error={errorVerificacion}
          camposInvalidos={camposInvalidosVerificacion}
          textoBoton="Enviar y publicar"
          deshabilitado={bloqueadoPorSena}
          motivoDeshabilitado={bloqueadoPorSena ? "Conectá Mercado Pago para poder enviar la verificación." : undefined}
          onGuardar={onSolicitarVerificacion}
          onBloqueoLocal={onLimpiarErrorVerificacion}
        />

        <button
          type="button"
          onClick={onOmitirVerificacion}
          disabled={bloqueadoPorSena || solicitandoVerificacion}
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
