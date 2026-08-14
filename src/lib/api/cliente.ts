import { API_URL } from "./config";
import { ApiError, parsearError } from "./errores";
import { borrarToken, leerToken } from "./sesion";

/**
 * La UNICA funcion del proyecto que llama a fetch().
 *
 * Responsabilidades, y solo estas:
 *   1. Resolver la URL base.
 *   2. Adjuntar el JWT cuando corresponde.
 *   3. Traducir cualquier respuesta no-2xx a ApiError (las 3 formas del back).
 *   4. Limpiar la sesion ante un 401.
 *   5. Mandar la cookie de dispositivo en las rutas de caja.
 *   6. Adjuntar Idempotency-Key cuando se pide.
 *
 * NO hace cache, ni reintentos, ni deduplicacion: eso es de TanStack Query.
 */

export type OpcionesRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * `false` para endpoints publicos (/api/v1/publico/**) y de auth. Mandar un
   * Authorization vencido a un endpoint publico lo haria fallar sin necesidad.
   */
  conAuth?: boolean;
  /**
   * Manda la cookie `saque_caja_device`. Solo para las rutas de caja que la
   * exigen. Es HttpOnly + SameSite=None + Secure: requiere HTTPS.
   */
  conCookieDispositivo?: boolean;
  /**
   * Clave de idempotencia. El back solo la respeta en POST a /reservas,
   * /reservas/manual, /reservas/semanal y /buffet/ventas.
   */
  idempotencyKey?: string;
  signal?: AbortSignal;
};

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const contenido = respuesta.headers.get("content-type") ?? "";
  if (!contenido.includes("application/json")) {
    const texto = await respuesta.text().catch(() => "");
    return texto === "" ? null : texto;
  }
  return respuesta.json().catch(() => null);
}

export async function apiFetch<T>(
  ruta: string,
  opciones: OpcionesRequest = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    conAuth = true,
    conCookieDispositivo = false,
    idempotencyKey,
    signal,
  } = opciones;

  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (conAuth) {
    const token = leerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: conCookieDispositivo ? "include" : "same-origin",
    signal,
  });

  if (!respuesta.ok) {
    const cuerpo = await leerCuerpo(respuesta);

    // El back invalida todos los JWT del usuario via tokenVersion. Un 401 es
    // sesion muerta: se limpia para que los guards del front reaccionen.
    if (respuesta.status === 401) borrarToken();

    throw parsearError(respuesta.status, cuerpo);
  }

  // 204 No Content (logout, DELETE) y 202 Accepted (envio de ofertas) no traen body.
  if (respuesta.status === 204 || respuesta.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await leerCuerpo(respuesta)) as T;
}

/** Clave de idempotencia para los POST que el back protege. */
export function nuevaIdempotencyKey(): string {
  return crypto.randomUUID();
}

export { ApiError };
