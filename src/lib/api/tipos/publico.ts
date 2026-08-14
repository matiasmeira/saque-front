import type {
  Deporte,
  FeedbackDestacadoDto,
  HorarioAtencionDto,
  Servicio,
} from "./comunes";

/**
 * Zona pública del marketplace (ComplejoPublicoController).
 *
 * Todo GET /api/v1/publico/** es permitAll: son los únicos endpoints de
 * negocio que un visitante anónimo puede consumir. Ninguno expone duenoId ni
 * datos de jugadores.
 */

/** Card del listado. Ojo: la identidad pública es el `slug`, no un id. */
export type ComplejoCardResponse = {
  slug: string;
  nombre: string;
  direccion: string;
  fotoPrincipal: string | null;
  deportes: Deporte[];
  precioDesde: number | null;
  requiereSena: boolean;
  senaDesde: number | null;
  /** Sólo viene calculada si la búsqueda incluyó lat y lng. */
  distanciaKm: number | null;
  promedioCalificacion: number | null;
  cantidadCalificaciones: number | null;
};

export type CanchaPublicaDto = {
  id: number;
  nombre: string;
  deportes: Deporte[];
  precioDesde: number | null;
};

export type ComplejoDetalleResponse = {
  slug: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  deportes: Deporte[];
  servicios: Servicio[];
  fotos: string[];
  horariosAtencion: HorarioAtencionDto[];
  canchas: CanchaPublicaDto[];
  precioDesde: number | null;
  requiereSena: boolean;
  senaDesde: number | null;
  promedioCalificacion: number | null;
  cantidadCalificaciones: number | null;
  comentarioDestacado: FeedbackDestacadoDto | null;
};

/**
 * Filtros del listado público.
 *
 * `lat` y `lng` son opcionales pero van JUNTOS: mandar sólo uno devuelve
 * 400 "lat y lng deben proveerse juntos". Con ubicación ordena por distancia;
 * sin ubicación, por promedio de calificación.
 *
 * `fecha` y `hora` también van juntos: el filtro por disponibilidad sólo se
 * aplica si están los dos, y mira una ventana fija de 60 minutos desde `hora`.
 *
 * `distanciaKm` se recorta a 100 en el backend.
 */
export type FiltrosComplejos = {
  lat?: number;
  lng?: number;
  distanciaKm?: number;
  deporte?: Deporte;
  fecha?: string;
  hora?: string;
  page?: number;
  size?: number;
};
