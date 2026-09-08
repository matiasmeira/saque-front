"use client";

import { useState, type FormEvent } from "react";

import { ModalPanel } from "@/components/panel/modal-panel";
import { useEditarClienteTurnoFijo } from "@/hooks/api/use-turnos-fijos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { TurnoFijoListadoResponse } from "@/lib/api/tipos/turnos-fijos";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";
const etiquetaClase = "mb-1 block text-xs font-semibold text-grafito";

/**
 * Edita nombre y teléfono del cliente de mostrador de una serie
 * (PATCH /turnos-fijos/{id}/cliente).
 *
 * Sólo tiene sentido cuando la serie no está atada a un jugador (`jugadorId === null`):
 * si lo está, el nombre sale de su cuenta y el backend responde 400. La pantalla que
 * abre este diálogo (page.tsx) ya filtra por eso, así que acá se asume que
 * `nombreClienteManual` es la fuente editable.
 */
export function DialogoEditarClienteTurnoFijo({
  turnoFijo,
  onClose,
}: {
  turnoFijo: TurnoFijoListadoResponse;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(turnoFijo.nombreClienteManual ?? "");
  const [telefono, setTelefono] = useState(turnoFijo.telefonoClienteManual ?? "");
  const editar = useEditarClienteTurnoFijo();

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    editar.mutate(
      { id: turnoFijo.id, nombre: nombre.trim(), telefono: telefono.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <ModalPanel titulo="Editar cliente" subtitulo={turnoFijo.canchaNombre} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label htmlFor="editar-cliente-nombre" className={etiquetaClase}>
            Nombre
          </label>
          <input
            id="editar-cliente-nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campoClase}
          />
        </div>

        <div>
          <label htmlFor="editar-cliente-telefono" className={etiquetaClase}>
            Teléfono
          </label>
          <input
            id="editar-cliente-telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="11 5555-4444"
            className={campoClase}
          />
        </div>

        {editar.isError && (
          <p role="alert" className="text-sm text-cancelado">
            {editar.error instanceof ApiError ? mensajeVisible(editar.error) : "No pudimos guardar los cambios."}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!nombre.trim() || editar.isPending}
            className="h-11 flex-1 rounded-full bg-azul text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
          >
            {editar.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </ModalPanel>
  );
}
