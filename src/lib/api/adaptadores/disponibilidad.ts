import type { DisponibilidadEstablecimientoResponse } from "@/lib/api/tipos/disponibilidad";

/**
 * GET /establecimientos/{id}/disponibilidad (panel) devuelve el mismo shape que
 * GET /publico/complejos/{slug}/disponibilidad, salvo `ocupadaPorPool`: viene
 * poblado cuando el usuario tiene acceso operativo de panel, y `null` en el
 * público (para no exponer la ocupación interna del complejo).
 *
 * Para que la previsualización se vea EXACTAMENTE igual que la ficha pública,
 * la respuesta del panel hay que sanitizarla a esta forma. Esto vive en el
 * `select` de useQuery de quien lo llama, no en el queryFn: la key del panel
 * (["disponibilidad", estId, fecha]) es la misma que usa la agenda, y pisarle
 * la caché con ocupadaPorPool en null rompería la agenda.
 */
export function aDisponibilidadPublica(
  data: DisponibilidadEstablecimientoResponse,
): DisponibilidadEstablecimientoResponse {
  return {
    ...data,
    dias: data.dias.map((dia) => ({
      ...dia,
      canchas: dia.canchas.map((cancha) => ({ ...cancha, ocupadaPorPool: null })),
    })),
  };
}
