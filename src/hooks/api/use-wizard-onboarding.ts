"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { usePerfil } from "@/hooks/api/use-perfil";
import type { DatosPasoIdentidad, DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Estado y orquestación del wizard de onboarding (fase 1: identidad +
 * políticas). El establecimiento se crea recién al confirmar el paso 2 — ver
 * la nota de orquestación en el plan de esta tarea.
 */
export function useWizardOnboarding() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();

  const [pasoActual, setPasoActual] = useState<1 | 2>(1);
  const [datosIdentidad, setDatosIdentidad] = useState<DatosPasoIdentidad | null>(null);
  const [establecimientoCreado, setEstablecimientoCreado] = useState<EstablecimientoResponse | null>(null);
  const [erroresFotos, setErroresFotos] = useState<string[]>([]);

  const crear = useMutation<EstablecimientoResponse, ApiError, DatosPasoPoliticas>({
    mutationFn: async (politicas) => {
      if (!datosIdentidad) {
        throw new ApiError({ status: 0, mensaje: "Falta completar el paso 1." });
      }

      const establecimiento = await endpointEstablecimientos.crear({
        nombre: datosIdentidad.nombre,
        direccion: datosIdentidad.direccion,
        latitud: datosIdentidad.latitud,
        longitud: datosIdentidad.longitud,
        requiereSena: politicas.requiereSena,
        requiereTelefonoVerificado: politicas.requiereTelefonoVerificado,
        horariosAtencion: [],
        servicios: datosIdentidad.servicios,
      });

      const fotosFallidas: string[] = [];
      for (const archivo of datosIdentidad.fotos) {
        try {
          await endpointEstablecimientos.subirFoto(establecimiento.id, archivo);
        } catch {
          fotosFallidas.push(archivo.name);
        }
      }
      setErroresFotos(fotosFallidas);

      await endpointEstablecimientos.actualizarPoliticaCancelacion(establecimiento.id, {
        horasCancelacionAntesPartido: politicas.horasCancelacionAntesPartido,
        minutosGraciaCancelacion: politicas.minutosGraciaCancelacion,
      });

      return establecimiento;
    },
    onSuccess: (establecimiento) => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
      setEstablecimientoCreado(establecimiento);
    },
  });

  function confirmarIdentidad(datos: DatosPasoIdentidad) {
    setDatosIdentidad(datos);
    setPasoActual(2);
  }

  function volverAIdentidad() {
    setPasoActual(1);
  }

  function confirmarPoliticas(politicas: DatosPasoPoliticas) {
    crear.mutate(politicas);
  }

  return {
    pasoActual,
    plan: perfil?.planSuscripcion,
    datosIdentidad,
    establecimientoCreado,
    creando: crear.isPending,
    errorCreacion: crear.isError ? crear.error : null,
    erroresFotos,
    confirmarIdentidad,
    volverAIdentidad,
    confirmarPoliticas,
  };
}
