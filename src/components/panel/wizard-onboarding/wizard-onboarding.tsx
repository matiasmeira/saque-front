"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { BarraProgresoWizard } from "./barra-progreso-wizard";
import { PasoIdentidad } from "./paso-identidad";
import { PasoPoliticas } from "./paso-politicas";
import { PasoHorarios } from "./paso-horarios";
import { PasoCanchas } from "./paso-canchas";
import { PasoTarifas } from "./paso-tarifas";
import { PasoVerificacion } from "./paso-verificacion";
import { useWizardOnboarding } from "@/hooks/api/use-wizard-onboarding";
import { useEstablecimientoActivo, usePerfil } from "@/hooks/api/use-perfil";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import {
  debeRedirigirGuardWizard,
  esComplejoAdicional,
  MENSAJE_LIMITE_ESTABLECIMIENTOS,
  pasosDelWizard,
  puedeCrearOtroComplejo,
  RUTA_WIZARD,
  textoCierreEnRevision,
  textoCierrePendiente,
} from "@/lib/panel/nuevo-complejo";

export function WizardOnboarding() {
  const router = useRouter();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const { data: perfil } = usePerfil();
  const { establecimientoId, misEstablecimientos, cargando: cargandoEstablecimiento } = useEstablecimientoActivo();
  const esNuevoEnUrl = useSearchParams().get("nuevo") === "1";
  // Al crear el complejo en el paso 2 se saca `?nuevo=1` de la URL: un F5
  // posterior manda a la agenda (como con el primer complejo) en vez de
  // arrancar otro wizard y duplicar el complejo. Por eso `esNuevo` también se
  // captura en la foto de abajo y no se lee en vivo.
  const wizard = useWizardOnboarding({ onComplejoCreado: () => router.replace(RUTA_WIZARD) });

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
   *
   * La misma foto guarda si se entró con `nuevo=1` (intención explícita de
   * crear un complejo adicional: el guard no redirige) y cuántos complejos
   * había, para el aviso del límite (en vivo pasaría a 3 al crear el nuevo).
   */
  const [entrada, setEntrada] = useState<{ yaTenia: boolean; esNuevo: boolean; cantidad: number } | null>(null);
  if (!cargandoEstablecimiento && entrada === null) {
    setEntrada({
      yaTenia: establecimientoId !== null,
      esNuevo: esNuevoEnUrl,
      cantidad: misEstablecimientos.length,
    });
  }

  const debeRedirigir =
    entrada !== null &&
    debeRedirigirGuardWizard({
      rol: perfil?.rol,
      yaTeniaEstablecimiento: entrada.yaTenia,
      esNuevo: entrada.esNuevo,
    });

  useEffect(() => {
    if (debeRedirigir) router.replace("/panel/agenda");
  }, [debeRedirigir, router]);

  if (bloqueadoPorCaja) return <div className="min-h-dvh bg-humo" />;

  // Mientras se resuelve si ya tenía establecimiento, o mientras se redirige
  // por tenerlo, no se muestra el wizard — evita el flash del paso 1.
  if (cargandoEstablecimiento || entrada === null || debeRedirigir) {
    return <div className="min-h-dvh bg-humo" />;
  }

  const complejoAdicional = esComplejoAdicional({ esNuevo: entrada.esNuevo, yaTeniaEstablecimiento: entrada.yaTenia });
  const rol = perfil?.rol;
  const pasos = pasosDelWizard(rol);

  // Defensa: entrar a /panel/bienvenida?nuevo=1 con el límite alcanzado.
  if (complejoAdicional && !puedeCrearOtroComplejo(entrada.cantidad)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="size-8 text-cancelado" aria-hidden />
        <p className="font-semibold text-tinta">{MENSAJE_LIMITE_ESTABLECIMIENTOS}</p>
        <p className="text-sm text-grafito">
          Para crear uno nuevo, eliminá alguno existente — deshabilitarlo no libera cupo. Se elimina desde la Zona de
          riesgo, en Configuración de ese complejo.
        </p>
        <Link href="/panel/agenda" className="text-sm font-semibold text-azul hover:underline">
          Volver al panel
        </Link>
      </div>
    );
  }

  if (wizard.publicado) {
    // El dueño pudo haber enviado la verificación (EN_REVISION) u omitirla
    // (sigue PENDIENTE), y un ADMIN nunca la envía (termina en el paso 5): el
    // cierre tiene que decir la verdad en todos los casos, no "¡tu complejo
    // está listo!" — sin verificar no aparece en el buscador ni recibe reservas.
    const enRevision = wizard.establecimientoParcial?.estadoVerificacion === "EN_REVISION";
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-disponible-suave">
          <CheckCircle2 className="size-10 text-disponible" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">
            {enRevision ? "Enviaste tu complejo a revisión" : "Tu complejo ya está armado"}
          </h1>
          <p className="mt-2 text-sm text-grafito">
            {wizard.establecimientoParcial?.nombre} tiene sus horarios, canchas y tarifas cargados.{" "}
            {enRevision ? textoCierreEnRevision(complejoAdicional) : textoCierrePendiente(rol)}
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
        {complejoAdicional && (
          <div className="mb-6 text-sm">
            <Link href="/panel/agenda" className="font-semibold text-azul hover:underline">
              Volver al panel
            </Link>
            {wizard.establecimientoParcial && (
              <p className="mt-1 text-grafito">
                El complejo quedó creado a medias, lo podés terminar desde Configuración.
              </p>
            )}
          </div>
        )}

        <div className="mb-8">
          <BarraProgresoWizard pasoActual={wizard.pasoActual} pasos={pasos} />
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
            cambiandoEstadoCanchaId={wizard.cambiandoEstadoCanchaId}
            error={wizard.errorCanchas}
            onAbrirEdicion={wizard.abrirEdicionCancha}
            onCrear={wizard.crearCancha}
            onActualizar={wizard.actualizarCancha}
            onDesactivar={wizard.desactivarCancha}
            onReactivar={wizard.reactivarCancha}
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
          <PasoVerificacion
            complejoAdicional={complejoAdicional}
            requiereSena={wizard.establecimientoParcial.requiereSena}
            solicitandoVerificacion={wizard.solicitandoVerificacion}
            errorVerificacion={wizard.errorVerificacion}
            camposInvalidosVerificacion={wizard.camposInvalidosVerificacion}
            onAtras={wizard.volverATarifas}
            onSolicitarVerificacion={wizard.confirmarVerificacion}
            onOmitirVerificacion={wizard.omitirVerificacion}
            onLimpiarErrorVerificacion={wizard.limpiarErrorVerificacion}
          />
        )}
      </div>
    </div>
  );
}
