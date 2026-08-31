import { HeaderPublico } from "@/components/canche/header-publico";
import { Buscador } from "@/components/canche/buscador";
import { HeroCarousel } from "@/components/canche/hero-carousel";
import { ComoFunciona } from "@/components/canche/como-funciona";
import { PreguntasFrecuentes } from "@/components/canche/preguntas-frecuentes";
import { CtaFinal } from "@/components/canche/cta-final";
import { FooterPublico } from "@/components/canche/footer-publico";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative overflow-hidden bg-tinta">
        <HeroCarousel />
        {/* Lavado tinta sobre las fotos: mantiene el contraste del texto
            blanco y la identidad de marca sin depender de qué foto rote. */}
        <div className="absolute inset-0 bg-tinta/75" />
        <HeaderPublico variant="oscuro" />
        {/* pointer-events-none: es puro texto decorativo, sin nada clickeable
            adentro. Sin esto, este div (mismo z-10 que el header, y después
            en el DOM) tapa el menú de usuario y le come los clicks/hover. */}
        <div className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-6 text-center pointer-events-none sm:px-8 sm:pb-32 sm:pt-10">
          <h1 className="text-[clamp(2.75rem,7vw,4.5rem)] font-display font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
            Tu próximo partido empieza acá
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-[#9DB6D6] sm:text-lg">
            Encontrá y reservá al instante la cancha ideal para tu equipo. Rápido, fácil y sin vueltas.
          </p>
        </div>

        {/* Fundido hacia el color de fondo de la página: sin esto, la foto
            corta en seco contra el humo y se nota la costura. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-humo to-transparent sm:h-32" />
      </div>

      <Buscador />

      <ComoFunciona />
      <PreguntasFrecuentes />
      <CtaFinal />

      <FooterPublico />
    </div>
  );
}
