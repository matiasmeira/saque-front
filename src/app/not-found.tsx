import Link from "next/link";
import { HeaderPublico } from "@/components/canche/header-publico";
import { FooterPublico } from "@/components/canche/footer-publico";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";
import { Isotipo } from "@/components/canche/logo";

/**
 * 404 de toda la app (Next la muestra sola con cualquier ruta que no
 * matchee). Con identidad de marca — las líneas de cancha de fondo,
 * bien tenues, no un 404 genérico — pero reutilizando header/footer
 * como cualquier otra pantalla pública.
 */
export default function NoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-20 text-center">
        <LineasDeCancha className="opacity-[0.05]" />

        <span className="flex size-16 items-center justify-center rounded-full bg-tinta">
          <Isotipo variant="blanco" className="size-7" />
        </span>
        <h1 className="mt-5 max-w-xs font-display text-2xl font-bold text-tinta">No encontramos esta página</h1>
        <p className="mt-2 max-w-xs text-grafito">
          Parece que te fuiste al lateral. Volvé a la cancha para seguir buscando tu turno.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/buscar"
            className="flex h-12 items-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Buscar canchas
          </Link>
          <Link
            href="/"
            className="flex h-12 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      <FooterPublico />
    </div>
  );
}
