import type {
  FeedbackDestacadoDto,
  HorarioAtencionDto,
  Servicio,
} from "./comunes";

/**
 * EstablecimientoRequest / EstablecimientoResponse.
 *
 * `servicios` tiene semantica de TRES estados en el back:
 *   - ausente / null  → NO modificar (deja los existentes intactos)
 *   - []              → borrar todos
 *   - [.., ..]        → reemplazar
 *
 * El panel edita por seccion, asi que al guardar horarios hay que OMITIR la
 * clave `servicios`; mandarla en `[]` le borraria los servicios al complejo.
 *
 * NO acepta: slug, fotos, telefono, cuit, deportes,
 * horasCancelacionAntesPartido, minutosGraciaCancelacion.
 */
export type EstablecimientoRequest = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  requiereSena: boolean;
  /** @NotNull, igual que requiereSena: todo PUT tiene que mandarlo siempre. */
  requiereTelefonoVerificado: boolean;
  horariosAtencion: HorarioAtencionDto[];
  servicios?: Servicio[];
};

/** Foto del complejo. `fileId` es el id de ImageKit — lo pide el DELETE y el PUT /orden. */
export type FotoEstablecimiento = {
  url: string;
  fileId: string;
};

/**
 * OJO: no trae `fotos`. FotoEstablecimientoController es un sub-recurso propio
 * (`/establecimientos/{id}/fotos`, ver `establecimientos.listarFotos`), no un
 * campo embebido acá — mandarlo como obligatorio en este tipo hizo que el
 * panel mostrara "sin fotos" siempre, sin importar cuántas hubiera.
 */
export type EstablecimientoResponse = {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  requiereSena: boolean;
  requiereTelefonoVerificado: boolean;
  isActive: boolean;
  duenoId: number;
  horariosAtencion: HorarioAtencionDto[];
  servicios: Servicio[];
  promedioCalificacion: number | null;
  cantidadCalificaciones: number | null;
  comentarioDestacado: FeedbackDestacadoDto | null;
};

/**
 * Día entero cerrado (feriado, cierre puntual) — sin rangos ni horarios
 * parciales. Sub-recurso propio (`/establecimientos/{id}/dias-no-laborables`),
 * igual que las fotos: no viene embebido en `EstablecimientoResponse`.
 * No hay editar: para cambiar uno se borra y se crea de nuevo.
 */
export type DiaNoLaborableRequest = {
  /** ISO "YYYY-MM-DD". Obligatoria y no puede ser pasada (@FutureOrPresent). */
  fecha: string;
  /** Máx. 255 caracteres. */
  motivo?: string;
};

export type DiaNoLaborableResponse = {
  id: number;
  fecha: string;
  motivo: string | null;
};

/**
 * Política de cancelación del establecimiento. Sub-recurso propio
 * (`/establecimientos/{id}/politicas-cancelacion`), no viene embebida en
 * `EstablecimientoResponse`. No hay "crear": siempre existe (default 24h /
 * 30min), solo se lee y se actualiza.
 */
export type PoliticaCancelacionResponse = {
  /** Horas de anticipación mínimas para que un jugador pueda cancelar. 0-168. */
  horasCancelacionAntesPartido: number;
  /** Minutos de gracia tras crear la reserva en los que se puede cancelar libremente. 0-1440. */
  minutosGraciaCancelacion: number;
  /** null en el GET; en la respuesta del PATCH, cuántas reservas futuras (CONFIRMADA/PENDIENTE_SENA) quedan bajo la nueva política. */
  reservasFuturasAfectadas: number | null;
};

export type ActualizarPoliticaCancelacionRequest = {
  horasCancelacionAntesPartido: number;
  minutosGraciaCancelacion: number;
};
