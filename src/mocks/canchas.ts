/**
 * Entidad Cancha, alineada con el backend (Spring Boot). Fuente
 * canónica del tipo — la agenda (C2) importa de acá, no al revés.
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
  capacidad: number;
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

// Pool A/B/C de fútbol 5: tres físicas, más una compuesta de fútbol 7
// que usa 2 de esas 3 — reservar una F5 dentro del pool puede dejar
// a la F7 dobles sin disponibilidad aunque nadie la haya tocado.
// Mismo patrón para el pool de pádel (D/E → dobles). Cancha C queda
// inactiva (indefinido) y Cancha B con un mantenimiento programado
// (temporal, con fecha) — son los dos mecanismos, en dos canchas
// distintas para que se vean claramente diferenciados. La Multiuso
// queda sin seña (plan suscripción).
export const PANEL_CANCHAS: Cancha[] = [
  {
    id: 1,
    nombre: "Cancha A",
    deportes: ["futbol-5"],
    capacidad: 10,
    isActive: true,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [{ duracionMinutos: 60, precio: 24000 }],
    montoSena: 8000,
    duracionesPermitidas: [60],
    permiteInicioMediaHora: false,
    mantenimientos: [],
  },
  {
    id: 2,
    nombre: "Cancha B",
    deportes: ["futbol-5"],
    capacidad: 10,
    isActive: true,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [{ duracionMinutos: 60, precio: 24000 }],
    montoSena: 8000,
    duracionesPermitidas: [60],
    permiteInicioMediaHora: false,
    mantenimientos: [{ desde: "2026-07-29T08:00", hasta: "2026-08-02T23:00", motivo: "Resiembra del césped" }],
  },
  {
    id: 3,
    nombre: "Cancha C",
    deportes: ["futbol-5"],
    capacidad: 10,
    isActive: false,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [{ duracionMinutos: 60, precio: 24000 }],
    montoSena: 8000,
    duracionesPermitidas: [60],
    permiteInicioMediaHora: false,
    mantenimientos: [],
  },
  {
    id: 4,
    nombre: "Cancha 7 (dobles)",
    deportes: ["futbol-7"],
    capacidad: 14,
    isActive: true,
    canchasFisicas: [1, 2, 3],
    canchasNecesarias: 2,
    preciosBase: [{ duracionMinutos: 90, precio: 30000 }],
    montoSena: 10000,
    duracionesPermitidas: [90],
    permiteInicioMediaHora: true,
    mantenimientos: [],
  },
  {
    id: 5,
    nombre: "Pádel D",
    deportes: ["padel"],
    capacidad: 4,
    isActive: true,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [
      { duracionMinutos: 60, precio: 16000 },
      { duracionMinutos: 90, precio: 22000 },
    ],
    montoSena: 5000,
    duracionesPermitidas: [60, 90],
    permiteInicioMediaHora: true,
    mantenimientos: [],
  },
  {
    id: 6,
    nombre: "Pádel E",
    deportes: ["padel"],
    capacidad: 4,
    isActive: true,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [
      { duracionMinutos: 60, precio: 16000 },
      { duracionMinutos: 90, precio: 22000 },
    ],
    montoSena: 5000,
    duracionesPermitidas: [60, 90],
    permiteInicioMediaHora: true,
    mantenimientos: [],
  },
  {
    id: 7,
    nombre: "Pádel Dobles",
    deportes: ["padel"],
    capacidad: 8,
    isActive: true,
    canchasFisicas: [5, 6],
    canchasNecesarias: 2,
    preciosBase: [{ duracionMinutos: 90, precio: 20000 }],
    montoSena: 6000,
    duracionesPermitidas: [90],
    permiteInicioMediaHora: true,
    mantenimientos: [],
  },
  {
    id: 8,
    nombre: "Cancha Multiuso",
    deportes: ["basquet", "voley"],
    capacidad: 12,
    isActive: true,
    canchasFisicas: [],
    canchasNecesarias: null,
    preciosBase: [
      { duracionMinutos: 60, precio: 12000 },
      { duracionMinutos: 90, precio: 17000 },
      { duracionMinutos: 120, precio: 22000 },
    ],
    montoSena: 0,
    duracionesPermitidas: [60, 90, 120],
    permiteInicioMediaHora: true,
    mantenimientos: [],
  },
];
