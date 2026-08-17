import { User } from "lucide-react";

/**
 * Lo único que el mostrador sabe de un empleado antes de que se identifique:
 * EmpleadoNombreResponse del backend es exactamente {id, nombre}. Ni permisos,
 * ni PIN, ni si está activo — la lista ya viene filtrada a los activos.
 */
export type EmpleadoMostrador = { id: number; nombre: string };


/** Grande y táctil: cada nombre es un botón entero, no una fila de lista para leer con precisión de mouse. */
export function ListaNombres({ empleados, onElegir }: { empleados: EmpleadoMostrador[]; onElegir: (empleado: EmpleadoMostrador) => void }) {
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
