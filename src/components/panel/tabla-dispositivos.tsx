import { ShieldOff } from "lucide-react";
import { fechaLarga } from "@/lib/formato";
import type { Dispositivo } from "@/mocks/dispositivos";

/**
 * Nombre editable in situ — sin modo "editar" aparte: es un input
 * siempre, con look de texto hasta que se lo toca. Revocar es la
 * herramienta de seguridad principal de esta sección (ver C9): un
 * ícono a la vista en cada fila, no escondido en un menú.
 */
export function TablaDispositivos({
  dispositivos,
  onRenombrar,
  onRevocar,
}: {
  dispositivos: Dispositivo[];
  onRenombrar: (id: string, nombre: string) => void;
  onRevocar: (dispositivo: Dispositivo) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 bg-humo px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-grafito">
        <span>Nombre</span>
        <span>Emparejado</span>
        <span>Último uso</span>
        <span className="sr-only">Acciones</span>
      </div>

      {dispositivos.map((dispositivo, indice) => (
        <div
          key={dispositivo.id}
          className={`grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-3 px-4 py-2 ${indice % 2 === 1 ? "bg-humo/50" : "bg-white"}`}
        >
          <input
            value={dispositivo.nombre}
            onChange={(e) => onRenombrar(dispositivo.id, e.target.value)}
            aria-label={`Nombre del dispositivo ${dispositivo.nombre}`}
            className="w-full truncate rounded-input border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-tinta transition-colors hover:border-borde focus:border-azul focus:bg-humo focus:outline-none"
          />
          <span className="text-sm text-grafito">{fechaLarga(dispositivo.fechaEmparejamiento)}</span>
          <span className="text-sm text-grafito">{fechaLarga(dispositivo.fechaUltimoUso)}</span>
          <button
            type="button"
            onClick={() => onRevocar(dispositivo)}
            aria-label={`Revocar ${dispositivo.nombre}`}
            title="Revocar"
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-cancelado transition-colors hover:bg-cancelado-suave"
          >
            <ShieldOff className="size-4 shrink-0" aria-hidden />
            Revocar
          </button>
        </div>
      ))}
    </div>
  );
}
