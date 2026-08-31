import type { ReactNode } from "react";

/**
 * Fila de un campo de formulario: ícono + label + control.
 *
 * La usan Deporte, Dónde, Cuándo y Franja en el buscador de A1, y la
 * van a heredar los filtros de A2 y el checkout de A7. El padding
 * lateral lo pone quien contiene el grupo de campos, no cada fila
 * — así el borde-1px entre filas queda de punta a punta.
 */
export function CampoFormulario({
  icon,
  label,
  htmlFor,
  children,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 py-3.5 ${className}`}>
      <span className="text-grafito">{icon}</span>
      <div className="min-w-0 flex-1">
        <label
          htmlFor={htmlFor}
          className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-grafito"
        >
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}
