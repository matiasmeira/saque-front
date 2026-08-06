import { Pencil, UserX } from "lucide-react";
import { fechaLarga } from "@/lib/formato";
import { PERMISOS, type Empleado, type EstadoEmpleado } from "@/mocks/empleados";

const ESTILO_ESTADO: Record<EstadoEmpleado, string> = {
  activo: "bg-disponible-suave text-disponible",
  inactivo: "bg-ocupado-suave text-grafito",
};

const ETIQUETA_ESTADO: Record<EstadoEmpleado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
};

/** "Ver agenda, Cobrar turnos +2" — resumen compacto para la tabla, el detalle completo vive en la ficha. */
function resumenPermisos(empleado: Empleado): string {
  if (empleado.permisos.length === 0) return "Sin permisos";
  const etiquetas = empleado.permisos.map((p) => PERMISOS.find((x) => x.valor === p)?.etiqueta ?? p);
  if (etiquetas.length <= 2) return etiquetas.join(", ");
  return `${etiquetas.slice(0, 2).join(", ")} +${etiquetas.length - 2}`;
}

const COLUMNAS = "grid-cols-[1.3fr_1fr_2fr_1fr_auto]";

/** Cada empleado tiene su propia lista de permisos (ver form-ficha-empleado.tsx) — no hay más un rol fijo que resuma "qué puede hacer". */
export function TablaEmpleados({
  empleados,
  onEditar,
  onDarDeBaja,
}: {
  empleados: Empleado[];
  onEditar: (empleado: Empleado) => void;
  onDarDeBaja: (empleado: Empleado) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className={`grid ${COLUMNAS} gap-3 bg-humo px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito`}>
        <span>Nombre</span>
        <span>Estado</span>
        <span>Permisos</span>
        <span>Desde</span>
        <span className="sr-only">Acciones</span>
      </div>

      <div className="divide-y divide-borde/60">
        {empleados.map((empleado) => (
          <div key={empleado.id} className={`grid ${COLUMNAS} items-center gap-3 px-6 py-3.5 transition-colors hover:bg-humo/60`}>
            <span className="truncate text-sm font-semibold text-tinta">{empleado.nombre}</span>
            <span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_ESTADO[empleado.estado]}`}>
                {ETIQUETA_ESTADO[empleado.estado]}
              </span>
            </span>
            <span className="truncate text-sm text-grafito">{resumenPermisos(empleado)}</span>
            <span className="text-sm text-grafito">{fechaLarga(empleado.fechaAlta)}</span>
            <span className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onEditar(empleado)}
                aria-label={`Editar permisos de ${empleado.nombre}`}
                title="Editar permisos"
                className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-white"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              {empleado.estado === "activo" && (
                <button
                  type="button"
                  onClick={() => onDarDeBaja(empleado)}
                  aria-label={`Dar de baja a ${empleado.nombre}`}
                  title="Dar de baja"
                  className="flex size-8 items-center justify-center rounded-full text-grafito transition-colors hover:bg-cancelado-suave hover:text-cancelado"
                >
                  <UserX className="size-4" aria-hidden />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
