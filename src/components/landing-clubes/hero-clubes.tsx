import Link from "next/link";
import { HeaderPublico } from "@/components/canche/header-publico";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";
import { MockupAgenda } from "@/components/landing-clubes/mockup-agenda";

export function HeroClubes() {
  return (
    <div className="relative overflow-hidden bg-tinta">
      <LineasDeCancha className="opacity-[0.16]" />
      <HeaderPublico variant="oscuro" ancho="7xl" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-10">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-celeste">Software para clubes</p>
          <h1 className="mt-3 text-[clamp(2.5rem,7vw,3.5rem)] leading-[0.95] text-white">Tu club, ordenado para jugar más</h1>
          <p className="mt-5 max-w-lg text-base text-[#9DB6D6] sm:text-lg">
            Reservas, canchas, caja y equipo en un solo lugar, pensado para complejos deportivos.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/registro/dueno"
              className="inline-flex h-12 items-center justify-center rounded-full bg-azul px-6 font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro"
            >
              Crear cuenta para mi club
            </Link>
            <a
              href="#como-empezar"
              className="inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-white/60 px-6 font-display text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-6 text-sm text-[#9DB6D6]/80">
            Configurá tu complejo, solicitá su verificación y empezá a recibir reservas.
          </p>
        </div>

        <div className="lg:col-span-7">
          <MockupAgenda />
        </div>
      </div>
    </div>
  );
}
