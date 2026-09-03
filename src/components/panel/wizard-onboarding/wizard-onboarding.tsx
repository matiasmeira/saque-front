"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BarraProgresoWizard } from "./barra-progreso-wizard";
import { PasoIdentidad } from "./paso-identidad";
import { PasoPoliticas } from "./paso-politicas";
import { useWizardOnboarding } from "@/hooks/api/use-wizard-onboarding";
import { ApiError, mensajeVisible } from "@/lib/api/errores";

export function WizardOnboarding() {
  const router = useRouter();
  const wizard = useWizardOnboarding();

  if (wizard.establecimientoCreado) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-disponible-suave">
          <CheckCircle2 className="size-10 text-disponible" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">¡Tu complejo está creado!</h1>
          <p className="mt-2 text-sm text-grafito">
            {wizard.establecimientoCreado.nombre} ya existe en Saque. Para terminar de configurarlo —horarios,
            canchas, tarifas y cobros— entrá a tu panel: cada sección ya está lista para usar.
          </p>
          {wizard.erroresFotos.length > 0 && (
            <p className="mt-3 text-sm text-pendiente">
              No pudimos subir {wizard.erroresFotos.length === 1 ? "esta foto" : "estas fotos"}:{" "}
              {wizard.erroresFotos.join(", ")}. Podés volver a intentarlo desde Configuración.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/panel/agenda")}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Ir al panel
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  const errorCreacion =
    wizard.errorCreacion instanceof ApiError
      ? mensajeVisible(wizard.errorCreacion)
      : wizard.errorCreacion
        ? "No pudimos crear el complejo. Intentá de nuevo."
        : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-humo p-4 md:p-8">
      <div className="w-full max-w-2xl rounded-card bg-white p-6 shadow-card md:p-10">
        <div className="mb-8">
          <BarraProgresoWizard pasoActual={wizard.pasoActual} />
        </div>

        {wizard.pasoActual === 1 && (
          <PasoIdentidad datosIniciales={wizard.datosIdentidad} onContinuar={wizard.confirmarIdentidad} />
        )}

        {wizard.pasoActual === 2 && (
          <PasoPoliticas
            plan={wizard.plan}
            guardando={wizard.creando}
            error={errorCreacion}
            onAtras={wizard.volverAIdentidad}
            onConfirmar={wizard.confirmarPoliticas}
          />
        )}
      </div>
    </div>
  );
}
