/**
 * Set propio de íconos de deporte, mismo lenguaje visual que lucide-react
 * (viewBox 24x24, solo trazo en currentColor, strokeWidth 2, puntas
 * redondeadas): no existe un ícono de pelota/raqueta/etc. en lucide para
 * casi ninguno de estos deportes, así que se dibujan a mano en vez de
 * forzar un ícono genérico que no represente nada.
 *
 * Todos son puramente decorativos (aria-hidden fijo adentro), así el
 * llamador solo controla tamaño/color vía className, igual que con
 * cualquier ícono de lucide.
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

export function IconoFutbol({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <rect x="8.5" y="8.5" width="7" height="7" />
      <path d="M15.5 8.5 18.5 5.5M8.5 8.5 5.5 5.5M8.5 15.5 5.5 18.5M15.5 15.5 18.5 18.5" />
    </svg>
  );
}

export function IconoRaqueta({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="8.5" cy="7" rx="4.3" ry="6" />
      <path d="M8.5 1.2v11.6M4.7 7h7.6" />
      <line x1="8.5" y1="13" x2="8.5" y2="18.5" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function IconoBasquet({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
      <path d="M5.5 5.5c3 3 3 10 0 13M18.5 5.5c-3 3-3 10 0 13" />
    </svg>
  );
}

export function IconoHockey({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 3 10.5 17c-.2.8.4 1.5 1.2 1.3L14 17.7" />
      <path d="M10.5 17H14" />
      <circle cx="7" cy="19" r="1.7" />
    </svg>
  );
}

export function IconoPingPong({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8.5" cy="8" r="4" />
      <line x1="8.5" y1="12" x2="8.5" y2="16.5" />
      <circle cx="17.5" cy="15.5" r="1.8" />
    </svg>
  );
}

export function IconoVoley({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9.5c4 2 13 2 17 0" />
      <path d="M6.3 4.5c1 5 1 10-1 15" />
      <path d="M17.7 4.5c-1 5-1 10 1 15" />
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

export function IconoPatinaje({ className }: IconoProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 16h13a3 3 0 0 0 3-3V9.5l-5.5-2.8L11 9.5H4a1 1 0 0 0-1 1V15a1 1 0 0 0 1 1Z" />
      <circle cx="6.5" cy="19.3" r="1.5" />
      <circle cx="11.5" cy="19.3" r="1.5" />
      <circle cx="16.5" cy="19.3" r="1.5" />
    </svg>
  );
}
