import Link from "next/link";
import { LogoMarca } from "@/components/canche/logo";

/**
 * Footer de zona A y B. Comparte fondo tinta con el hero de A1,
 * así el sitio abre y cierra con la misma marca — no son dos
 * sistemas de color distintos conviviendo en una sola pantalla.
 */
export function FooterPublico({ ancho = "5xl" }: { ancho?: "5xl" | "7xl" }) {
  const maxWidth = ancho === "7xl" ? "max-w-7xl" : "max-w-5xl";

  return (
    <footer className="bg-tinta">
      <div
        className={`mx-auto flex ${maxWidth} flex-col items-center gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8`}
      >
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <LogoMarca className="h-14 w-auto" />
          <p className="text-sm text-[#9DB6D6]">
            © {new Date().getFullYear()} canche.ar. Todos los derechos reservados.
          </p>
        </div>

        <nav className="flex gap-6 text-sm">
          <Link href="/privacidad" className="text-[#9DB6D6] transition-colors hover:text-white">
            Privacidad
          </Link>
          <Link href="/terminos" className="text-[#9DB6D6] transition-colors hover:text-white">
            Términos
          </Link>
          <Link href="/contacto" className="text-[#9DB6D6] transition-colors hover:text-white">
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  );
}
