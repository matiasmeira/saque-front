"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatearPrecio } from "@/lib/formato";
import { establecimientos } from "@/lib/api/endpoints/establecimientos";
import { keys } from "@/lib/api/keys";
import type { Cancha } from "@/lib/panel/canchas";

export type DatosTurnoManual = {
  canchaId: number;
  /** Los dos vienen del slot, tal cual los devolvió el backend. */
  fechaHoraInicio: string;
  fechaHoraFin: string;
  nombre: string;
  telefono: string;
  /** Si ya pagó en el mostrador, el backend le asienta la seña de la cancha. */
  senaFisicaRecibida: boolean;
};

/** "2026-08-18T20:00:00" → "20:00" */
const hhmm = (fechaHora: string) => fechaHora.slice(11, 16);

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Carga rápida desde una celda libre (o desde "+ Nuevo turno").
 *
 * Los horarios que ofrece salen de `GET /establecimientos/{id}/disponibilidad`,
 * no de una cuenta local. Antes se calculaban acá con `horariosLibres()` contra
 * un horario de atención fijo (09 a 24, del mock) y los bloqueos del mock: en un
 * complejo que abre a otra hora, o con la cancha bloqueada por mantenimiento, el
 * form ofrecía horarios que el backend iba a rechazar con un 400.
 *
 * El endpoint ya cruza horarios de atención, días no laborables, bloqueos y
 * reservas, y descarta los slots pasados. Y cada slot trae `inicio` y `fin`,
 * que son exactamente los dos campos que pide `ReservaManualRequest`: se pasan
 * tal cual, sin rearmar la fecha-hora ni recalcular el fin con la duración.
 *
 * Tampoco calcula el precio: lo fija el backend y vuelve en
 * `ReservaResponse.precioTotal`. El número que mostraba antes salía de
 * `calcularPrecio()` sobre las tarifas del mock y ni siquiera se enviaba.
 */
export function FormTurnoRapido({
  canchas,
  canchaId,
  fecha,
  horaInicial,
  nombreInicial,
  telefonoInicial,
  establecimientoId,
  guardando,
  onGuardar,
  onCancelar,
}: {
  canchas: Cancha[];
  canchaId: number;
  fecha: string;
  horaInicial?: string;
  /** llega precargado desde la ficha de un cliente (C6) → "Nueva reserva" */
  nombreInicial?: string;
  telefonoInicial?: string;
  establecimientoId: number;
  guardando?: boolean;
  onGuardar: (datos: DatosTurnoManual) => void;
  onCancelar: () => void;
}) {
  const [canchaSel, setCanchaSel] = useState(canchaId);
  const [duracionSel, setDuracionSel] = useState<number | null>(null);
  const [inicioSel, setInicioSel] = useState<string | null>(null);
  const [nombre, setNombre] = useState(nombreInicial ?? "");
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [senaCobrada, setSenaCobrada] = useState(false);

  const cancha = canchas.find((c) => c.id === canchaSel) ?? canchas[0];

  const consulta = useQuery({
    queryKey: keys.disponibilidad(establecimientoId, fecha),
    queryFn: () => establecimientos.disponibilidad(establecimientoId, fecha),
    enabled: establecimientoId > 0,
  });

  const dia = consulta.data?.dias[0];
  const opciones = dia?.canchas.find((c) => c.canchaId === canchaSel)?.opcionesDuracion ?? [];

  // Nada de esto se guarda en estado "corregido": si lo elegido dejó de estar
  // disponible (cambió la cancha, la duración, o alguien reservó mientras
  // tanto), se cae al primero que sí está. Evita un useEffect de reseteo por
  // cada selector.
  const opcion = opciones.find((o) => o.duracionMinutos === duracionSel) ?? opciones[0];
  const slots = opcion?.slotsLibres ?? [];
  const slot =
    slots.find((s) => s.inicio === inicioSel) ??
    (horaInicial ? slots.find((s) => hhmm(s.inicio) === horaInicial) : undefined) ??
    slots[0];

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !slot) return;
    onGuardar({
      canchaId: cancha.id,
      fechaHoraInicio: slot.inicio,
      fechaHoraFin: slot.fin,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      senaFisicaRecibida: senaCobrada && cancha.montoSena > 0,
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="turno-cancha" className="mb-1 block text-xs font-semibold text-grafito">
          Cancha
        </label>
        <select
          id="turno-cancha"
          value={canchaSel}
          onChange={(e) => {
            setCanchaSel(Number(e.target.value));
            setDuracionSel(null);
            setInicioSel(null);
          }}
          className={campoClase}
        >
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {opciones.length > 1 && (
        <div>
          <label htmlFor="turno-duracion" className="mb-1 block text-xs font-semibold text-grafito">
            Duración
          </label>
          <select
            id="turno-duracion"
            value={opcion?.duracionMinutos ?? ""}
            onChange={(e) => {
              setDuracionSel(Number(e.target.value));
              setInicioSel(null);
            }}
            className={campoClase}
          >
            {opciones.map((o) => (
              <option key={o.duracionMinutos} value={o.duracionMinutos}>
                {o.duracionMinutos} min
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="turno-hora" className="mb-1 block text-xs font-semibold text-grafito">
          Horario
        </label>
        {consulta.isPending && <p className="text-sm text-grafito">Buscando horarios libres…</p>}
        {consulta.isError && <p className="text-sm text-cancelado">No pudimos cargar los horarios libres.</p>}
        {consulta.isSuccess && dia?.abierto === false && (
          <p className="text-sm text-grafito">{dia.motivoCierre ?? "El complejo está cerrado este día."}</p>
        )}
        {consulta.isSuccess && dia?.abierto !== false && slots.length === 0 && (
          <p className="text-sm text-grafito">No quedan horarios libres para esta cancha este día.</p>
        )}
        {slots.length > 0 && (
          <select
            id="turno-hora"
            value={slot?.inicio ?? ""}
            onChange={(e) => setInicioSel(e.target.value)}
            className={campoClase}
          >
            {slots.map((s) => (
              <option key={s.inicio} value={s.inicio}>
                {hhmm(s.inicio)} – {hhmm(s.fin)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="turno-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre
        </label>
        <input
          id="turno-nombre"
          required
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Grupo del Colo"
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="turno-telefono" className="mb-1 block text-xs font-semibold text-grafito">
          Teléfono
        </label>
        <input
          id="turno-telefono"
          type="tel"
          required
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="11 5555-4444"
          className={campoClase}
        />
      </div>

      {cancha.montoSena > 0 && (
        <label className="flex items-center gap-2 pt-1 text-sm text-tinta">
          <input
            type="checkbox"
            checked={senaCobrada}
            onChange={(e) => setSenaCobrada(e.target.checked)}
            className="size-4 rounded border-borde accent-azul"
          />
          Ya pagó la seña ({formatearPrecio(cancha.montoSena)})
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!slot || guardando}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          {guardando ? "Guardando…" : "Guardar turno"}
        </button>
      </div>
    </form>
  );
}
