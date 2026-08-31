import Link from "next/link";
import { LogoMarca } from "@/components/canche/logo";

const ENLACE_CLASE =
  "text-[#9DB6D6] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-[#071730] rounded-sm";

const NAVEGACION = [
  { href: "/buscar", label: "Buscar canchas" },
  { href: "/#como-funciona", label: "Cómo funciona" },
];

const SOPORTE = [
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
];

/**
 * Footer de zona A y B. Un tono más oscuro que el tinta del hero/CTA
 * de arriba: la diferencia sutil de fondo es la que separa "cierre de
 * página" de "sección de contenido" sin necesitar un borde duro.
 */
export function FooterPublico({ ancho = "5xl" }: { ancho?: "5xl" | "7xl" }) {
  const maxWidth = ancho === "7xl" ? "max-w-7xl" : "max-w-5xl";

  return (
    <footer className="bg-[#071730]">
      <div className={`mx-auto ${maxWidth} px-5 py-12 sm:px-8`}>
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3 sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <LogoMarca className="h-11 w-auto" />
            <p className="text-sm text-[#9DB6D6]">Armá el grupo. Nosotros ponemos la cancha.</p>
          </div>

          <nav aria-label="Navegación" className="flex flex-col items-center gap-3 text-sm sm:items-start">
            {NAVEGACION.map((item) => (
              <Link key={item.href} href={item.href} className={ENLACE_CLASE}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Soporte y legal" className="flex flex-col items-center gap-3 text-sm sm:items-start">
            {SOPORTE.map((item) => (
              <Link key={item.href} href={item.href} className={ENLACE_CLASE}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-[#9DB6D6]">© 2026 canche.ar. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
