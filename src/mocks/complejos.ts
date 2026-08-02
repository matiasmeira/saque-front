/**
 * Complejos que devuelve el buscador para José C. Paz, y su ficha
 * completa (A3). Mismo tipo para las dos pantallas: A2 usa los
 * campos de nivel complejo (horarios/desde/senia agregados), A3
 * además necesita el detalle por cancha.
 */

// TODO backend: hoy es una lista fija para una sola zona. El
// backend tiene que devolver disponibilidad ya resuelta en el
// listado (no solo en el detalle) — es la ventaja competitiva
// central del producto, según la spec.
export type Cancha = {
  id: string;
  nombre: string;
  /** valor de DEPORTES */
  deporte: string;
  superficie: string;
  techada: boolean;
  /** duración de un turno en esta cancha */
  duracionMin: number;
  /** tramos ya reservados hoy — la grilla y el selector de horarios
   *  derivan todo de acá, nunca de una lista de horarios sueltos */
  ocupado: { desde: string; hasta: string }[];
  precio: number;
  senia: number;
};

export type HorarioAtencion = {
  dias: string;
  horario: string;
  precio: number;
};

export type Complejo = {
  id: string;
  slug: string;
  nombre: string;
  distanciaKm: number;
  direccion: string;
  /** valores de DEPORTES que ofrece el complejo */
  deportes: string[];
  /** turnos libres hoy, agregado de todas las canchas — lo usa A2 */
  horarios: string[];
  desde: number;
  senia: number;
  /** true = todavía sin reseñas. Nunca estrellas vacías: "Nuevo" o nada (Parte 4) */
  nuevo?: boolean;
  canchas: Cancha[];
  /** valores de SERVICIOS */
  servicios: string[];
  horarioAtencion: HorarioAtencion[];
  reglas: string;
  /** etiquetas de foto — placeholder hasta que el complejo suba fotos reales */
  fotos: string[];
  lat: number;
  lng: number;
};

export const COMPLEJOS: Complejo[] = [
  {
    id: "arena-sport-club",
    slug: "arena-sport-club-jose-c-paz",
    nombre: "Arena Sport Club",
    distanciaKm: 1.2,
    direccion: "Av. Hipólito Yrigoyen 1540",
    deportes: ["futbol-5", "futbol-7"],
    horarios: ["19:00", "20:30", "22:00", "22:30", "23:00"],
    desde: 24000,
    senia: 8000,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "futbol-5",
        superficie: "Sintético",
        techada: true,
        duracionMin: 60,
        ocupado: [
          { desde: "09:00", hasta: "19:00" },
          { desde: "20:00", hasta: "20:30" },
          { desde: "21:30", hasta: "22:00" },
        ],
        precio: 24000,
        senia: 8000,
      },
      {
        id: "cancha-2",
        nombre: "Cancha 2",
        deporte: "futbol-7",
        superficie: "Sintético",
        techada: false,
        duracionMin: 90,
        ocupado: [{ desde: "09:00", hasta: "22:00" }],
        precio: 28000,
        senia: 9000,
      },
    ],
    servicios: ["vestuario", "parrilla", "estacionamiento", "wifi"],
    horarioAtencion: [
      { dias: "Lun a Vie", horario: "09 a 24", precio: 24000 },
      { dias: "Sáb y Dom", horario: "09 a 01", precio: 28000 },
    ],
    reglas:
      "Podés cancelar tu reserva sin cargo hasta 24 horas antes del turno. Pasado ese plazo, la seña no se reembolsa. Se solicita puntualidad y el uso de calzado adecuado para cada superficie.",
    fotos: ["Cancha principal", "Vestuarios", "Estacionamiento"],
    lat: -34.5062,
    lng: -58.7723,
  },
  {
    id: "el-trebol-futbol",
    slug: "el-trebol-futbol-jose-c-paz",
    nombre: "El Trébol Fútbol",
    distanciaKm: 2.5,
    direccion: "Ruta 197 y Artigas",
    deportes: ["futbol-5", "padel"],
    horarios: ["20:00", "21:00", "22:00", "22:30", "23:00"],
    desde: 16000,
    senia: 4500,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "futbol-5",
        superficie: "Sintético",
        techada: false,
        duracionMin: 60,
        ocupado: [
          { desde: "14:00", hasta: "21:00" },
          { desde: "22:00", hasta: "22:30" },
        ],
        precio: 22500,
        senia: 6500,
      },
      {
        id: "cancha-2",
        nombre: "Cancha 2",
        deporte: "padel",
        superficie: "Cemento",
        techada: true,
        duracionMin: 90,
        ocupado: [
          { desde: "14:00", hasta: "20:00" },
          { desde: "21:30", hasta: "22:00" },
        ],
        precio: 16000,
        senia: 4500,
      },
    ],
    servicios: ["vestuario", "estacionamiento"],
    horarioAtencion: [
      { dias: "Lun a Vie", horario: "14 a 24", precio: 22500 },
      { dias: "Sáb y Dom", horario: "09 a 24", precio: 25000 },
    ],
    reglas:
      "Cancelación gratuita hasta 24 horas antes. Las canchas de pádel son techadas y se cobran igual en caso de lluvia.",
    fotos: ["Canchas de pádel", "Cancha de fútbol 5", "Entrada"],
    lat: -34.5115,
    lng: -58.759,
  },
  {
    id: "complejo-altamira",
    slug: "complejo-altamira-jose-c-paz",
    nombre: "Complejo Altamira",
    distanciaKm: 3.8,
    direccion: "Calle 12 y Zuviría",
    deportes: ["futbol-5"],
    horarios: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"],
    desde: 26000,
    senia: 10000,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "futbol-5",
        superficie: "Sintético",
        techada: true,
        duracionMin: 60,
        ocupado: [{ desde: "09:00", hasta: "19:00" }],
        precio: 26000,
        senia: 10000,
      },
    ],
    servicios: ["vestuario", "parrilla", "buffet"],
    horarioAtencion: [{ dias: "Todos los días", horario: "09 a 24", precio: 26000 }],
    reglas:
      "Se cobra el 100% de la cancha si se cancela con menos de 12 horas de anticipación. El buffet atiende hasta las 23.",
    fotos: ["Cancha techada", "Buffet", "Vestuarios"],
    lat: -34.5203,
    lng: -58.7488,
  },
  {
    id: "predio-las-heras",
    slug: "predio-las-heras-jose-c-paz",
    nombre: "Predio Las Heras",
    distanciaKm: 4.1,
    direccion: "General Las Heras 2900",
    deportes: ["futbol-5", "futbol-11"],
    horarios: ["22:00", "22:30", "23:00"],
    desde: 20000,
    senia: 5000,
    nuevo: true,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "futbol-5",
        superficie: "Sintético",
        techada: false,
        duracionMin: 60,
        ocupado: [{ desde: "18:00", hasta: "22:00" }],
        precio: 20000,
        senia: 5000,
      },
      {
        id: "cancha-2",
        nombre: "Cancha 2",
        deporte: "futbol-11",
        superficie: "Césped natural",
        techada: false,
        duracionMin: 90,
        ocupado: [{ desde: "18:00", hasta: "22:30" }],
        precio: 35000,
        senia: 10000,
      },
    ],
    servicios: ["estacionamiento", "parrilla"],
    horarioAtencion: [
      { dias: "Lun a Vie", horario: "18 a 24", precio: 20000 },
      { dias: "Sáb y Dom", horario: "10 a 24", precio: 22000 },
    ],
    reglas: "Cancelación sin cargo hasta 24 horas antes. La cancha de fútbol 11 requiere seña del 30%.",
    fotos: ["Cancha de fútbol 11", "Cancha de fútbol 5", "Parrilla"],
    lat: -34.5241,
    lng: -58.7402,
  },
  {
    id: "polideportivo-municipal",
    slug: "polideportivo-municipal-jose-c-paz",
    nombre: "Polideportivo Municipal",
    distanciaKm: 2.0,
    direccion: "Av. San Martín 800",
    deportes: ["basquet", "voley"],
    horarios: ["18:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
    desde: 14000,
    senia: 4000,
    nuevo: true,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "basquet",
        superficie: "Cemento",
        techada: true,
        duracionMin: 60,
        ocupado: [
          { desde: "08:00", hasta: "18:00" },
          { desde: "19:00", hasta: "19:30" },
        ],
        precio: 15000,
        senia: 4000,
      },
      {
        id: "cancha-2",
        nombre: "Cancha 2",
        deporte: "voley",
        superficie: "Cemento",
        techada: true,
        duracionMin: 60,
        ocupado: [
          { desde: "08:00", hasta: "19:00" },
          { desde: "20:00", hasta: "20:30" },
        ],
        precio: 14000,
        // Sin seña: complejo de plan suscripción, no tiene MercadoPago
        // obligatorio. Único caso mock así — sirve para probar que acá
        // el checkout nunca arranca el contador de 10 minutos.
        senia: 0,
      },
    ],
    servicios: ["vestuario", "estacionamiento", "wifi"],
    horarioAtencion: [
      { dias: "Lun a Vie", horario: "08 a 23", precio: 15000 },
      { dias: "Sáb y Dom", horario: "09 a 21", precio: 15000 },
    ],
    reglas: "Uso exclusivo de calzado deportivo no marcador. Cancelación gratuita hasta 6 horas antes.",
    fotos: ["Cancha techada", "Gradas", "Entrada principal"],
    lat: -34.4998,
    lng: -58.7655,
  },
  {
    id: "club-pinares",
    slug: "club-pinares-jose-c-paz",
    nombre: "Club Pinares",
    distanciaKm: 5.3,
    direccion: "Ruta 8, km 45",
    deportes: ["futbol-5", "futbol-7"],
    horarios: [],
    desde: 21000,
    senia: 6000,
    canchas: [
      {
        id: "cancha-1",
        nombre: "Cancha 1",
        deporte: "futbol-5",
        superficie: "Sintético",
        techada: false,
        duracionMin: 60,
        ocupado: [{ desde: "09:00", hasta: "23:00" }],
        precio: 21000,
        senia: 6000,
      },
      {
        id: "cancha-2",
        nombre: "Cancha 2",
        deporte: "futbol-7",
        superficie: "Sintético",
        techada: false,
        duracionMin: 90,
        ocupado: [{ desde: "09:00", hasta: "23:00" }],
        precio: 25000,
        senia: 7000,
      },
    ],
    servicios: ["parrilla", "estacionamiento"],
    horarioAtencion: [{ dias: "Todos los días", horario: "09 a 23", precio: 21000 }],
    reglas: "Cancelación sin cargo hasta 24 horas antes del turno.",
    fotos: ["Cancha 1", "Cancha 2", "Parrilla"],
    lat: -34.531,
    lng: -58.7801,
  },
];
