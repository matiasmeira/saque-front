"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import type { EstadoMercadoPagoResponse } from "@/lib/api/tipos/mercadopago";

/**
 * Paso 6, el último del wizard. El gate de "Publicar complejo" es el fix más
 * importante de este paso (spec §3): con seña obligatoria, hace falta
 * Mercado Pago conectado. Sin seña obligatoria, la card se reemplaza por un
 * texto — no hace falta conectar nada para publicar.
 */
export function PasoCobros({
  requiereSena,
  estadoMercadoPago,
  cargandoEstado,
  conectando,
  publicando,
  error,
  onConectar,
  onAtras,
  onPublicar,
}: {
  requiereSena: boolean;
  estadoMercadoPago: EstadoMercadoPagoResponse | null;
  cargandoEstado: boolean;
  conectando: boolean;
  publicando: boolean;
  error: string | null;
  onConectar: () => void;
  onAtras: () => void;
  onPublicar: () => void;
}) {
  const conectado = estadoMercadoPago?.conectado ?? false;
  const bloqueadoPorSena = requiereSena && !conectado;

  function publicar(e: FormEvent) {
    e.preventDefault();
    if (bloqueadoPorSena) return;
    onPublicar();
  }

  return (
    <form onSubmit={publicar} className="space-y-6">
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

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <Link href="/panel/agenda" className="inline-block font-semibold text-azul hover:underline">
        Ir al panel y conectar Mercado Pago más tarde
      </Link>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={publicando}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={bloqueadoPorSena || publicando}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          {publicando ? "Publicando..." : "Publicar complejo"}
          {!publicando && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
