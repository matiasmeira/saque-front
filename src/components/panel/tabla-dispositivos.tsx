import { ShieldOff } from "lucide-react";
import { fechaLarga } from "@/lib/formato";
import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";

/**
 * Revocar es la herramienta de seguridad principal de esta sección: un botón a
 * la vista en cada fila, no escondido en un menú.
 *
 * El nombre NO se edita acá: el backend fija el `label` al emparejar y no expone
 * ningún endpoint para cambiarlo después (DispositivoCajaController tiene POST,
 * GET y DELETE, nada más). Antes esto era un input editable in situ que sólo
 * mutaba estado local — prometía algo que no se guardaba en ningún lado.
 */
export function TablaDispositivos({
  dispositivos,
  onRevocar,
}: {
  dispositivos: DispositivoCajaResponse[];
  onRevocar: (dispositivo: DispositivoCajaResponse) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito">
        <span>Nombre</span>
        <span>Emparejado</span>
        <span>Último uso</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {dispositivos.map((dispositivo) => (
          <div
            key={dispositivo.id}
            className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-3 px-6 py-3.5 transition-colors hover:bg-humo/60"
          >
            <span className="truncate px-2 text-sm font-semibold text-tinta">{dispositivo.label}</span>
            <span className="text-sm text-grafito">{fechaLarga(dispositivo.createdAt.slice(0, 10))}</span>
            <span className="text-sm text-grafito">
              {dispositivo.lastUsedAt ? fechaLarga(dispositivo.lastUsedAt.slice(0, 10)) : "Nunca"}
            </span>
            <button
              type="button"
              onClick={() => onRevocar(dispositivo)}
              aria-label={`Revocar ${dispositivo.label}`}
              title="Revocar"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-cancelado transition-colors hover:bg-cancelado-suave"
            >
              <ShieldOff className="size-4 shrink-0" aria-hidden />
              Revocar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
