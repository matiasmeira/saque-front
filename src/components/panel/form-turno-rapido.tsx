"use client";

import { useState, type FormEvent } from "react";
import { aHHMM, aMinutos, horariosLibres } from "@/lib/disponibilidad";
import { formatearPrecio } from "@/lib/formato";
import type { Cancha } from "@/mocks/canchas";
import { bloqueosDelDia, PANEL_HORARIO, type Turno } from "@/mocks/agenda";
import { calcularPrecio, diaSemanaDeFecha, PANEL_TARIFAS } from "@/mocks/tarifas";

/**
 * Carga rápida desde una celda libre (o desde "+ Nuevo turno"):
 * nombre, teléfono, seña sí/no, repetición semanal — nada más
 * (Parte 9, C1 y C2). Cancha, duración y horario quedan editables
 * porque "+ Nuevo turno" no viene con una celda de contexto, y cada
 * cancha admite sus propias duraciones (60/90/120) y su propio paso
 * de inicio (hora en punto o también media hora).
 */
export function FormTurnoRapido({
  canchas,
  canchaId,
  fecha,
  horaInicial,
  nombreInicial,
  telefonoInicial,
  turnosDelDia,
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
  turnosDelDia: Turno[];
  onGuardar: (turno: Turno) => void;
  onCancelar: () => void;
}) {
  const [canchaSel, setCanchaSel] = useState(canchaId);
  const cancha = canchas.find((c) => c.id === canchaSel) ?? canchas[0];

  const [duracionSel, setDuracionSel] = useState(cancha.duracionesPermitidas[0]);
  const duracion = cancha.duracionesPermitidas.includes(duracionSel) ? duracionSel : cancha.duracionesPermitidas[0];

  const ocupado = [
    ...turnosDelDia.filter((t) => t.canchaId === cancha.id && t.estado !== "cancelado").map((t) => ({ desde: t.horaInicio, hasta: t.horaFin })),
    ...bloqueosDelDia(cancha, fecha).map((b) => ({ desde: b.horaInicio, hasta: b.horaFin })),
  ];
  const paso = cancha.permiteInicioMediaHora ? 30 : 60;
  const horas = horariosLibres(ocupado, duracion, PANEL_HORARIO.abre, PANEL_HORARIO.cierra, paso);

  const [horaSel, setHoraSel] = useState(horaInicial && horas.includes(horaInicial) ? horaInicial : (horas[0] ?? ""));
  const [nombre, setNombre] = useState(nombreInicial ?? "");
  const [telefono, setTelefono] = useState(telefonoInicial ?? "");
  const [conSenia, setConSenia] = useState(cancha.montoSena > 0);
  const [repiteSemanal, setRepiteSemanal] = useState(false);

  function cambiarCancha(id: number) {
    const nuevaCancha = canchas.find((c) => c.id === id) ?? canchas[0];
    setCanchaSel(id);
    setDuracionSel(nuevaCancha.duracionesPermitidas[0]);
    setConSenia(nuevaCancha.montoSena > 0);
    setHoraSel("");
  }

  function cambiarDuracion(min: number) {
    setDuracionSel(min);
    setHoraSel("");
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !horaSel) return;
    const inicioMin = aMinutos(horaSel);
    const { precio } = calcularPrecio(cancha, PANEL_TARIFAS, diaSemanaDeFecha(fecha), horaSel, duracion);
    onGuardar({
      id: `manual-${fecha}-${cancha.id}-${horaSel}-${Date.now()}`,
      canchaId: cancha.id,
      fecha,
      horaInicio: horaSel,
      horaFin: aHHMM(inicioMin + duracion),
      estado: conSenia && cancha.montoSena > 0 ? "pendiente" : "ocupado",
      cliente: { nombre: nombre.trim(), telefono: telefono.trim() },
      monto: precio,
      senia: conSenia ? cancha.montoSena : 0,
      seniaPagada: false,
      repiteSemanal,
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
          onChange={(e) => cambiarCancha(Number(e.target.value))}
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {cancha.duracionesPermitidas.length > 1 && (
        <div>
          <label htmlFor="turno-duracion" className="mb-1 block text-xs font-semibold text-grafito">
            Duración
          </label>
          <select
            id="turno-duracion"
            value={duracion}
            onChange={(e) => cambiarDuracion(Number(e.target.value))}
            className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            {cancha.duracionesPermitidas.map((min) => (
              <option key={min} value={min}>
                {min} min
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="turno-hora" className="mb-1 block text-xs font-semibold text-grafito">
          Horario
        </label>
        {horas.length === 0 ? (
          <p className="text-sm text-grafito">No quedan horarios libres para esta cancha este día.</p>
        ) : (
          <select
            id="turno-hora"
            value={horaSel}
            onChange={(e) => setHoraSel(e.target.value)}
            className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            {horas.map((h) => (
              <option key={h} value={h}>
                {h} – {aHHMM(aMinutos(h) + duracion)}
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
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
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
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
      </div>

      <div className="space-y-2 pt-1">
        {cancha.montoSena > 0 && (
          <label className="flex items-center gap-2 text-sm text-tinta">
            <input
              type="checkbox"
              checked={conSenia}
              onChange={(e) => setConSenia(e.target.checked)}
              className="size-4 rounded border-borde accent-azul"
            />
            Cobrar seña ({formatearPrecio(cancha.montoSena)})
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-tinta">
          <input
            type="checkbox"
            checked={repiteSemanal}
            onChange={(e) => setRepiteSemanal(e.target.checked)}
            className="size-4 rounded border-borde accent-azul"
          />
          Se repite todas las semanas
        </label>
      </div>

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
          disabled={horas.length === 0}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          Guardar turno
        </button>
      </div>
    </form>
  );
}
