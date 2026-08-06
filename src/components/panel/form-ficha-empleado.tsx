"use client";

import { useState, type FormEvent } from "react";
import { PERMISOS, type Empleado, type Permiso } from "@/mocks/empleados";

export type DatosEmpleado = { nombre: string; contrasena?: string; pin?: string; permisos: Permiso[] };

const PIN_VALIDO = /^\d{4}$/;

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Alta y edición comparten el mismo form (mismo patrón que
 * FormCancha). La contraseña solo se pide al dar de alta — nunca se
 * vuelve a mostrar ni a pedir en la edición, porque el backend real
 * no la devuelve así (ver TODO en mocks/empleados.ts); acá solo se
 * tocan los permisos de alguien que ya existe.
 */
export function FormFichaEmpleado({
  empleado,
  onGuardar,
  onCancelar,
}: {
  /** null = alta de un empleado nuevo */
  empleado: Empleado | null;
  onGuardar: (datos: DatosEmpleado) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(empleado?.nombre ?? "");
  const [contrasena, setContrasena] = useState("");
  const [pin, setPin] = useState("");
  const [permisos, setPermisos] = useState<Permiso[]>(empleado?.permisos ?? []);
  const [error, setError] = useState<string | null>(null);

  function alternarPermiso(permiso: Permiso) {
    setPermisos((prev) => (prev.includes(permiso) ? prev.filter((p) => p !== permiso) : [...prev, permiso]));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre.");
    if (!empleado && contrasena.trim().length < 6) return setError("La contraseña inicial tiene que tener al menos 6 caracteres.");
    if (!empleado && !PIN_VALIDO.test(pin)) return setError("El PIN de caja tiene que ser de 4 dígitos.");
    setError(null);
    onGuardar({ nombre: nombre.trim(), contrasena: empleado ? undefined : contrasena.trim(), pin: empleado ? undefined : pin, permisos });
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <label htmlFor="empleado-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre
        </label>
        <input id="empleado-nombre" required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
      </div>

      {!empleado && (
        <div>
          <label htmlFor="empleado-contrasena" className="mb-1 block text-xs font-semibold text-grafito">
            Contraseña inicial
          </label>
          <input
            id="empleado-contrasena"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={campoClase}
          />
          <p className="mt-1 text-xs text-grafito">
            Entra al panel con su nombre y esta contraseña — pasásela vos, y puede cambiarla después.
          </p>
        </div>
      )}

      {!empleado && (
        <div>
          <label htmlFor="empleado-pin" className="mb-1 block text-xs font-semibold text-grafito">
            PIN de caja (4 dígitos)
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
          <p className="mt-1 text-xs text-grafito">Para entrar al kiosco de caja (/caja) tocando su nombre — independiente de la contraseña de arriba.</p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Permisos</p>
        <div className="space-y-1.5">
          {PERMISOS.map((p) => (
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
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
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
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
