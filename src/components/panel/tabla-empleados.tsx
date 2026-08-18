import { KeyRound, ShieldCheck, UserX } from "lucide-react";
import { etiquetaPermiso } from "@/lib/permisos-empleado";
import type { EmpleadoResponse } from "@/lib/api/tipos/empleados";

/** "Gestionar caja, Cobrar turnos +2" — el detalle completo vive en la ficha. */
function resumenPermisos(empleado: EmpleadoResponse): string {
  if (empleado.permisos.length === 0) return "Sin permisos";
  const etiquetas = empleado.permisos.map(etiquetaPermiso);
  if (etiquetas.length <= 2) return etiquetas.join(", ");
  return `${etiquetas.slice(0, 2).join(", ")} +${etiquetas.length - 2}`;
}

const COLUMNAS = "grid-cols-[1.3fr_1fr_2fr_auto]";

/**
 * No hay columna "Desde": `EmpleadoResponse` no trae fecha de alta.
 *
 * Tampoco se edita el nombre. El backend no expone ningún endpoint para
 * cambiarlo, y no es un detalle cosmético: el nombre ES la credencial con la
 * que la persona se loguea en el mostrador (`POST /auth/empleados/login` pide
 * `{establecimientoId, nombre, pin}`).
 */
export function TablaEmpleados({
  empleados,
  onEditarPermisos,
  onCambiarPin,
  onDarDeBaja,
}: {
  empleados: EmpleadoResponse[];
  onEditarPermisos: (empleado: EmpleadoResponse) => void;
  onCambiarPin: (empleado: EmpleadoResponse) => void;
  onDarDeBaja: (empleado: EmpleadoResponse) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Estado</span>
        <span>Permisos</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {empleados.map((empleado) => (
          <div key={empleado.id} className={`grid ${COLUMNAS} items-center gap-3 px-6 py-3.5 transition-colors hover:bg-humo/60`}>
            <span className={`truncate text-sm font-semibold ${empleado.activo ? "text-tinta" : "text-grafito line-through"}`}>
              {empleado.nombre}
            </span>
            <span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  empleado.activo ? "bg-disponible-suave text-disponible" : "bg-ocupado-suave text-grafito"
                }`}
              >
                {empleado.activo ? "Activo" : "Inactivo"}
              </span>
            </span>
            <span className="truncate text-sm text-grafito">{resumenPermisos(empleado)}</span>
            <span className="flex items-center justify-end gap-1">
              {empleado.activo && (
                <>
                  <button
                    type="button"
                    onClick={() => onEditarPermisos(empleado)}
                    aria-label={`Editar permisos de ${empleado.nombre}`}
                    title="Editar permisos"
                    className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white hover:text-azul"
                  >
                    <ShieldCheck className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onCambiarPin(empleado)}
                    aria-label={`Cambiar el PIN de ${empleado.nombre}`}
                    title="Cambiar PIN"
                    className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white hover:text-azul"
                  >
                    <KeyRound className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDarDeBaja(empleado)}
                    aria-label={`Dar de baja a ${empleado.nombre}`}
                    title="Dar de baja"
                    className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-cancelado-suave hover:text-cancelado"
                  >
                    <UserX className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
