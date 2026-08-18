"use client";

import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { NOTA_ALCANCE, PERMISOS_EMPLEADO } from "@/lib/permisos-empleado";
import type { PermisoEmpleado } from "@/lib/api/tipos/comunes";
import type { EmpleadoResponse } from "@/lib/api/tipos/empleados";

export type DatosEmpleado = { nombre: string; pin: string; permisos: PermisoEmpleado[] };

const PIN_VALIDO = /^\d{4}$/;

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Alta de un empleado, o edición de sus permisos.
 *
 * Un empleado no tiene cuenta ni contraseña: es un `Usuario` con rol EMPLOYEE,
 * email sintético generado por el backend, y una sola credencial de 4 dígitos.
 * El campo "contraseña inicial" que había acá no existía en `EmpleadoRequest` —
 * se tipeaba y no viajaba a ningún lado.
 *
 * En modo edición sólo se tocan los permisos: el nombre no tiene endpoint para
 * cambiarse (y es con lo que la persona se loguea en el mostrador), y el PIN va
 * por su propio endpoint, desde su propio formulario.
 */
export function FormFichaEmpleado({
  empleado,
  guardando,
  error,
  onGuardar,
  onCancelar,
}: {
  /** null = alta de un empleado nuevo. */
  empleado: EmpleadoResponse | null;
  guardando: boolean;
  /** Mensaje del backend — nombre repetido, PIN demasiado común. */
  error: string | null;
  onGuardar: (datos: DatosEmpleado) => void;
  onCancelar: () => void;
}) {
  const esAlta = empleado === null;
  const [nombre, setNombre] = useState(empleado?.nombre ?? "");
  const [pin, setPin] = useState("");
  const [permisos, setPermisos] = useState<PermisoEmpleado[]>(empleado?.permisos ?? []);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  function alternarPermiso(permiso: PermisoEmpleado) {
    setPermisos((prev) => (prev.includes(permiso) ? prev.filter((p) => p !== permiso) : [...prev, permiso]));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (esAlta) {
      if (!nombre.trim()) return setErrorLocal("Falta el nombre.");
      if (!PIN_VALIDO.test(pin)) return setErrorLocal("El PIN tiene que ser de 4 dígitos.");
    }
    setErrorLocal(null);
    onGuardar({ nombre: nombre.trim(), pin, permisos });
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      {esAlta ? (
        <>
          <div>
            <label htmlFor="empleado-nombre" className="mb-1 block text-xs font-semibold text-grafito">
              Nombre
            </label>
            <input id="empleado-nombre" required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
            <p className="mt-1 text-xs text-grafito">
              Es lo que va a tocar en la pantalla del mostrador para entrar. No se puede cambiar después.
            </p>
          </div>

          <div>
            <label htmlFor="empleado-pin" className="mb-1 block text-xs font-semibold text-grafito">
              PIN (4 dígitos)
            </label>
            <input
              id="empleado-pin"
              required
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              className={campoClase}
            />
            {/* El backend rechaza secuencias y repeticiones obvias (1234, 0000,
                1111...). Vale la pena decirlo antes y no gastar un 400. */}
            <p className="mt-1 text-xs text-grafito">
              Su única credencial: entra al kiosco tocando su nombre y poniendo estos 4 dígitos. Nada de secuencias ni
              repeticiones (1234, 0000): el sistema las rechaza.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-input bg-humo p-3.5">
          <p className="text-sm font-semibold text-tinta">{empleado.nombre}</p>
          <p className="mt-0.5 text-xs text-grafito">
            El nombre no se puede cambiar: es con lo que entra al mostrador. El PIN se cambia desde su propio botón en
            la tabla.
          </p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Permisos</p>
        <div className="space-y-1.5">
          {PERMISOS_EMPLEADO.map((p) => {
            const nota = NOTA_ALCANCE[p.alcance];
            return (
              <label key={p.valor} className="flex items-start gap-2.5 rounded-input bg-humo p-3">
                <input
                  type="checkbox"
                  checked={permisos.includes(p.valor)}
                  onChange={() => alternarPermiso(p.valor)}
                  className="mt-0.5 size-4 shrink-0 rounded border-borde accent-azul"
                />
                <span>
                  <span className="block text-sm font-semibold text-tinta">{p.etiqueta}</span>
                  <span className="block text-xs text-grafito">{p.descripcion}</span>
                  {/* Sin esto, el dueño tilda "Cobrar turnos" y la persona
                      igual no puede: tiene el permiso de la acción pero la
                      pantalla desde donde se hace todavía es solo del dueño. */}
                  {nota && (
                    <span className="mt-1 flex items-start gap-1 text-xs text-pendiente">
                      <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
                      {nota}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {(errorLocal ?? error) && (
        <p className="text-sm text-cancelado" role="alert">
          {errorLocal ?? error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:opacity-60"
        >
          {guardando ? "Guardando..." : esAlta ? "Dar de alta" : "Guardar permisos"}
        </button>
      </div>
    </form>
  );
}
