import { CheckCircle2, MousePointerClick, Search } from "lucide-react";

const PASOS = [
  {
    numero: "01",
    titulo: "Buscá",
    descripcion:
      "Elegí deporte, zona y fecha. Te mostramos qué hay libre en tiempo real para que no pierdas tiempo.",
    icon: Search,
    destacado: false,
  },
  {
    numero: "02",
    titulo: "Elegí",
    descripcion:
      "Revisá las instalaciones, precios y elegí tu horario ideal. Toda la info que necesitás en un solo lugar.",
    icon: MousePointerClick,
    destacado: false,
  },
  {
    numero: "03",
    titulo: "Reservá",
    descripcion: "Asegurá tu lugar con unos clics y pagá la seña en el complejo. Todo listo para jugar.",
    icon: CheckCircle2,
    destacado: true,
  },
] as const;

/**
 * "Cómo funciona" de la home. Server component, sin estado ni datos:
 * los tres pasos son copy fijo, no algo que dependa del backend.
 */
export function ComoFunciona() {
  return (
    <section id="como-funciona" className="border-t border-borde bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl text-tinta sm:text-4xl">Reservar nunca fue tan fácil</h2>

        <div className="mt-12 flex flex-col gap-6">
          {PASOS.map((paso, indice) => (
            <div
              key={paso.numero}
              className={`flex flex-col items-center gap-6 rounded-card border border-borde bg-humo p-8 sm:gap-8 sm:p-10 md:flex-row ${
                indice % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-extrabold sm:size-20 sm:text-2xl ${
                  paso.destacado ? "bg-azul text-white" : "bg-tinta text-white"
                }`}
              >
                {paso.numero}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl">{paso.titulo}</h3>
                <p className="mt-2 text-grafito">{paso.descripcion}</p>
              </div>
              <paso.icon className="hidden size-10 shrink-0 text-azul md:block" aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
