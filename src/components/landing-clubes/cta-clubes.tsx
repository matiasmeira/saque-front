import { BotonCuentaClub } from "@/components/landing-clubes/boton-cuenta-club";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";
import { Proximamente } from "@/components/canche/proximamente";

export function CtaClubes() {
  return (
    <section className="relative overflow-hidden bg-tinta px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <LineasDeCancha className="opacity-[0.16]" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="text-3xl text-white sm:text-5xl sm:leading-[1.02]">Tu próximo turno puede empezar mejor organizado</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#9DB6D6]">Creá tu cuenta, configurá tu complejo y empezá a recibir reservas.</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <BotonCuentaClub className="inline-flex h-14 w-full items-center justify-center rounded-full bg-azul px-8 font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro sm:w-auto" />
          <Proximamente oscuro>Solicitar una demo</Proximamente>
        </div>
      </div>
    </section>
  );
}
