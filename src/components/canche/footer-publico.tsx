import Link from "next/link";
import { LogoMarca } from "@/components/canche/logo";

const ENLACE_CLASE =
  "text-[#9DB6D6] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-[#071730] rounded-sm";

const ICONO_CLASE = "size-[18px]";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <circle cx={12} cy={12} r={4} />
      <circle cx={17.5} cy={6.5} r={0.6} fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15 3h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3a9 9 0 0 0-7.8 13.4L3 21l4.7-1.2A9 9 0 1 0 12 3z" />
      <path d="M8.5 8.8c.3-.7 1-1.3 1.7-1.1.4.1.9 1.3 1 1.7.1.3 0 .6-.2.9l-.5.6c-.1.2-.1.4 0 .6.4.9 1.9 2.4 2.8 2.8.2.1.4.1.6 0l.6-.5c.3-.2.6-.3.9-.2.4.1 1.6.6 1.7 1 .2.7-.4 1.4-1.1 1.7-1 .4-2.3.2-4-.7-1.4-.7-2.6-1.9-3.3-3.3-.9-1.7-1.1-3-.7-4z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-2.5-3.36" />
      <path d="M14 3c.6 2.4 2.6 4.2 5 4.4" />
    </svg>
  );
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <line x1={7} y1={10} x2={7} y2={17} />
      <circle cx={7} cy={6.5} r={0.6} fill="currentColor" stroke="none" />
      <path d="M11 17v-4a2.5 2.5 0 0 1 5 0v4" />
      <line x1={11} y1={10} x2={11} y2={17} />
    </svg>
  );
}

/**
 * Links a "#": todavía no hay cuentas creadas para canche.ar.
 * Reemplazar por las URLs reales apenas existan.
 */
const REDES = [
  { nombre: "Instagram", href: "#", Icono: IconInstagram },
  { nombre: "Facebook", href: "#", Icono: IconFacebook },
  { nombre: "WhatsApp", href: "#", Icono: IconWhatsApp },
  { nombre: "TikTok", href: "#", Icono: IconTikTok },
  { nombre: "LinkedIn", href: "#", Icono: IconLinkedin },
] as const;

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

            <div className="mt-1 flex items-center gap-1.5">
              {REDES.map(({ nombre, href, Icono }) => (
                <Link
                  key={nombre}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={nombre}
                  className="flex size-9 items-center justify-center rounded-full text-[#9DB6D6] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:ring-offset-[#071730]"
                >
                  <Icono className={ICONO_CLASE} />
                </Link>
              ))}
            </div>
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

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="text-sm text-[#9DB6D6]">© 2026 canche.ar. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
