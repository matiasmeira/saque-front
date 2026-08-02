"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck } from "lucide-react";
import { DEPORTES } from "@/mocks/deportes";
import type { DatosComplejo } from "@/mocks/config";

function chipClase(activo: boolean) {
  return `h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
    activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
  }`;
}

const campoClase = "w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none";

/** Sección 1 de C9: identidad del complejo. El CUIT pasa a solo lectura apenas queda verificado — ya no hay nada que "editar", solo lo que ya confirmó D3. */
export function FormDatosComplejo({ datos, onGuardar }: { datos: DatosComplejo; onGuardar: (datos: DatosComplejo) => void }) {
  const [nombre, setNombre] = useState(datos.nombre);
  const [direccion, setDireccion] = useState(datos.direccion);
  const [telefono, setTelefono] = useState(datos.telefono);
  const [deportes, setDeportes] = useState<string[]>(datos.deportes);
  const [error, setError] = useState<string | null>(null);

  function alternarDeporte(valor: string) {
    setDeportes((prev) => (prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre del complejo.");
    if (!direccion.trim()) return setError("Falta la dirección.");
    if (!telefono.trim()) return setError("Falta el teléfono de contacto.");
    if (deportes.length === 0) return setError("Elegí al menos un deporte.");
    setError(null);
    onGuardar({ ...datos, nombre: nombre.trim(), direccion: direccion.trim(), telefono: telefono.trim(), deportes });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="config-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre del complejo
        </label>
        <input id="config-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="config-direccion" className="mb-1 block text-xs font-semibold text-grafito">
          Dirección
        </label>
        <input id="config-direccion" required value={direccion} onChange={(e) => setDireccion(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="config-telefono" className="mb-1 block text-xs font-semibold text-grafito">
          Teléfono de contacto
        </label>
        <input id="config-telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className={campoClase} />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-grafito">CUIT</p>
        {datos.cuitVerificado ? (
          <div className="flex items-center gap-1.5 rounded-input bg-humo px-3 py-2.5 text-tinta">
            <span>{datos.cuit}</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-disponible">
              <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
              Verificado
            </span>
          </div>
        ) : (
          <p className="rounded-input bg-humo px-3 py-2.5 text-tinta">{datos.cuit}</p>
        )}
        {datos.cuitVerificado && <p className="mt-1 text-xs text-grafito">Ya fue verificado — para corregirlo, contactá a soporte.</p>}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Deportes que ofrece</p>
        <div className="flex flex-wrap gap-1.5">
          {DEPORTES.map((d) => (
            <button
              key={d.valor}
              type="button"
              aria-pressed={deportes.includes(d.valor)}
              onClick={() => alternarDeporte(d.valor)}
              className={chipClase(deportes.includes(d.valor))}
            >
              {d.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex h-10 items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
      >
        Guardar datos
      </button>
    </form>
  );
}
