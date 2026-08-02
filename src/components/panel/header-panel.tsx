import { AlertTriangle, Clock } from "lucide-react";
import type { EstadoComplejo } from "@/mocks/agenda";

/**
 * Header del panel: nombre del complejo + cartel de estado, solo
 * cuando corresponde (Parte 9, C2). Publicado y sin trial activo no
 * muestra nada acá — un cartel permanente que no dice nada nuevo es
 * ruido.
 */
export function HeaderPanel({
  nombre,
  estado,
  diasRestantesTrial,
}: {
  nombre: string;
  estado: EstadoComplejo;
  diasRestantesTrial?: number;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-borde bg-white px-6">
      <h1 className="truncate font-display text-base font-bold text-tinta">{nombre}</h1>

      <div className="flex items-center gap-2">
        {estado === "borrador" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            Tu complejo está en borrador · verificando
          </span>
        )}
        {(estado === "despublicado" || estado === "suspendido") && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {estado === "despublicado" ? "Complejo despublicado" : "Complejo suspendido"}
          </span>
        )}
        {estado === "publicado" && typeof diasRestantesTrial === "number" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Prueba gratis · quedan {diasRestantesTrial} días
          </span>
        )}
      </div>
    </header>
  );
}
