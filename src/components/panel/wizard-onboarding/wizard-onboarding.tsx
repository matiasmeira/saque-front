"use client";

import { useEffect, useState } from "react";
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
import { useEstablecimientoActivo, usePerfil } from "@/hooks/api/use-perfil";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useBloqueadoPorCaja } from "@/lib/permisos";

export function WizardOnboarding() {
  const router = useRouter();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const { data: perfil } = usePerfil();
  const { establecimientoId, cargando: cargandoEstablecimiento } = useEstablecimientoActivo();
  const wizard = useWizardOnboarding();

  /**
   * Esta ruta no tiene guard propio: sólo se llega acá por el redirect de
   * /panel/agenda para un OWNER sin establecimiento (agenda/page.tsx), pero
   * eso no protege contra entrar directo por URL o por un F5 a mitad del
   * wizard (pasos 3-6), donde el establecimiento YA se creó en el paso 2.
   * Sin este guard, recargar ahí vuelve a mostrar el wizard desde el paso 1
   * y, al completarlo, crea un SEGUNDO establecimiento real.
   *
   * Se captura `yaTeniaEstablecimiento` una única vez, la primera vez que
   * `useEstablecimientoActivo` termina de cargar — nunca más después de esa
   * captura. Es necesario: el propio wizard siembra esa misma query
   * (`keys.establecimientos.mios()`) al crear el establecimiento en el paso
   * 2 (ver use-wizard-onboarding.ts), así que si el chequeo fuera reactivo
   * en vez de una foto única al montar, expulsaría al dueño a mitad de los
   * pasos 3-6 que todavía le quedan por completar.
   */
  const [yaTeniaEstablecimiento, setYaTeniaEstablecimiento] = useState<boolean | null>(null);
  useEffect(() => {
    if (cargandoEstablecimiento || yaTeniaEstablecimiento !== null) return;
    setYaTeniaEstablecimiento(establecimientoId !== null);
  }, [cargandoEstablecimiento, establecimientoId, yaTeniaEstablecimiento]);

  const debeRedirigir = perfil?.rol === "OWNER" && yaTeniaEstablecimiento === true;

  useEffect(() => {
    if (debeRedirigir) router.replace("/panel/agenda");
  }, [debeRedirigir, router]);

  if (bloqueadoPorCaja) return <div className="min-h-dvh bg-humo" />;

  // Mientras se resuelve si ya tenía establecimiento, o mientras se redirige
  // por tenerlo, no se muestra el wizard — evita el flash del paso 1.
  if (cargandoEstablecimiento || yaTeniaEstablecimiento === null || debeRedirigir) {
    return <div className="min-h-dvh bg-humo" />;
  }

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
