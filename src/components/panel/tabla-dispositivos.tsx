import { ShieldOff } from "lucide-react";
import { fechaLarga } from "@/lib/formato";
import { esEstaComputadora } from "@/lib/dispositivo-actual";
import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";
import { EtiquetaMovil } from "@/components/panel/etiqueta-movil";

const COLUMNAS = "md:grid-cols-[1.4fr_1fr_1fr_auto]";

/**
 * Revocar es la herramienta de seguridad principal de esta sección: un botón a
 * la vista en cada fila, no escondido en un menú.
 *
 * El nombre NO se edita acá: el backend fija el `label` al emparejar y no expone
 * ningún endpoint para cambiarlo después (DispositivoCajaController tiene POST,
 * GET y DELETE, nada más). Antes esto era un input editable in situ que sólo
 * mutaba estado local — prometía algo que no se guardaba en ningún lado.
 *
 * `idDispositivoActual` marca la fila de la PC desde la que se está mirando
 * esta tabla (ver `esEstaComputadora`). Puede ser `null` si este navegador
 * nunca guardó ese id (no se emparejó, o se emparejó por un flujo que no lo
 * devuelve) — en ese caso ninguna fila se marca.
 */
export function TablaDispositivos({
  dispositivos,
  idDispositivoActual,
  onRevocar,
}: {
  dispositivos: DispositivoCajaResponse[];
  idDispositivoActual: number | null;
  onRevocar: (dispositivo: DispositivoCajaResponse) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`hidden md:grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Emparejado</span>
        <span>Último uso</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {dispositivos.map((dispositivo) => {
          const esEsta = esEstaComputadora(dispositivo, idDispositivoActual);
          return (
            <div
              key={dispositivo.id}
              className={`grid grid-cols-2 ${COLUMNAS} gap-3 px-4 py-3.5 transition-colors hover:bg-humo/60 md:items-center md:px-6`}
            >
              <span className="flex min-w-0 items-center gap-2 truncate px-2 text-sm font-semibold text-tinta max-md:col-span-2 max-md:px-0">
                <span className="truncate">{dispositivo.label}</span>
                {esEsta && (
                  <span className="shrink-0 rounded-full bg-celeste-suave px-2 py-0.5 text-xs font-semibold text-azul">
                    Esta computadora
                  </span>
                )}
              </span>
              <span className="text-sm text-grafito">
                <EtiquetaMovil>Emparejado</EtiquetaMovil>
                {fechaLarga(dispositivo.createdAt.slice(0, 10))}
              </span>
              <span className="text-sm text-grafito">
                <EtiquetaMovil>Último uso</EtiquetaMovil>
                {dispositivo.lastUsedAt ? fechaLarga(dispositivo.lastUsedAt.slice(0, 10)) : "Nunca"}
              </span>
              <button
                type="button"
                onClick={() => onRevocar(dispositivo)}
                aria-label={esEsta ? "Desvincular esta computadora" : `Revocar ${dispositivo.label}`}
                title={esEsta ? "Desvincular esta computadora" : "Revocar"}
                className="flex h-9 max-md:h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-cancelado transition-colors hover:bg-cancelado-suave max-md:col-span-2 max-md:justify-self-end"
              >
                <ShieldOff className="size-4 shrink-0" aria-hidden />
                {esEsta ? "Desvincular" : "Revocar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
