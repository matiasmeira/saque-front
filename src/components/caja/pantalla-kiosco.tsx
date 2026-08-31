import type { ReactNode } from "react";
import { Logo } from "@/components/canche/logo";

/**
 * Layout compartido de toda la zona E (/caja/*). A propósito no se
 * parece al panel: pantalla completa tinta, sin sidebar, un solo
 * bloque de contenido centrado — es una PC de mostrador que se opera
 * con el dedo parado, no un escritorio con mouse. Cada pantalla hija
 * decide su propio contenido, esto solo pone el marco.
 */
export function PantallaKiosco({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-tinta px-6 py-10">
      <Logo variant="blanco" className="mb-10 h-8 w-auto shrink-0" />
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
