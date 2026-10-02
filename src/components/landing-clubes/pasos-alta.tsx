import { ArrowRight } from "lucide-react";
import { Proximamente } from "@/components/canche/proximamente";

const PASOS = [
  { titulo: "Creá tu cuenta de dueño", texto: "Registrate con tus datos y entrá a tu panel." },
  {
    titulo: "Configurá tu complejo",
    texto: "Cargá los datos del complejo, los horarios, las canchas, las tarifas y las políticas.",
  },
  {
    titulo: "Solicitá la verificación",
    texto: "Completá CUIT, razón social, teléfono y redes, y tocá \"Enviar a revisión\".",
  },
  {
    titulo: "Empezá a recibir reservas",
    texto:
      "Nuestro equipo verifica tu complejo. Cuando queda verificado se publica en el buscador y arranca tu prueba gratuita de un mes.",
  },
] as const;

export function PasosAlta() {
  return (
    <section id="como-empezar" className="scroll-mt-4 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-azul">Empezar con canche</p>
          <h2 className="mt-2 text-3xl text-tinta sm:text-4xl">De tu club al buscador, paso a paso</h2>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => {
            const ultimo = i === PASOS.length - 1;
            return (
              <li key={paso.titulo} className="flex flex-col items-start">
                <span
                  className={`mb-4 flex size-14 items-center justify-center rounded-full font-display text-2xl font-extrabold ${
                    ultimo ? "bg-azul text-white" : "border border-borde bg-humo text-azul"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl text-tinta">{paso.titulo}</h3>
                <p className="mt-2 text-grafito">{paso.texto}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 border-t border-borde pt-8 text-center">
          <Proximamente>
            Conocer el proceso completo
            <ArrowRight className="size-4" aria-hidden />
          </Proximamente>
        </div>
      </div>
    </section>
  );
}
