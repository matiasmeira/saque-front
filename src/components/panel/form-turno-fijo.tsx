"use client";

import { useState, type FormEvent } from "react";

import { DIA_SEMANA_A_BACK, type DiaSemanaBack } from "@/lib/api/fechas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";
import { hoyISO } from "@/lib/fecha";
import type { Cancha } from "@/lib/panel/canchas";
import { DIAS_SEMANA, type DiaSemana } from "@/lib/panel/tarifas";
import { horariosPosiblesDelDia, ocurrenciasDelPeriodo, topeDelPeriodo } from "@/lib/panel/turno-fijo";

export type DatosTurnoFijo = {
  canchaId: number;
  diaSemana: DiaSemanaBack;
  /** "20:00" — el endpoint las normaliza a LocalTime. */
  horaInicio: string;
  horaFin: string;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  nombre: string;
  telefono: string;
};

/** "2026-09-07" → "07/09" */
const ddmm = (fechaISO: string) => `${fechaISO.slice(8, 10)}/${fechaISO.slice(5, 7)}`;

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";
const etiquetaClase = "mb-1 block text-xs font-semibold text-grafito";

/**
 * Alta de un turno fijo semanal: POST /turnos-fijos, que crea la serie más una
 * reserva CONFIRMADA por cada fecha del período que cae en el día elegido.
 *
 * A diferencia de FormTurnoRapido, NO ofrece slots de la grilla de
 * disponibilidad. Esa grilla responde por UNA fecha, y acá el alta abarca hasta
 * 52: un slot libre el primer lunes no dice nada de los otros 51. Se ofrecen
 * las medias horas del horario de atención de ese día y el backend valida el
 * resto (granularidad, duración permitida de la cancha, solapamientos).
 *
 * El alta es TODO-O-NADA: si una sola fecha choca no se crea ninguna, y el
 * mensaje del backend dice cuál. Por eso el contador de abajo muestra cuántos
 * turnos se van a crear ANTES de guardar — el dueño tiene que ver a qué se
 * compromete, y si algo choca, acortar el período.
 *
 * Ningún selector guarda estado "corregido": si lo elegido deja de estar
 * disponible (cambió el día y ese horario no existe, o el período se acortó),
 * se cae al primero válido. Mismo criterio que FormTurnoRapido, y evita un
 * useEffect de reseteo por cada campo.
 */
export function FormTurnoFijo({
  canchas,
  canchaId,
  horariosAtencion,
  guardando,
  onGuardar,
  onCancelar,
}: {
  canchas: Cancha[];
  canchaId: number;
  horariosAtencion: HorarioAtencionDto[] | null | undefined;
  guardando?: boolean;
  onGuardar: (datos: DatosTurnoFijo) => void;
  onCancelar: () => void;
}) {
  const hoy = hoyISO();

  const [canchaSel, setCanchaSel] = useState(canchaId);
  const [diaSel, setDiaSel] = useState<DiaSemana>("lun");
  const [inicioSel, setInicioSel] = useState<string | null>(null);
  const [finSel, setFinSel] = useState<string | null>(null);
  const [desde, setDesde] = useState(hoy);
  // Por defecto, todo lo que el backend permite: un turno fijo se carga por año
  // calendario y se renueva (ver validarPeriodoDentroDelAnio).
  const [hasta, setHasta] = useState(topeDelPeriodo(hoy));
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const cancha = canchas.find((c) => c.id === canchaSel) ?? canchas[0];
  const diaBack = DIA_SEMANA_A_BACK[diaSel];

  const horarios = horariosPosiblesDelDia(horariosAtencion?.find((h) => h.diaSemana === diaBack));
  const inicio = (inicioSel && horarios.includes(inicioSel) ? inicioSel : horarios[0]) ?? null;
  const finesPosibles = inicio ? horarios.filter((h) => h > inicio) : [];
  const fin = (finSel && finesPosibles.includes(finSel) ? finSel : finesPosibles[0]) ?? null;

  const tope = topeDelPeriodo(desde);
  const hastaEfectiva = hasta > tope ? tope : hasta;
  const ocurrencias = ocurrenciasDelPeriodo(desde, hastaEfectiva, diaBack);

  const listo = Boolean(cancha && inicio && fin && nombre.trim() && ocurrencias.length > 0);

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!listo || !inicio || !fin) return;
    onGuardar({
      canchaId: cancha.id,
      diaSemana: diaBack,
      horaInicio: inicio,
      horaFin: fin,
      fechaInicioPeriodo: desde,
      fechaFinPeriodo: hastaEfectiva,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label htmlFor="fijo-cancha" className={etiquetaClase}>
          Cancha
        </label>
        <select
          id="fijo-cancha"
          value={canchaSel}
          onChange={(e) => setCanchaSel(Number(e.target.value))}
          className={campoClase}
        >
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fijo-dia" className={etiquetaClase}>
          Se repite todos los
        </label>
        <select
          id="fijo-dia"
          value={diaSel}
          onChange={(e) => {
            setDiaSel(e.target.value as DiaSemana);
            setInicioSel(null);
            setFinSel(null);
          }}
          className={campoClase}
        >
          {DIAS_SEMANA.map((d) => (
            <option key={d.valor} value={d.valor}>
              {d.larga}
            </option>
          ))}
        </select>
      </div>

      {horarios.length === 0 ? (
        <p className="rounded-input bg-humo px-3 py-2.5 text-sm text-grafito">
          El complejo no abre los {DIAS_SEMANA.find((d) => d.valor === diaSel)?.larga.toLowerCase()}.
          Cargá el horario de atención de ese día o elegí otro.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fijo-desde-hora" className={etiquetaClase}>
              Desde
            </label>
            <select
              id="fijo-desde-hora"
              value={inicio ?? ""}
              onChange={(e) => {
                setInicioSel(e.target.value);
                setFinSel(null);
              }}
              className={campoClase}
            >
              {horarios.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fijo-hasta-hora" className={etiquetaClase}>
              Hasta
            </label>
            <select
              id="fijo-hasta-hora"
              value={fin ?? ""}
              onChange={(e) => setFinSel(e.target.value)}
              disabled={finesPosibles.length === 0}
              className={campoClase}
            >
              {finesPosibles.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fijo-desde" className={etiquetaClase}>
            Desde el
          </label>
          <input
            id="fijo-desde"
            type="date"
            required
            value={desde}
            min={hoy}
            onChange={(e) => setDesde(e.target.value)}
            className={campoClase}
          />
        </div>
        <div>
          <label htmlFor="fijo-hasta" className={etiquetaClase}>
            Hasta el
          </label>
          {/*
            max = 31/12 del año de inicio, el mismo tope que aplica el backend
            (validarPeriodoDentroDelAnio). Así el dueño no puede ni elegir una
            fecha que va a volver rechazada.
          */}
          <input
            id="fijo-hasta"
            type="date"
            required
            value={hastaEfectiva}
            min={desde}
            max={tope}
            onChange={(e) => setHasta(e.target.value)}
            className={campoClase}
          />
        </div>
      </div>

      <p className="text-xs text-grafito">
        Un turno fijo se carga hasta fin de año. En enero cargás el del año que viene.
      </p>

      <div>
        <label htmlFor="fijo-nombre" className={etiquetaClase}>
          Nombre
        </label>
        <input
          id="fijo-nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Grupo del Colo"
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="fijo-telefono" className={etiquetaClase}>
          Teléfono
        </label>
        <input
          id="fijo-telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="11 5555-4444"
          className={campoClase}
        />
      </div>

      {/*
        El alta es todo-o-nada y puede llegar a 52 reservas: mostrar cuántas y
        hasta cuándo antes de guardar es lo que evita que el dueño se entere
        recién por el error.
      */}
      <div className="rounded-input bg-celeste-suave px-3 py-2.5 text-sm text-tinta">
        {ocurrencias.length === 0 ? (
          <>No hay ningún {DIAS_SEMANA.find((d) => d.valor === diaSel)?.larga.toLowerCase()} en ese período.</>
        ) : (
          <>
            Se van a crear <strong>{ocurrencias.length}</strong>{" "}
            {ocurrencias.length === 1 ? "turno" : "turnos"}, del{" "}
            <strong>{ddmm(ocurrencias[0])}</strong> al{" "}
            <strong>{ddmm(ocurrencias[ocurrencias.length - 1])}</strong>.
          </>
        )}
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
          disabled={!listo || guardando}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          {guardando ? "Creando…" : "Crear turno fijo"}
        </button>
      </div>
    </form>
  );
}
