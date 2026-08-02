"use client";

import { CheckCircle2, Clock3, Link2Off } from "lucide-react";
import { fechaLarga } from "@/lib/formato";
import type { CuentaMercadoPago, EstadoMercadoPago } from "@/mocks/config";

const ESTILO: Record<EstadoMercadoPago, { icono: typeof CheckCircle2; clase: string; etiqueta: string }> = {
  conectado: { icono: CheckCircle2, clase: "bg-disponible-suave text-disponible", etiqueta: "Conectado" },
  pendiente: { icono: Clock3, clase: "bg-pendiente-suave text-pendiente", etiqueta: "Verificando identidad (KYC)" },
  no_conectado: { icono: Link2Off, clase: "bg-ocupado-suave text-grafito", etiqueta: "No conectado" },
};

/**
 * Este estado define si el complejo puede cobrar señas online — por
 * eso siempre se explica la consecuencia, nunca solo el badge. La
 * conexión real es un flujo OAuth de MercadoPago (fuera de esta
 * pantalla); acá el botón solo simula el disparador.
 */
export function PanelMercadoPago({ cuenta, onConectar }: { cuenta: CuentaMercadoPago; onConectar: () => void }) {
  const { icono: Icono, clase, etiqueta } = ESTILO[cuenta.estado];

  return (
    <div className="space-y-4">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${clase}`}>
        <Icono className="size-4 shrink-0" aria-hidden />
        {etiqueta}
      </span>

      {cuenta.estado === "conectado" && (
        <div className="rounded-input bg-humo p-3.5 text-sm text-tinta">
          <p>
            Cuenta <span className="font-semibold">{cuenta.emailConectado}</span>
          </p>
          {cuenta.fechaConexion && <p className="mt-0.5 text-xs text-grafito">Conectada desde el {fechaLarga(cuenta.fechaConexion)}.</p>}
        </div>
      )}

      {cuenta.estado === "pendiente" && (
        <p className="text-sm text-grafito">
          Estamos verificando tu identidad con MercadoPago. Mientras tanto podés seguir operando — te avisamos apenas
          esté listo para cobrar señas online.
        </p>
      )}

      {cuenta.estado === "no_conectado" && (
        <p className="text-sm text-grafito">
          Sin conexión no podés cobrar señas online: el complejo funciona igual, pero cada reserva depende de que el
          cliente pague todo en el mostrador.
        </p>
      )}

      <button
        type="button"
        onClick={onConectar}
        disabled={cuenta.estado === "pendiente"}
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        {cuenta.estado === "conectado" ? "Reconectar MercadoPago" : cuenta.estado === "pendiente" ? "Verificando..." : "Conectar MercadoPago"}
      </button>
    </div>
  );
}
