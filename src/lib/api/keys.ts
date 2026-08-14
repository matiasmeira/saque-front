import type { EstadoReserva } from "./tipos/comunes";

/**
 * Todas las query keys del proyecto, en un solo lugar.
 *
 * Son jerarquicas a proposito: permiten invalidar por prefijo desde una
 * mutacion sin conocer los filtros exactos que hay montados. Por ejemplo,
 * finalizar una reserva invalida `["reservas"]` entero y no necesita saber
 * que fecha esta mirando la agenda.
 *
 * `as const` en cada retorno para que TanStack Query infiera tuplas literales.
 */

export type FiltrosBusquedaPublica = {
  lat?: number;
  lng?: number;
  distanciaKm?: number;
  deporte?: string;
  fecha?: string;
  hora?: string;
  page?: number;
};

export const keys = {
  perfil: () => ["perfil"] as const,

  establecimientos: {
    mios: () => ["establecimientos", "mios"] as const,
  },

  publico: {
    complejos: (filtros: FiltrosBusquedaPublica) =>
      ["publico", "complejos", filtros] as const,
    detalle: (slug: string) => ["publico", "complejo", slug] as const,
    disponibilidad: (slug: string, fecha: string, fechaFin?: string) =>
      ["publico", "complejo", slug, "disponibilidad", fecha, fechaFin ?? null] as const,
  },

  disponibilidad: (estId: number, fecha: string, fechaFin?: string) =>
    ["disponibilidad", estId, fecha, fechaFin ?? null] as const,

  reservas: {
    todas: () => ["reservas"] as const,
    mias: (estado?: EstadoReserva, page = 0) =>
      ["reservas", "mias", estado ?? null, page] as const,
    porEstablecimiento: (estId: number, fecha: string, incluirCanceladas = false) =>
      ["reservas", "establecimiento", estId, fecha, incluirCanceladas] as const,
    porCancha: (canchaId: number, fecha: string, incluirCanceladas = false) =>
      ["reservas", "cancha", canchaId, fecha, incluirCanceladas] as const,
  },

  canchas: (estId: number) => ["canchas", estId] as const,

  bloqueos: {
    delEstablecimiento: (estId: number, fecha: string) =>
      ["bloqueos", estId, fecha] as const,
    deCancha: (estId: number, canchaId: number) =>
      ["bloqueos", estId, "cancha", canchaId] as const,
  },

  diasNoLaborables: (estId: number) => ["dias-no-laborables", estId] as const,

  jugadoresBloqueados: (estId: number) => ["jugadores-bloqueados", estId] as const,

  clientes: {
    todos: () => ["clientes"] as const,
    lista: (estId: number, buscar?: string, soloBloqueados?: boolean, page = 0) =>
      ["clientes", estId, buscar ?? null, soloBloqueados ?? null, page] as const,
    detalle: (estId: number, jugadorId: number) =>
      ["clientes", estId, jugadorId] as const,
    reservas: (estId: number, jugadorId: number, page = 0) =>
      ["clientes", estId, jugadorId, "reservas", page] as const,
  },

  buffet: {
    productos: (estId: number) => ["buffet", "productos", estId] as const,
    ventas: (estId: number, desde: string, hasta: string, estado?: string, page = 0) =>
      ["buffet", "ventas", estId, desde, hasta, estado ?? null, page] as const,
    metricas: (estId: number, desde: string, hasta: string) =>
      ["buffet", "metricas", estId, desde, hasta] as const,
  },

  caja: {
    todo: (estId: number) => ["caja", estId] as const,
    abierta: (estId: number) => ["caja", estId, "abierta"] as const,
    turnos: (estId: number, page = 0) => ["caja", estId, "turnos", page] as const,
    turno: (estId: number, turnoId: number) =>
      ["caja", estId, "turnos", turnoId] as const,
    dispositivos: (estId: number) => ["caja", estId, "dispositivos"] as const,
  },

  gastos: (estId: number, desde?: string, hasta?: string, categoria?: string, page = 0) =>
    ["gastos", estId, desde ?? null, hasta ?? null, categoria ?? null, page] as const,

  empleados: (estId: number) => ["empleados", estId] as const,

  feedback: (estId: number, page = 0) => ["feedback", estId, page] as const,

  auditoria: (estId: number, page = 0) => ["auditoria", estId, page] as const,

  reportes: (estId: number, tipo: string, desde: string, hasta: string) =>
    ["reportes", estId, tipo, desde, hasta] as const,
};
