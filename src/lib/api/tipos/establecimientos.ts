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
