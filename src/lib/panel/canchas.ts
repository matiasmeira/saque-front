/**
 * La forma con la que trabajan las pantallas de canchas y precios del panel.
 *
 * NO es el DTO: `CanchaResponse` usa `preciosPorDuracion` (un mapa),
 * `canchasFisicasIds`, `cantidadCanchasNecesarias` y trae las tarifas adentro.
 * La traducción vive en `src/lib/api/adaptadores/canchas.ts`. Los bloqueos de
 * mantenimiento son endpoints aparte y se pegan acá al adaptar.
 *
 * Era `src/mocks/canchas.ts`, que además traía un pool de canchas de ejemplo.
 * De ahí quedaron los tipos y los dos helpers.
 *
 * Una cancha puede ser física (canchasFisicas vacío) o compuesta:
 * define un pool de canchas físicas (canchasFisicas) y cuántas de
 * ese pool necesita (canchasNecesarias) — no CUÁLES. Mientras queden
 * esa cantidad libres del pool, está disponible. Reservar una física
 * del pool puede dejar sin disponibilidad a una compuesta que
 * comparte ese pool, aunque nunca se haya reservado ESA compuesta
 * directamente — de ahí "Mover a otra cancha" en el detalle de
 * turno de C2: es la válvula manual para ese choque.
 */
/**
 * Bloqueo temporal por mantenimiento — NO es lo mismo que isActive.
 * isActive es indefinido ("no la uso", el dueño la saca del sistema
 * a mano y la reactiva a mano). Un Bloqueo es programado y con
 * fecha: la cancha vuelve a estar disponible sola cuando termina el
 * rango, sin que nadie tenga que acordarse de reactivarla.
 */
export type Bloqueo = {
  /** datetime local "YYYY-MM-DDTHH:MM" — mismo formato que <input type="datetime-local"> */
  desde: string;
  hasta: string;
  motivo?: string;
};

/** Un precio por cada duración permitida — 90 minutos no cuesta lo mismo que 60. */
export type PrecioPorDuracion = { duracionMinutos: number; precio: number };

export type Cancha = {
  id: number;
  nombre: string;
  /** valores de DEPORTES — una cancha puede servir para varios */
  deportes: string[];
  /** indefinido: fuera de servicio hasta que alguien la reactive a mano */
  isActive: boolean;
  /** ids de canchas físicas del pool — vacío = esta cancha ES física */
  canchasFisicas: number[];
  /** cuántas del pool necesita — null si es física */
  canchasNecesarias: number | null;
  /** uno por cada valor de duracionesPermitidas — rige salvo que una tarifa especial (C4) diga otra cosa */
  preciosBase: PrecioPorDuracion[];
  /** 0 = esta cancha no cobra seña online (plan suscripción) */
  montoSena: number;
  /** minutos, ej. [60, 90] */
  duracionesPermitidas: number[];
  permiteInicioMediaHora: boolean;
  /** temporal, con fecha — ver Bloqueo */
  mantenimientos: Bloqueo[];
};

export function esCompuesta(cancha: Cancha): boolean {
  return cancha.canchasFisicas.length > 0;
}

export function precioBaseDeDuracion(cancha: Cancha, duracionMinutos: number): number {
  return cancha.preciosBase.find((p) => p.duracionMinutos === duracionMinutos)?.precio ?? 0;
}

export const DURACIONES_DISPONIBLES = [60, 90, 120];
