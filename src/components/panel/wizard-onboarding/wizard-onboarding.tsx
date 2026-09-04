"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BarraProgresoWizard } from "./barra-progreso-wizard";
import { PasoIdentidad } from "./paso-identidad";
import { PasoPoliticas } from "./paso-politicas";
import { PasoHorarios } from "./paso-horarios";
import { PasoCanchas } from "./paso-canchas";
import { PasoTarifas } from "./paso-tarifas";
import { PasoCobros } from "./paso-cobros";
import { useWizardOnboarding } from "@/hooks/api/use-wizard-onboarding";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useBloqueadoPorCaja } from "@/lib/permisos";

export function WizardOnboarding() {
  const router = useRouter();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const wizard = useWizardOnboarding();

  if (bloqueadoPorCaja) return <div className="min-h-dvh bg-humo" />;

  if (wizard.publicado) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-disponible-suave">
          <CheckCircle2 className="size-10 text-disponible" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">¡Tu complejo está listo!</h1>
          <p className="mt-2 text-sm text-grafito">
            {wizard.establecimientoParcial?.nombre} ya existe en Saque, con sus horarios, canchas y tarifas
            cargados. Entrá a tu panel para revisar todo o seguir editando cuando quieras.
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
            establecimientoParcial={wizard.establecimientoParcial}
            onAtras={wizard.volverAIdentidad}
            onConfirmar={wizard.confirmarPoliticas}
          />
        )}

        {wizard.pasoActual === 3 && wizard.establecimientoParcial && (
          <PasoHorarios
            horarios={wizard.establecimientoParcial.horariosAtencion}
            guardando={wizard.guardandoHorarios}
            error={wizard.errorHorarios}
            onGuardar={wizard.confirmarHorarios}
          />
        )}

        {wizard.pasoActual === 4 && wizard.establecimientoParcial && (
          <PasoCanchas
            canchas={wizard.canchasPanel}
            canchasCrudas={wizard.canchas}
            requiereSena={wizard.establecimientoParcial.requiereSena}
            montoSenaDefault={wizard.montoSenaDefault}
            bloqueosDeCanchaEnEdicion={wizard.bloqueosDeCanchaEnEdicion}
            guardando={wizard.guardandoCancha}
            desactivando={wizard.desactivandoCanchaId !== null}
            error={wizard.errorCanchas}
            onAbrirEdicion={wizard.abrirEdicionCancha}
            onCrear={wizard.crearCancha}
            onActualizar={wizard.actualizarCancha}
            onDesactivar={wizard.desactivarCancha}
            onAgregarBloqueo={wizard.agregarBloqueo}
            onQuitarBloqueo={wizard.quitarBloqueo}
            onAtras={wizard.volverAHorarios}
            onContinuar={wizard.confirmarCanchas}
          />
        )}

        {wizard.pasoActual === 5 && (
          <PasoTarifas
            canchas={wizard.canchasPanel}
            tarifasPorCancha={wizard.tarifasPorCancha}
            guardando={wizard.guardandoTarifas}
            error={wizard.errorTarifas}
            onCrearTarifa={wizard.crearTarifa}
            onEditarTarifa={wizard.editarTarifa}
            onQuitarTarifa={wizard.quitarTarifa}
            onAtras={wizard.volverACanchas}
            onContinuar={wizard.confirmarTarifas}
          />
        )}

        {wizard.pasoActual === 6 && wizard.establecimientoParcial && (
          <PasoCobros
            requiereSena={wizard.establecimientoParcial.requiereSena}
            estadoMercadoPago={wizard.estadoMercadoPago}
            cargandoEstado={wizard.cargandoEstadoMercadoPago}
            conectando={wizard.conectandoMercadoPago}
            publicando={false}
            error={wizard.errorMercadoPago}
            onConectar={wizard.iniciarConexionMercadoPago}
            onAtras={wizard.volverATarifas}
            onPublicar={wizard.publicarComplejo}
          />
        )}
      </div>
    </div>
  );
}
