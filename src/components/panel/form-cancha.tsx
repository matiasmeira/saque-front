"use client";

import { useState, type FormEvent } from "react";
import { Wrench } from "lucide-react";
import { DEPORTES } from "@/lib/deportes";
import { DURACIONES_DISPONIBLES, esCompuesta, type Bloqueo, type Cancha } from "@/lib/panel/canchas";
import { fechaLarga } from "@/lib/formato";
import type { DatosCancha } from "@/lib/api/adaptadores/canchas";

/** "martes 29 de julio 08:00" — para listar bloqueos en el drawer. */
function fechaHoraLarga(datetimeLocal: string): string {
  return `${fechaLarga(datetimeLocal.slice(0, 10))} ${datetimeLocal.slice(11, 16)}`;
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (valor: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-tinta">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-azul" : "bg-borde"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
          aria-hidden
        />
      </button>
    </div>
  );
}

function chipClase(activo: boolean) {
  return `h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
    activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
  }`;
}

/**
 * Alta y edición comparten el mismo form. La composición (pool) es
 * lo único no trivial: si "usa un pool" está activo, hay que elegir
 * QUÉ físicas entran al pool y CUÁNTAS necesita — nunca cuáles
 * específicas se van a usar en cada reserva, eso lo resuelve la
 * disponibilidad en tiempo real.
 */
export function FormCancha({
  cancha,
  canchasExistentes,
  montoSenaSugerido,
  onGuardar,
  onCancelar,
  onAgregarBloqueo,
  onQuitarBloqueo,
}: {
  cancha: Cancha | null;
  /** para elegir el pool: solo físicas, sin incluirse a sí misma */
  canchasExistentes: Cancha[];
  /** sólo se usa cuando `cancha === null` — ej. el wizard de onboarding prellena con la seña por defecto del paso 2 */
  montoSenaSugerido?: number;
  onGuardar: (datos: DatosCancha) => void;
  onCancelar: () => void;
  /** los bloqueos se aplican al toque, no esperan al Guardar del resto del form */
  onAgregarBloqueo: (bloqueo: Bloqueo) => void;
  onQuitarBloqueo: (indice: number) => void;
}) {
  const [nombre, setNombre] = useState(cancha?.nombre ?? "");
  const [deportes, setDeportes] = useState<string[]>(cancha?.deportes ?? []);
  const [activa, setActiva] = useState(cancha?.isActive ?? true);
  const [preciosPorDuracion, setPreciosPorDuracion] = useState<Record<number, number>>(() =>
    Object.fromEntries((cancha?.preciosBase ?? []).map((p) => [p.duracionMinutos, p.precio])),
  );
  const [montoSena, setMontoSena] = useState(cancha?.montoSena ?? montoSenaSugerido ?? 0);
  const [duraciones, setDuraciones] = useState<number[]>(cancha?.duracionesPermitidas ?? [60]);
  const [mediaHora, setMediaHora] = useState(cancha?.permiteInicioMediaHora ?? false);
  const [esPool, setEsPool] = useState(cancha ? esCompuesta(cancha) : false);
  const [pool, setPool] = useState<number[]>(cancha?.canchasFisicas ?? []);
  const [necesarias, setNecesarias] = useState(cancha?.canchasNecesarias ?? 1);
  const [error, setError] = useState<string | null>(null);

  const [bloqueoDesde, setBloqueoDesde] = useState("");
  const [bloqueoHasta, setBloqueoHasta] = useState("");
  const [bloqueoMotivo, setBloqueoMotivo] = useState("");

  const fisicasDisponibles = canchasExistentes.filter((c) => c.canchasFisicas.length === 0 && c.id !== cancha?.id);
  const nombresPool = pool.map((id) => canchasExistentes.find((c) => c.id === id)?.nombre ?? `#${id}`);

  function alternar<T>(lista: T[], valor: T, setter: (l: T[]) => void) {
    setter(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre.");
    if (deportes.length === 0) return setError("Elegí al menos un deporte.");
    if (duraciones.length === 0) return setError("Elegí al menos una duración.");
    if (duraciones.some((d) => !preciosPorDuracion[d])) return setError("Cargá un precio base para cada duración elegida.");
    if (esPool) {
      if (pool.length === 0) return setError("Elegí al menos una cancha física para el pool.");
      if (necesarias < 1) return setError("Tiene que necesitar al menos 1 cancha del pool.");
      if (necesarias > pool.length) return setError("No puede necesitar más canchas que las que elegiste.");
    }
    setError(null);
    onGuardar({
      nombre: nombre.trim(),
      deportes,
      isActive: activa,
      preciosBase: duraciones.map((d) => ({ duracionMinutos: d, precio: preciosPorDuracion[d] })),
      montoSena,
      duracionesPermitidas: duraciones,
      permiteInicioMediaHora: mediaHora,
      canchasFisicas: esPool ? pool : [],
      canchasNecesarias: esPool ? necesarias : null,
    });
  }

  function agregarBloqueo() {
    if (!bloqueoDesde || !bloqueoHasta || bloqueoDesde >= bloqueoHasta) return;
    onAgregarBloqueo({ desde: bloqueoDesde, hasta: bloqueoHasta, motivo: bloqueoMotivo.trim() || undefined });
    setBloqueoDesde("");
    setBloqueoHasta("");
    setBloqueoMotivo("");
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <label htmlFor="cancha-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre
        </label>
        <input
          id="cancha-nombre"
          required
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Cancha 9"
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
      </div>

      <div>
        <Switch checked={activa} onChange={setActiva} label="Cancha activa" />
        <p className="mt-1 text-xs text-grafito">
          Inactiva = fuera de servicio indefinido: no aparece en el buscador ni se puede reservar, hasta que la
          reactivés a mano. Para algo temporal con fecha, usá un bloqueo por mantenimiento más abajo.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Deportes</p>
        <div className="flex flex-wrap gap-1.5">
          {DEPORTES.map((d) => (
            <button
              key={d.valor}
              type="button"
              aria-pressed={deportes.includes(d.valor)}
              onClick={() => alternar(deportes, d.valor, setDeportes)}
              className={chipClase(deportes.includes(d.valor))}
            >
              {d.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="cancha-senia" className="mb-1 block text-xs font-semibold text-grafito">
          Seña (0 = sin seña)
        </label>
        <input
          id="cancha-senia"
          type="number"
          min={0}
          required
          value={montoSena}
          onChange={(e) => setMontoSena(Number(e.target.value))}
          className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-grafito">Duraciones permitidas</p>
        <div className="flex flex-wrap gap-1.5">
          {DURACIONES_DISPONIBLES.map((min) => (
            <button
              key={min}
              type="button"
              aria-pressed={duraciones.includes(min)}
              onClick={() => alternar(duraciones, min, setDuraciones)}
              className={chipClase(duraciones.includes(min))}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      {duraciones.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-grafito">Precio base por duración</p>
          <p className="mb-2 text-xs text-grafito">
            Rige siempre que no haya una tarifa especial aplicable — las tarifas se cargan en Precios.
          </p>
          <div className="space-y-2">
            {duraciones.map((d) => (
              <div key={d} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-sm font-semibold text-tinta">{d} min</span>
                <input
                  type="number"
                  min={0}
                  value={preciosPorDuracion[d] ?? ""}
                  onChange={(e) => setPreciosPorDuracion((prev) => ({ ...prev, [d]: Number(e.target.value) }))}
                  placeholder="0"
                  aria-label={`Precio base para ${d} minutos`}
                  className="w-full rounded-input bg-humo px-3 py-2 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Switch checked={mediaHora} onChange={setMediaHora} label="Permite inicio a la media hora" />

      <div className="space-y-3 rounded-card bg-humo p-4">
        <Switch checked={esPool} onChange={setEsPool} label="¿Esta cancha usa un pool de otras canchas?" />

        {esPool && (
          <div className="space-y-3 border-t border-white pt-3">
            {fisicasDisponibles.length === 0 ? (
              <p className="text-sm text-grafito">Todavía no hay otras canchas físicas para armar un pool.</p>
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-grafito">Canchas físicas del pool</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fisicasDisponibles.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={pool.includes(c.id)}
                        onClick={() => alternar(pool, c.id, setPool)}
                        className={chipClase(pool.includes(c.id))}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="cancha-necesarias" className="mb-1 block text-xs font-semibold text-grafito">
                    ¿Cuántas de estas necesita?
                  </label>
                  <input
                    id="cancha-necesarias"
                    type="number"
                    min={1}
                    max={pool.length || undefined}
                    value={necesarias}
                    onChange={(e) => setNecesarias(Number(e.target.value))}
                    className="w-full rounded-input bg-white px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                  />
                </div>

                {pool.length > 0 && (
                  <p className="text-sm text-grafito">
                    Esta cancha usa {necesarias} de las {pool.length} del pool ({nombresPool.join(", ")}). Mientras
                    queden {necesarias} libres, está disponible, sin importar cuáles.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {cancha && (
        <div className="space-y-3 rounded-card bg-humo p-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-tinta">
              <Wrench className="size-4 shrink-0 text-grafito" aria-hidden />
              Bloqueos de mantenimiento
            </p>
            <p className="mt-0.5 text-xs text-grafito">
              Temporal, con fecha: la cancha vuelve a estar disponible sola apenas termina el rango.
            </p>
          </div>

          {cancha.mantenimientos.length > 0 && (
            <ul className="space-y-2">
              {cancha.mantenimientos.map((b, i) => (
                <li key={i} className="flex items-start justify-between gap-2 rounded-input bg-white p-3">
                  <div className="text-sm text-tinta">
                    <p className="font-semibold">
                      {fechaHoraLarga(b.desde)} → {fechaHoraLarga(b.hasta)}
                    </p>
                    {b.motivo && <p className="text-xs text-grafito">{b.motivo}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuitarBloqueo(i)}
                    className="shrink-0 text-xs font-semibold text-cancelado hover:underline"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-white pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="bloqueo-desde" className="mb-1 block text-xs font-semibold text-grafito">
                  Desde
                </label>
                <input
                  id="bloqueo-desde"
                  type="datetime-local"
                  value={bloqueoDesde}
                  onChange={(e) => setBloqueoDesde(e.target.value)}
                  className="w-full rounded-input bg-white px-2 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                />
              </div>
              <div>
                <label htmlFor="bloqueo-hasta" className="mb-1 block text-xs font-semibold text-grafito">
                  Hasta
                </label>
                <input
                  id="bloqueo-hasta"
                  type="datetime-local"
                  min={bloqueoDesde || undefined}
                  value={bloqueoHasta}
                  onChange={(e) => setBloqueoHasta(e.target.value)}
                  className="w-full rounded-input bg-white px-2 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
                />
              </div>
            </div>
            <input
              value={bloqueoMotivo}
              onChange={(e) => setBloqueoMotivo(e.target.value)}
              placeholder="Motivo (opcional) — ej: resiembra del césped"
              className="w-full rounded-input bg-white px-3 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
            <button
              type="button"
              onClick={agregarBloqueo}
              disabled={!bloqueoDesde || !bloqueoHasta || bloqueoDesde >= bloqueoHasta}
              className="flex h-9 w-full items-center justify-center rounded-full border border-borde font-display text-xs font-bold text-tinta transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Agregar bloqueo
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
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
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
