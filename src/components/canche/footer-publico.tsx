import Link from "next/link";
import { LogoMarca } from "@/components/canche/logo";
import { Proximamente } from "@/components/canche/proximamente";

const ENLACE_CLASE =
  "text-[#9DB6D6] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-[#071730] rounded-sm";

const NAVEGACION = [
  { href: "/buscar", label: "Buscar canchas" },
  { href: "/software-para-clubes", label: "Software para clubes" },
  { href: "/#como-funciona", label: "Cómo funciona" },
];

/**
 * Todavía no existen las páginas: se muestran como "Próximamente", sin link.
 * Pasarlas a Link con su href cuando se creen (/contacto, /privacidad, /terminos).
 *
 * Redes sociales: se quitó la fila de íconos porque todavía no hay cuentas.
 * Volver a agregarla (con URLs reales) cuando existan.
 */
const SOPORTE = ["Contacto", "Privacidad", "Términos"];

/**
 * Footer de zona A y B. Un tono más oscuro que el tinta del hero/CTA
 * de arriba: la diferencia sutil de fondo es la que separa "cierre de
 * página" de "sección de contenido" sin necesitar un borde duro.
 *
 * Los dos glows difuminados de fondo son puramente decorativos: en
 * pantallas anchas el contenido (centrado, max-w-5xl/7xl) deja mucho
 * fondo plano a los costados, y sin ellos esa zona se ve vacía.
 */
export function FooterPublico({ ancho = "5xl" }: { ancho?: "5xl" | "7xl" }) {
  const maxWidth = ancho === "7xl" ? "max-w-7xl" : "max-w-5xl";

  return (
    <footer className="relative overflow-hidden bg-[#071730]">
      <div className="pointer-events-none absolute -left-32 -top-24 size-80 rounded-full bg-azul/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-celeste/10 blur-3xl" aria-hidden />

      <div className={`relative mx-auto ${maxWidth} px-5 pb-8 pt-12 sm:px-8`}>
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

          <div role="group" aria-label="Soporte y legal" className="flex flex-col items-center gap-3 sm:items-start">
            {SOPORTE.map((label) => (
              <Proximamente key={label} oscuro>
                {label}
              </Proximamente>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-[#9DB6D6]">© 2026 canche.ar. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
