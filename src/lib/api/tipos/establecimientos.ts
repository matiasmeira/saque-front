import type {
  EstadoVerificacionEstablecimiento,
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
 *
 * `estadoVerificacion`/`cuit`/`razonSocial`/`telefonoContacto`/`urlRedSocial`/
 * `motivoRechazo` son la cara del propio dueño (ver EstablecimientoVerificacionService
 * en el backend): los últimos 5 son `null` hasta que el dueño solicita la
 * verificación por primera vez.
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
  estadoVerificacion: EstadoVerificacionEstablecimiento;
  cuit: string | null;
  razonSocial: string | null;
  telefonoContacto: string | null;
  urlRedSocial: string | null;
  motivoRechazo: string | null;
};

/**
 * Body de POST /establecimientos/{id}/solicitar-verificacion. Los 4 campos son
 * obligatorios (@NotBlank en el backend); el CUIT se manda con guiones si el
 * dueño los tipeó — el backend normaliza. La URL debe ser de Instagram o
 * Facebook (el backend valida el host, no duplicar esa validación acá).
 */
export type SolicitarVerificacionRequest = {
  cuit: string;
  razonSocial: string;
  telefonoContacto: string;
  urlRedSocial: string;
};

/**
 * Respuesta del POST: sólo confirma que la solicitud quedó en cola. NO trae
 * motivoRechazo ni los datos de contacto — para eso hay que releer
 * `establecimientos.mios()` (que ya vuelve a exponer todo, incluido lo que
 * se acaba de guardar). No tipar el estado del establecimiento a partir de
 * este body.
 */
export type SolicitarVerificacionResponse = {
  id: number;
  estadoVerificacion: EstadoVerificacionEstablecimiento;
  fechaSolicitudVerificacion: string;
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

// ---------------------------------------------------------------------------
// AdminEstablecimientoController — moderación de altas (rol ADMIN)
// ---------------------------------------------------------------------------

/**
 * Item del listado de moderación (`GET /api/v1/admin/establecimientos`).
 * Espeja `AdminEstablecimientoResponse` — el dueño viaja plano
 * (`duenoId`/`duenoNombre`/`duenoEmail`), no anidado.
 *
 * cuit/razonSocial/telefonoContacto/urlRedSocial son `| null` porque un
 * establecimiento PENDIENTE (el dueño todavía no solicitó verificación)
 * no los tiene cargados.
 */
export type EstablecimientoAdminItem = {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estadoVerificacion: EstadoVerificacionEstablecimiento;
  cuit: string | null;
  razonSocial: string | null;
  telefonoContacto: string | null;
  urlRedSocial: string | null;
  /** LocalDateTime ISO del backend, con hora. */
  fechaSolicitudVerificacion: string | null;
  /** LocalDateTime ISO. La setea únicamente `verificar` — en RECHAZADO viene null. */
  fechaVerificacion: string | null;
  motivoRechazo: string | null;
  duenoId: number;
  duenoNombre: string;
  duenoEmail: string;
};

export type RechazarEstablecimientoRequest = {
  motivo: string;
};
