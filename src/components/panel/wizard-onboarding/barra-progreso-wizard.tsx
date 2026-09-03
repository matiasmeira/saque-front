import { Check } from "lucide-react";

const PASOS = ["Identidad", "Políticas", "Horarios", "Canchas", "Tarifas", "Cobros"];

/**
 * Barra de progreso única del wizard: reemplaza las 4 variantes distintas
 * que traía cada pantalla de Stitch (con/sin etiquetas, 4 vs. 6 puntos,
 * texto "Paso X de Y" presente o no). Los puntos "perforan" el track de
 * fondo con `bg-white`, porque este componente siempre vive dentro de la
 * card blanca del wizard (ver WizardOnboarding, Task 6).
 */
export function BarraProgresoWizard({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="w-full">
      <p className="mb-4 text-center text-xs font-semibold text-grafito">
        Paso {pasoActual} de {PASOS.length}
      </p>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-borde" aria-hidden />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-azul transition-all duration-500"
          style={{ width: `${(Math.max(pasoActual - 1, 0) / (PASOS.length - 1)) * 100}%` }}
          aria-hidden
        />
        {PASOS.map((etiqueta, indice) => {
          const numero = indice + 1;
          const completado = numero < pasoActual;
          const activo = numero === pasoActual;
          return (
            <div key={etiqueta} className="relative z-10 flex flex-col items-center gap-2 bg-white px-1">
              <div
                className={`flex size-6 items-center justify-center rounded-full font-display text-xs font-bold ${
                  completado || activo ? "bg-azul text-white" : "border-2 border-borde bg-white text-grafito"
                }`}
              >
                {completado ? <Check className="size-3.5" aria-hidden /> : numero}
              </div>
              <span className={`hidden text-xs font-semibold sm:block ${activo ? "text-azul" : "text-grafito"}`}>
                {etiqueta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
