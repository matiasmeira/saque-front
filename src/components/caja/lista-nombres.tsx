import { User } from "lucide-react";
import type { Empleado } from "@/mocks/empleados";

/** Grande y táctil: cada nombre es un botón entero, no una fila de lista para leer con precisión de mouse. */
export function ListaNombres({ empleados, onElegir }: { empleados: Empleado[]; onElegir: (empleado: Empleado) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {empleados.map((empleado) => (
        <button
          key={empleado.id}
          type="button"
          onClick={() => onElegir(empleado)}
          className="flex flex-col items-center gap-3 rounded-card bg-white/10 px-4 py-7 text-white transition-colors hover:bg-white/20"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-celeste/20 text-celeste">
            <User className="size-8" aria-hidden />
          </span>
          <span className="text-center font-display text-lg font-bold">{empleado.nombre}</span>
        </button>
      ))}
    </div>
  );
}
