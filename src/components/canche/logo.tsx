/**
 * Logo de Canche.
 *
 * OJO con el chevron: el skewX(-9) inclina el dibujo pero no
 * recalcula el origen, asi que el translate(14.7, 15) es un valor
 * medido para que quede centrado. Si cambias el angulo o el grosor
 * del trazo, hay que volver a centrarlo.
 */

import Image from "next/image";

type LogoProps = {
  /** "color" para fondo claro, "blanco" para fondo oscuro */
  variant?: "color" | "blanco";
  className?: string;
};

function Chevron({ variant }: { variant: "color" | "blanco" }) {
  const frente = variant === "color" ? "#0E56C9" : "#FFFFFF";
  return (
    <g
      transform="translate(14.7,15) skewX(-9)"
      fill="none"
      strokeLinejoin="miter"
      strokeMiterlimit={6}
      strokeLinecap="butt"
    >
      <path d="M 0 0 L 16 17 L 0 34" stroke="#5CC5F2" strokeWidth={8} />
      <path d="M 22 0 L 38 17 L 22 34" stroke={frente} strokeWidth={10.5} />
    </g>
  );
}

/** Solo el simbolo. Para favicon, avatares y espacios chicos. */
export function Isotipo({ variant = "color", className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Canche"
    >
      <Chevron variant={variant} />
    </svg>
  );
}

/** Simbolo + palabra. El que va en el header. */
export function Logo({ variant = "color", className }: LogoProps) {
  const texto = variant === "color" ? "#0A1F3D" : "#FFFFFF";
  return (
    <svg
      viewBox="0 0 253 64"
      className={className}
      role="img"
      aria-label="Canche"
    >
      <Chevron variant={variant} />
      <text
        x={75}
        y={49}
        fill={texto}
        fontSize={46}
        fontWeight={800}
        letterSpacing={-1.8}
        style={{ fontFamily: "var(--font-archivo), sans-serif" }}
      >
        canche
      </text>
    </svg>
  );
}

/**
 * Isologo completo (canche + pill ".ar") para fondos oscuros.
 *
 * Es un PNG, no vectorial, en blanco con fondo transparente (bordes
 * de la ".ar" quedan blancos): solo queda prolijo sobre bg-tinta u
 * otro fondo oscuro. No usar sobre fondo claro: el trazo blanco
 * desaparece.
 *
 * Usa `canche-horizontal-dark-crop-removebg-preview.png`, versión
 * sin fondo de `canche-horizontal-dark-crop.png` (que a su vez es un
 * recorte de `canche-horizontal-dark.png`; los originales quedan
 * intactos en public/logos/).
 */
export function LogoMarca({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/canche-horizontal-dark-crop-removebg-preview.png"
      alt="Canche.ar"
      width={904}
      height={176}
      preload
      className={className}
    />
  );
}
