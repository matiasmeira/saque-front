/**
 * Zona E — kiosco de caja (/caja/*) y su gestión desde C9
 * (Configuración → Dispositivos). El link de emparejamiento se genera
 * en C9 (@/lib/sesion-caja, generarTokenEmparejamiento) y se consume
 * acá abajo — junto con estos 3 tokens fijos, que existen solo para
 * poder probar los 3 estados del link sin tener que generar uno cada
 * vez.
 *
 * TODO backend: los tokens de emparejamiento (generación, expiración,
 * marcar como usado), el listado de dispositivos y la revocación
 * vienen de la API.
 */
export type EstadoToken = "valido" | "vencido" | "usado";

export const TOKENS_EMPAREJAMIENTO: { token: string; estado: EstadoToken }[] = [
  { token: "vinculo-valido", estado: "valido" },
  { token: "vinculo-vencido", estado: "vencido" },
  { token: "vinculo-usado", estado: "usado" },
];

export function estadoDeToken(token: string): EstadoToken | "desconocido" {
  return TOKENS_EMPAREJAMIENTO.find((t) => t.token === token)?.estado ?? "desconocido";
}

/**
 * Un dispositivo emparejado, tal como lo ve el dueño en C9. "Este
 * dispositivo" (el navegador que está usando ahora mismo, si está
 * emparejado) se arma en vivo a partir de @/lib/sesion-caja, no
 * vive acá — esta lista es solo la "otra" caja de ejemplo, para que
 * la pantalla no se vea vacía con una sola fila.
 */
export type Dispositivo = {
  id: string;
  nombre: string;
  fechaEmparejamiento: string;
  fechaUltimoUso: string;
};

export const PANEL_DISPOSITIVOS_MOCK: Dispositivo[] = [{ id: "disp-bar", nombre: "Bar", fechaEmparejamiento: "2026-06-10", fechaUltimoUso: "2026-07-30" }];

/** Intentos de PIN seguidos antes de bloquear la caja por un rato — simula el rate limit del backend. */
export const MAX_INTENTOS_PIN = 5;

/** Segundos de bloqueo simulado tras superar MAX_INTENTOS_PIN — el backend real define su propia ventana. */
export const BLOQUEO_PIN_SEGUNDOS = 20;
