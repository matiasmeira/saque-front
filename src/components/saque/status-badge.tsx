/**
 * Badge de estado de una reserva.
 *
 * Estos cinco colores son los unicos que se usan para estado, y
 * no se usan para nada mas. Es la regla que le permite al duenio
 * leer la grilla de turnos de un vistazo sin pensar.
 */

const ESTADOS = {
  disponible: {
    label: "Disponible",
    clase: "bg-disponible-suave text-disponible",
  },
  ocupado: {
    label: "Ocupado",
    clase: "bg-ocupado-suave text-grafito",
  },
  pendiente: {
    label: "Pendiente de pago",
    clase: "bg-pendiente-suave text-pendiente",
  },
  cancelado: {
    label: "Cancelado",
    clase: "bg-cancelado-suave text-cancelado",
  },
  ausente: {
    label: "Ausente",
    clase: "bg-ausente-suave text-ausente",
  },
} as const;

export type Estado = keyof typeof ESTADOS;

export function StatusBadge({
  estado,
  label,
  className = "",
}: {
  estado: Estado;
  /** Pisa la etiqueta por defecto — ej. "Sin turnos hoy" en vez de "Ocupado" en una tarjeta de resultado. */
  label?: string;
  className?: string;
}) {
  const { label: labelPorDefecto, clase } = ESTADOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${clase} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label ?? labelPorDefecto}
    </span>
  );
}
