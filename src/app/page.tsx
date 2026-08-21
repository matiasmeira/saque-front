import { HeaderPublico } from "@/components/saque/header-publico";
import { Buscador } from "@/components/saque/buscador";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { FooterPublico } from "@/components/saque/footer-publico";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="relative overflow-hidden bg-tinta">
        <HeaderPublico variant="oscuro" />
        <LineasDeCancha className="opacity-[0.16]" />
        {/* pointer-events-none: es puro texto decorativo, sin nada clickeable
            adentro. Sin esto, este div (mismo z-10 que el header, y después
            en el DOM) tapa el menú de usuario y le come los clicks/hover. */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-6 pointer-events-none sm:px-8 sm:pb-28 sm:pt-10">
          <h1 className="text-[clamp(2.75rem,7vw,4.5rem)] font-display font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
            <span className="block">Reservá tu cancha</span>
            <span className="block">en 30 segundos</span>
          </h1>
        </div>
      </div>

      <Buscador />

      <div className="border-t border-borde px-5 py-8 sm:px-8">
        <p className="mx-auto max-w-5xl text-sm text-grafito">
          Sin llamadas ni WhatsApp. Elegís el horario y pagás la seña en el momento.
        </p>
      </div>

      <FooterPublico />
    </div>
  );
}
