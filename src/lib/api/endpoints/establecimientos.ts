import { apiFetch, subirArchivo } from "../cliente";
import { construirQuery } from "../query";
import type { DisponibilidadEstablecimientoResponse } from "../tipos/disponibilidad";
import type {
  EstablecimientoRequest,
  EstablecimientoResponse,
  FotoEstablecimiento,
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
};
