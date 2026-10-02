import { ArrowRight, ChevronDown } from "lucide-react";
import { Proximamente } from "@/components/canche/proximamente";

/**
 * Cada respuesta está contrastada con DECISIONES.md: seña de 10 minutos y
 * confirmación manual, prueba de un mes desde la verificación, plan gratuito
 * con seña obligatoria y mínimo de $500 por cancha, tope de 3 complejos.
 * No se menciona pago online: todavía no existe.
 */
const PREGUNTAS = [
  {
    pregunta: "¿Cuándo se vuelve público mi complejo?",
    respuesta:
      "Cuando nuestro equipo verifica tu solicitud. Hasta entonces tu complejo no aparece en el buscador ni recibe reservas.",
  },
  {
    pregunta: "¿Puedo configurar canchas antes de la verificación?",
    respuesta:
      "Sí. Podés cargar canchas, fotos, horarios y políticas, y revisar una vista previa de cómo se va a ver tu complejo antes de que sea público.",
  },
  {
    pregunta: "¿Cómo funciona la prueba gratuita?",
    respuesta:
      "Arranca cuando verificamos tu complejo, no cuando te registrás, y dura un mes. Durante la prueba la seña es opcional.",
  },
  {
    pregunta: "¿Qué pasa después de la prueba?",
    respuesta:
      "Tu complejo sigue con un plan gratuito, donde la seña es obligatoria, con un mínimo de $500 por cancha. Si alguna cancha tenía una seña menor, pasa a $500, y te avisamos por mail antes de que termine la prueba.",
  },
  {
    pregunta: "¿Cómo se manejan las reservas con seña?",
    respuesta:
      "Cuando un jugador reserva un turno con seña, la reserva queda pendiente 10 minutos. El cobro online de la seña con Mercado Pago llega pronto: hasta entonces, las reservas con seña no se confirman.",
  },
  {
    pregunta: "¿Cuántos complejos puedo tener?",
    respuesta: "Hasta 3 complejos por cuenta de dueño. Deshabilitar un complejo no libera lugar; eliminarlo sí.",
  },
  {
    pregunta: "¿Puedo trabajar con mi equipo en el mostrador?",
    respuesta:
      "Sí, con el Modo Caja: emparejás la PC del mostrador a tu complejo y tus empleados entran con su PIN, con los permisos que le des a cada uno.",
  },
] as const;

export function FaqClubes() {
  return (
    <section className="bg-humo px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl text-tinta sm:text-4xl">Preguntas frecuentes</h2>
        <p className="mt-3 text-lg text-grafito">Lo principal antes de configurar tu complejo.</p>

        <div className="mt-10 flex flex-col gap-3">
          {PREGUNTAS.map((item) => (
            <details key={item.pregunta} className="group overflow-hidden rounded-card border border-borde bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg font-bold text-tinta">{item.pregunta}</span>
                <ChevronDown className="size-5 shrink-0 text-grafito transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-borde px-6 py-4 text-grafito">{item.respuesta}</div>
            </details>
          ))}
        </div>

        <div className="mt-8">
          <Proximamente>
            Ver todas las preguntas frecuentes
            <ArrowRight className="size-4" aria-hidden />
          </Proximamente>
        </div>
      </div>
    </section>
  );
}
