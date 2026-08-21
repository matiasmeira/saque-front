"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { ModalPanel } from "@/components/panel/modal-panel";
import { FormDatosComplejo, type DatosEstablecimiento } from "@/components/panel/form-datos-complejo";
import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";

/** Mismo tope que EstablecimientoService.LIMITE_ESTABLECIMIENTOS_ACTIVOS en el backend. */
const LIMITE_ESTABLECIMIENTOS_ACTIVOS = 3;
const MENSAJE_LIMITE = "Ya alcanzaste el máximo de 3 establecimientos activos.";

/**
 * Modal para dar de alta un complejo nuevo. Manda `horariosAtencion: []` y
 * `servicios: []`: el complejo nace sin nada de eso cargado, y se completa
 * después desde Configuración (misma pantalla que ya edita un complejo
 * existente sección por sección).
 *
 * Un complejo sin horarios queda invisible en /buscar apenas alguien pide
 * fecha/hora (ComplejoPublicoService.estaAbiertoEnVentana lo excluye para
 * cualquier día de la semana): el subtítulo se lo advierte al dueño acá
 * mismo, y HeaderPanel repite el aviso en todo el panel hasta que los carga.
 *
 * Si ya se llegó al límite de 3, no se muestra el formulario: el chequeo del
 * backend (fuente de verdad) igual corre si de algún modo se manda el POST,
 * pero acá se evita el viaje de ida y vuelta la mayoría de las veces.
 */
export function ModalCrearEstablecimiento({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const { misEstablecimientos, seleccionarEstablecimiento } = useEstablecimientoActivo();

  const crear = useMutation({
    mutationFn: (datos: DatosEstablecimiento) =>
      endpointEstablecimientos.crear({ ...datos, horariosAtencion: [], servicios: [] }),
    onSuccess: (nuevo) => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
      seleccionarEstablecimiento(nuevo.id);
      onClose();
    },
  });

  const limiteAlcanzado = misEstablecimientos.length >= LIMITE_ESTABLECIMIENTOS_ACTIVOS;

  return (
    <ModalPanel
      titulo="Nuevo complejo"
      subtitulo={
        limiteAlcanzado
          ? undefined
          : "Después le cargás horarios y servicios desde Configuración — hasta que cargues horarios, no vas a aparecer en las búsquedas"
      }
      onClose={onClose}
    >
      {limiteAlcanzado ? (
        <div className="flex flex-col items-center gap-3 rounded-input bg-humo p-5 text-center">
          <AlertTriangle className="size-6 text-cancelado" aria-hidden />
          <p className="text-sm font-semibold text-tinta">{MENSAJE_LIMITE}</p>
          <p className="text-xs text-grafito">Para dar de alta uno nuevo, primero tenés que dar de baja alguno existente.</p>
        </div>
      ) : (
        <>
          <FormDatosComplejo plan={perfil?.planSuscripcion} guardando={crear.isPending} onGuardar={(datos) => crear.mutate(datos)} />
          {crear.isError && (
            <p role="alert" className="mt-3 text-sm text-cancelado">
              {crear.error instanceof ApiError ? mensajeVisible(crear.error) : "No pudimos crear el complejo."}
            </p>
          )}
        </>
      )}
    </ModalPanel>
  );
}
