import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { formatearPrecio } from "@/lib/formato";
import { etiquetaDias, type Tarifa } from "@/mocks/tarifas";

/**
 * Reglas de excepción sobre el precio base de UNA cancha (nunca se
 * aplican a varias a la vez). Vacío es un estado normal, no un
 * error: la mayoría de las canchas van a operar solo con precio
 * base — acá se lo dice explícito en vez de mostrar una lista en
 * blanco sin explicación.
 */
export function ListaTarifas({
  tarifas,
  onAgregar,
  onEditar,
  onQuitar,
}: {
  tarifas: Tarifa[];
  onAgregar: () => void;
  onEditar: (tarifa: Tarifa) => void;
  onQuitar: (tarifa: Tarifa) => void;
}) {
  return (
    <div className="rounded-card bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-tinta">Tarifas especiales</h2>
          <p className="mt-0.5 text-sm text-grafito">Reglas de excepción por día y horario, por encima del precio base.</p>
        </div>
        <button
          type="button"
          onClick={onAgregar}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-azul px-3.5 font-display text-xs font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          <Plus className="size-3.5" aria-hidden />
          Nueva tarifa
        </button>
      </div>

      {tarifas.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-input bg-humo py-10 text-center">
          <Tag className="size-6 text-grafito" aria-hidden />
          <p className="text-sm font-semibold text-tinta">Todavía no cargaste tarifas especiales</p>
          <p className="max-w-xs text-sm text-grafito">Por ahora rige el precio base en todo horario.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tarifas.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-input bg-humo p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-tinta">
                  {etiquetaDias(t.dias)} · {t.horaDesde}–{t.horaHasta}
                </p>
                <p className="mt-0.5 text-xs text-grafito">
                  {t.precios.map((p) => `${p.duracionMinutos}min ${formatearPrecio(p.precio)}`).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditar(t)}
                  aria-label={`Editar tarifa ${etiquetaDias(t.dias)} ${t.horaDesde}–${t.horaHasta}`}
                  className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onQuitar(t)}
                  aria-label={`Quitar tarifa ${etiquetaDias(t.dias)} ${t.horaDesde}–${t.horaHasta}`}
                  className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
