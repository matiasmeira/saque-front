/**
 * Clientes = la libreta de contactos del complejo, no usuarios
 * registrados de la plataforma: cualquier persona que reservó
 * online o a quien el dueño le cargó un turno a mano desde la
 * agenda. Son las mismas personas de CLIENTES_MOCK en agenda.ts —
 * se reutilizan acá para que C2, C5 y C6 cuenten la misma historia.
 */
import { crearRand, hashSeed } from "@/lib/prng";
import { hoyISO, sumarDias } from "@/lib/fecha";
import { CLIENTES_MOCK, type EstadoTurno } from "@/mocks/agenda";
import { PANEL_CANCHAS } from "@/mocks/canchas";

export type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  reservasTotales: number;
  ultimaReserva: string;
  ausencias: number;
  esFrecuente: boolean;
  /** el dueño lo bloquea a mano — un jugador bloqueado no debería poder reservar más */
  bloqueado: boolean;
};

export type ReservaHistorial = {
  id: string;
  clienteId: number;
  fecha: string;
  canchaId: number;
  estado: EstadoTurno;
  monto: number;
};

/** A partir de acá, la tabla marca las ausencias como "altas" — señal fija, no es una config del dueño. */
export const AUSENCIAS_ALTAS = 3;

const HOY = hoyISO();

export const PANEL_CLIENTES: Cliente[] = [
  {
    id: 1,
    nombre: CLIENTES_MOCK[0].nombre,
    telefono: CLIENTES_MOCK[0].telefono,
    email: "martin.perez@gmail.com",
    reservasTotales: 18,
    ultimaReserva: sumarDias(HOY, -2),
    ausencias: 1,
    esFrecuente: true,
    bloqueado: false,
  },
  {
    id: 2,
    nombre: CLIENTES_MOCK[1].nombre,
    telefono: CLIENTES_MOCK[1].telefono,
    reservasTotales: 24,
    ultimaReserva: sumarDias(HOY, -1),
    ausencias: 0,
    esFrecuente: true,
    bloqueado: false,
  },
  {
    id: 3,
    nombre: CLIENTES_MOCK[2].nombre,
    telefono: CLIENTES_MOCK[2].telefono,
    email: "laura.gomez@hotmail.com",
    reservasTotales: 6,
    ultimaReserva: sumarDias(HOY, -12),
    ausencias: 0,
    esFrecuente: false,
    bloqueado: false,
  },
  {
    id: 4,
    nombre: CLIENTES_MOCK[3].nombre,
    telefono: CLIENTES_MOCK[3].telefono,
    reservasTotales: 3,
    ultimaReserva: sumarDias(HOY, -20),
    ausencias: 2,
    esFrecuente: false,
    bloqueado: false,
  },
  {
    id: 5,
    nombre: CLIENTES_MOCK[4].nombre,
    telefono: CLIENTES_MOCK[4].telefono,
    reservasTotales: 9,
    ultimaReserva: sumarDias(HOY, -5),
    ausencias: 1,
    esFrecuente: false,
    bloqueado: false,
  },
  {
    id: 6,
    nombre: CLIENTES_MOCK[5].nombre,
    telefono: CLIENTES_MOCK[5].telefono,
    reservasTotales: 5,
    ultimaReserva: sumarDias(HOY, -30),
    ausencias: 4,
    esFrecuente: false,
    // Bloqueado a propósito: es el que ya tenía más ausencias — el
    // caso de uso típico de "bloquear un jugador" en la demo.
    bloqueado: true,
  },
  {
    id: 7,
    nombre: CLIENTES_MOCK[6].nombre,
    telefono: CLIENTES_MOCK[6].telefono,
    email: "ana.rios@gmail.com",
    reservasTotales: 12,
    ultimaReserva: sumarDias(HOY, -3),
    ausencias: 0,
    esFrecuente: true,
    bloqueado: false,
  },
  {
    id: 8,
    nombre: CLIENTES_MOCK[7].nombre,
    telefono: CLIENTES_MOCK[7].telefono,
    reservasTotales: 30,
    ultimaReserva: HOY,
    ausencias: 2,
    esFrecuente: true,
    bloqueado: false,
  },
  {
    id: 9,
    nombre: CLIENTES_MOCK[8].nombre,
    telefono: CLIENTES_MOCK[8].telefono,
    reservasTotales: 2,
    ultimaReserva: sumarDias(HOY, -45),
    ausencias: 0,
    esFrecuente: false,
    bloqueado: false,
  },
  {
    id: 10,
    nombre: CLIENTES_MOCK[9].nombre,
    telefono: CLIENTES_MOCK[9].telefono,
    reservasTotales: 4,
    ultimaReserva: sumarDias(HOY, -8),
    ausencias: 3,
    esFrecuente: false,
    bloqueado: false,
  },
];

const CANCHAS_PARA_HISTORIAL = PANEL_CANCHAS.filter((c) => c.canchasFisicas.length === 0);

function historialDeCliente(cliente: Cliente): ReservaHistorial[] {
  const cantidad = Math.min(cliente.reservasTotales, 6);
  const rand = crearRand(hashSeed(`historial-${cliente.id}`));
  const entradas: ReservaHistorial[] = [];
  let fecha = cliente.ultimaReserva;

  for (let i = 0; i < cantidad; i++) {
    const cancha = CANCHAS_PARA_HISTORIAL[Math.floor(rand() * CANCHAS_PARA_HISTORIAL.length)];
    const r = rand();
    const estado: EstadoTurno = r < 0.8 ? "ocupado" : r < 0.93 ? "pendiente" : "cancelado";
    entradas.push({
      id: `hist-${cliente.id}-${i}`,
      clienteId: cliente.id,
      fecha,
      canchaId: cancha.id,
      estado,
      monto: cancha.preciosBase[0]?.precio ?? 0,
    });
    fecha = sumarDias(fecha, -(3 + Math.floor(rand() * 10)));
  }
  return entradas;
}

// TODO backend: el historial completo (paginado) y el total gastado
// vienen de la API. El mock solo genera hasta 6 reservas pasadas por
// cliente — alcanza para probar la ficha (C6).
export const PANEL_HISTORIAL: ReservaHistorial[] = PANEL_CLIENTES.flatMap(historialDeCliente);

export function historialDeClienteId(clienteId: number): ReservaHistorial[] {
  return PANEL_HISTORIAL.filter((h) => h.clienteId === clienteId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function totalGastado(clienteId: number): number {
  return historialDeClienteId(clienteId)
    .filter((h) => h.estado !== "cancelado")
    .reduce((acc, h) => acc + h.monto, 0);
}
