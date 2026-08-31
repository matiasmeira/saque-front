import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";

/**
 * CTA de cierre de la home. Enlaza directo a /buscar sin query params:
 * la página de resultados ya soporta ese caso (ver su docstring) y
 * devuelve todos los complejos ordenados por calificación.
 */
export function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-tinta px-5 py-16 sm:px-8 sm:py-20">
      <LineasDeCancha className="opacity-[0.16]" />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="text-3xl text-white sm:text-4xl">Armá el grupo, nosotros ponemos la cancha</h2>
        <p className="mt-4 text-[#9DB6D6]">No des más vueltas buscando dónde jugar. Encontrá tu turno ahora.</p>
        <Link
          href="/buscar"
          className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-azul px-8 font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Buscar canchas
          <ArrowRight className="size-[18px]" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
