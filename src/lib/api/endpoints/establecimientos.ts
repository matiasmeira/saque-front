import { apiFetch, subirArchivo } from "../cliente";
import { construirQuery } from "../query";
import type { EstadoVerificacionEstablecimiento, Page } from "../tipos/comunes";
import type { DisponibilidadEstablecimientoResponse } from "../tipos/disponibilidad";
import type {
  ActualizarPoliticaCancelacionRequest,
  CambiarEstadoEstablecimientoRequest,
  CambiarEstadoEstablecimientoResponse,
  DiaNoLaborableRequest,
  DiaNoLaborableResponse,
  EstablecimientoAdminItem,
  EstablecimientoRequest,
  EstablecimientoResponse,
  FotoEstablecimiento,
  PoliticaCancelacionResponse,
  PrevisualizacionEstablecimientoResponse,
  RechazarEstablecimientoRequest,
  SolicitarVerificacionRequest,
  SolicitarVerificacionResponse,
} from "../tipos/establecimientos";

/** EstablecimientoController — base /api/v1/establecimientos. OWNER / ADMIN. */
export const establecimientos = {
  /**
   * Los establecimientos del dueño autenticado. Es tambien la via por la que el
   * front obtiene el establecimientoId de un OWNER: /me lo devuelve null para
   * ese rol (solo lo completa para EMPLOYEE).
   *
   * No existe GET /api/v1/establecimientos/{id}.
   */
  mios: () => apiFetch<EstablecimientoResponse[]>("/api/v1/establecimientos"),

  crear: (body: EstablecimientoRequest) =>
    apiFetch<EstablecimientoResponse>("/api/v1/establecimientos", {
      method: "POST",
      body,
    }),

  actualizar: (id: number, body: EstablecimientoRequest) =>
    apiFetch<EstablecimientoResponse>(`/api/v1/establecimientos/${id}`, {
      method: "PUT",
      body,
    }),

  /**
   * Solicita (o resolicita, si el estado actual es RECHAZADO) la verificación
   * manual. Sólo OWNER (ni ADMIN ni EMPLOYEE — ver el controller del backend).
   * La respuesta es sólo una confirmación de que quedó en cola: releer el
   * establecimiento real desde `mios()`, no tipar el estado a partir de esto.
   */
  solicitarVerificacion: (id: number, body: SolicitarVerificacionRequest) =>
    apiFetch<SolicitarVerificacionResponse>(`/api/v1/establecimientos/${id}/solicitar-verificacion`, {
      method: "POST",
      body,
    }),

  /**
   * Grilla de horarios libres del establecimiento. La versión de adentro del
   * panel del gemelo público `/publico/complejos/{slug}/disponibilidad`: acepta
   * PLAYER, OWNER, ADMIN y EMPLOYEE.
   *
   * Ya viene cruzada contra horarios de atención, días no laborables, bloqueos
   * y reservas, y sin los slots que ya pasaron — es la fuente para ofrecer un
   * horario al cargar un turno a mano, no una cuenta que haga el front.
   *
   * `fecha` es obligatoria; con `fechaFin` devuelve el rango (máximo 31 días).
   */
  disponibilidad: (estId: number, fecha: string, fechaFin?: string) =>
    apiFetch<DisponibilidadEstablecimientoResponse>(
      `/api/v1/establecimientos/${estId}/disponibilidad${construirQuery({ fecha, fechaFin })}`,
    ),

  /** Sub-recurso propio: NO viene embebido en `EstablecimientoResponse`. */
  listarFotos: (estId: number) =>
    apiFetch<FotoEstablecimiento[]>(`/api/v1/establecimientos/${estId}/fotos`),

  subirFoto: (estId: number, archivo: File, onProgress?: (fraccion: number) => void) =>
    subirArchivo<FotoEstablecimiento>(`/api/v1/establecimientos/${estId}/fotos`, archivo, {
      campo: "archivo",
      onProgress,
    }),

  borrarFoto: (estId: number, fileId: string) =>
    apiFetch<void>(`/api/v1/establecimientos/${estId}/fotos/${fileId}`, { method: "DELETE" }),

  /** El nuevo orden completo de fileIds. El primero queda como foto principal. */
  ordenarFotos: (estId: number, fileIds: string[]) =>
    apiFetch<FotoEstablecimiento[]>(`/api/v1/establecimientos/${estId}/fotos/orden`, {
      method: "PUT",
      body: { fileIds },
    }),

  /** Sub-recurso propio, igual que las fotos. Sin editar: se borra y se crea de nuevo. */
  listarDiasNoLaborables: (estId: number) =>
    apiFetch<DiaNoLaborableResponse[]>(`/api/v1/establecimientos/${estId}/dias-no-laborables`),

  crearDiaNoLaborable: (estId: number, body: DiaNoLaborableRequest) =>
    apiFetch<DiaNoLaborableResponse>(`/api/v1/establecimientos/${estId}/dias-no-laborables`, {
      method: "POST",
      body,
    }),

  eliminarDiaNoLaborable: (estId: number, id: number) =>
    apiFetch<void>(`/api/v1/establecimientos/${estId}/dias-no-laborables/${id}`, { method: "DELETE" }),

  /** Sub-recurso propio, igual que fotos y días no laborables. Sin "crear": siempre existe. */
  obtenerPoliticaCancelacion: (estId: number) =>
    apiFetch<PoliticaCancelacionResponse>(`/api/v1/establecimientos/${estId}/politicas-cancelacion`),

  /** PATCH real: manda siempre los dos campos, así que la semántica "null = no modificar" del back no aplica acá. */
  actualizarPoliticaCancelacion: (estId: number, body: ActualizarPoliticaCancelacionRequest) =>
    apiFetch<PoliticaCancelacionResponse>(`/api/v1/establecimientos/${estId}/politicas-cancelacion`, {
      method: "PATCH",
      body,
    }),

  /**
   * La ficha como la vería el público, aunque el establecimiento todavía no
   * esté VERIFICADO ni isActive (por eso es por `id` y no por `slug`: uno no
   * verificado puede no tener slug público todavía). NO devuelve el mismo
   * shape que `publico.detalle`: viene envuelto en `detalle`, junto con
   * `estadoVerificacion` y la marca `previsualizacion` (ver
   * PrevisualizacionEstablecimientoResponse). Confirmado contra el backend.
   */
  previsualizacion: (estId: number) =>
    apiFetch<PrevisualizacionEstablecimientoResponse>(`/api/v1/establecimientos/${estId}/previsualizacion`),

  /**
   * Deshabilita o rehabilita el complejo. NO toca estadoVerificacion (son dos
   * ejes independientes) ni libera cupo del límite de 3 -- para eso hay que
   * eliminar. La respuesta informa `reservasFuturasConfirmadas`: lo que sigue
   * vigente después del cambio, compromisos que el dueño ya asumió con
   * jugadores y tiene que seguir cumpliendo aunque deje de recibir reservas
   * nuevas.
   */
  cambiarEstado: (estId: number, body: CambiarEstadoEstablecimientoRequest) =>
    apiFetch<CambiarEstadoEstablecimientoResponse>(`/api/v1/establecimientos/${estId}/estado`, {
      method: "PATCH",
      body,
    }),

  /**
   * Baja definitiva. 204 sin body. Dos precondiciones, ambas 400 con un
   * mensaje del backend que ya trae todo lo necesario (cantidad y fecha de
   * las reservas futuras, en el segundo caso) -- mostrarlo tal cual con
   * `mensajeVisible`, no reconstruirlo acá. Libera el slug y el cupo del
   * límite de 3; es irreversible, no hay endpoint de restauración.
   */
  eliminar: (estId: number) => apiFetch<void>(`/api/v1/establecimientos/${estId}`, { method: "DELETE" }),
};

/**
 * AdminEstablecimientoController — /api/v1/admin/establecimientos. Rol ADMIN.
 *
 * Moderación de altas: un establecimiento nace PENDIENTE y no aparece en el
 * buscador ni acepta reservas hasta que un admin lo verifica. Sólo se puede
 * verificar o rechazar desde EN_REVISION, cualquier otra transición es 400.
 */
export const adminEstablecimientos = {
  listar: (
    { estadoVerificacion, page = 0, size = 20 }: {
      estadoVerificacion?: EstadoVerificacionEstablecimiento;
      page?: number;
      size?: number;
    } = {},
  ) =>
    apiFetch<Page<EstablecimientoAdminItem>>(
      `/api/v1/admin/establecimientos${construirQuery({ estadoVerificacion, page, size })}`,
    ),

  /**
   * Arranca el trial de 1 mes del dueño si todavía no lo tenía. No es
   * reversible desde la UI. El body de respuesta no está confirmado contra
   * el backend — se tipa `void` y la pantalla refresca el listado por
   * invalidación en vez de confiar en lo que devuelva este POST.
   */
  verificar: (id: number) =>
    apiFetch<void>(`/api/v1/admin/establecimientos/${id}/verificar`, { method: "POST" }),

  /** El motivo lo lee el dueño en su panel. */
  rechazar: (id: number, body: RechazarEstablecimientoRequest) =>
    apiFetch<void>(`/api/v1/admin/establecimientos/${id}/rechazar`, { method: "POST", body }),
};
