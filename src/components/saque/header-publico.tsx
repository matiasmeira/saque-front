import Link from "next/link";
import { Isotipo } from "@/components/saque/logo";
import { NavSesion } from "@/components/saque/nav-sesion";

/**
 * Header de zona A y B.
 *
 * El slot derecho (antes "Software para negocios" + "Ingresar" fijos) ahora
 * depende de la sesión: lo resuelve NavSesion (usePerfil()/useHaySesion()).
 */
type HeaderPublicoProps = {
  /** "oscuro" para fondos tinta (ej. el hero de A1), "claro" para el resto */
  variant?: "claro" | "oscuro";
  /** Ancho del contenido. A1/A2 usan 5xl; A3 necesita más aire para la grilla. */
  ancho?: "5xl" | "7xl";
};

export function HeaderPublico({ variant = "claro", ancho = "5xl" }: HeaderPublicoProps) {
  const oscuro = variant === "oscuro";
  const texto = oscuro ? "text-white" : "text-tinta";
  const textoSecundario = oscuro ? "text-[#9DB6D6]" : "text-grafito";
  const maxWidth = ancho === "7xl" ? "max-w-7xl" : "max-w-5xl";

  return (
    <header className="relative z-10">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between px-5 py-5 sm:px-8`}>
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <Isotipo variant={oscuro ? "blanco" : "color"} className="h-7 w-auto" />
          <span
            className={`font-display text-lg font-extrabold tracking-tight ${texto}`}
          >
            saque
          </span>
        </Link>

        <NavSesion texto={texto} textoSecundario={textoSecundario} oscuro={oscuro} />
      </div>
    </header>
  );
}
