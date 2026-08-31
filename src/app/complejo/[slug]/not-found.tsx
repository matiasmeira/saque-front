import Link from "next/link";
import { SearchX } from "lucide-react";
import { HeaderPublico } from "@/components/canche/header-publico";
import { FooterPublico } from "@/components/canche/footer-publico";

/**
 * Estado de error de A3: complejo inexistente o slug viejo. Next
 * muestra esto solo cuando llamamos notFound() en page.tsx.
 */
export default function ComplejoNoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" ancho="7xl" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <SearchX className="size-10 text-grafito" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-bold text-tinta">No encontramos ese complejo</h1>
        <p className="mt-2 max-w-md text-grafito">
          Puede que el enlace esté vencido o que el complejo haya cambiado de nombre. Probá buscar de nuevo.
        </p>
        <Link
          href="/buscar"
          className="mt-6 flex h-12 items-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Buscar canchas
        </Link>
      </main>

      <FooterPublico ancho="7xl" />
    </div>
  );
}
