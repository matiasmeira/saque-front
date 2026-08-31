/**
 * Íconos de deporte que Tabler (@tabler/icons-react) no cubre, dibujados
 * a mano en el mismo lenguaje visual (viewBox 24x24, solo trazo en
 * currentColor, strokeWidth 2, puntas redondeadas) para que no se note
 * la costura entre unos y otros en el Selector de deportes.
 *
 * Puramente decorativos (aria-hidden fijo adentro): el llamador solo
 * controla tamaño/color vía className, igual que con cualquier ícono
 * de lucide o Tabler.
 */
type IconoProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconoHockey({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 3 10.5 17c-.2.8.4 1.5 1.2 1.3L14 17.7" />
      <path d="M10.5 17H14" />
      <circle cx="7" cy="19" r="1.7" />
    </svg>
  );
}

export function IconoSurf({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5c2.3 3.8 3.2 9.7 1.8 15.3-.3 1.2-.9 1.9-1.8 1.9s-1.5-.7-1.8-1.9c-1.4-5.6-.5-11.5 1.8-15.3Z" />
      <path d="M3.5 20c4-2 13-2 17 0" />
    </svg>
  );
}
