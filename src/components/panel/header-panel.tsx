"use client";

import { AlertTriangle, Clock } from "lucide-react";

import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { EstadoComplejo } from "@/lib/panel/agenda";

/**
 * Header del panel: nombre del complejo + cartel de estado, sólo cuando
 * corresponde (Parte 9, C2). Publicado y sin trial activo no muestra nada —
 * un cartel permanente que no dice nada nuevo es ruido.
 *
 * Las props son OPCIONALES: sin ellas lee el establecimiento y el perfil
 * reales. Con ellas usa lo que le pasen, que es como siguen funcionando las
 * pantallas del panel que todavía no se migraron.
 *
 * Sobre `estado`: EstadoComplejo ("borrador" | "publicado" | "despublicado" |
 * "suspendido") es un concepto del mock que el backend no tiene —
 * EstablecimientoResponse sólo expone isActive. Con datos reales se deriva a
 * "publicado" o "despublicado"; los otros dos estados no existen.
 *
 * `diasRestantesTrial` tampoco se puede calcular: Usuario.fechaFinPrueba está
 * en la entidad pero no se expone en ningún DTO. Con datos reales el cartel de
 * prueba no aparece; lo que sí se sabe es el plan (PerfilResponse.planSuscripcion).
 */
export function HeaderPanel({
  nombre,
  estado,
  diasRestantesTrial,
}: {
  nombre?: string;
  estado?: EstadoComplejo;
  diasRestantesTrial?: number;
} = {}) {
  const { establecimiento } = useEstablecimientoActivo();
  const { data: perfil } = usePerfil();

  const nombreVisible = nombre ?? establecimiento?.nombre ?? "";
  const estadoVisible =
    estado ??
    (establecimiento ? (establecimiento.isActive ? "publicado" : "despublicado") : undefined);
  const enPrueba = perfil?.planSuscripcion === "TRIAL";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-borde bg-white px-8">
      <h1 className="truncate font-display text-base font-bold text-tinta">{nombreVisible}</h1>

      <div className="flex items-center gap-2">
        {estadoVisible === "borrador" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            Tu complejo está en borrador · verificando
          </span>
        )}
        {(estadoVisible === "despublicado" || estadoVisible === "suspendido") && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {estadoVisible === "despublicado" ? "Complejo despublicado" : "Complejo suspendido"}
          </span>
        )}
        {estadoVisible === "publicado" && typeof diasRestantesTrial === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Prueba gratis · quedan {diasRestantesTrial} días
          </span>
        )}
        {estadoVisible === "publicado" && diasRestantesTrial === undefined && enPrueba && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Prueba gratuita
          </span>
        )}
      </div>
    </header>
  );
}
