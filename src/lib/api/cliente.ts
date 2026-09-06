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
 *
 * La unica excepcion es `subirArchivo`, mas abajo: fetch() no da progreso de
 * subida de forma confiable entre navegadores, asi que esa usa XMLHttpRequest.
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
   * Clave de idempotencia. **Obligatoria** en los POST que mueven plata:
   * /reservas, /reservas/manual, /turnos-fijos y /buffet/ventas. Sin ella
   * el back responde 400 sin ejecutar nada — dejó de ser opt-in, porque
   * mientras lo fue un cliente que se olvidaba de mandarla no tenía ninguna
   * protección contra el doble submit.
   *
   * Opcional (el back la respeta pero no la exige) en POST
   * /establecimientos/{id}/fotos: repetir una subida deja un archivo de más,
   * no un cobro de más.
   */
  idempotencyKey?: string;
  signal?: AbortSignal;
  /**
   * `false` cuando un 401 de ESTE endpoint no significa sesión muerta. Hoy
   * sólo lo usa DELETE /usuarios/me: ahí un 401 es "contraseña incorrecta",
   * y borrar el token de golpe expulsaría al usuario a /ingresar antes de
   * que llegue a ver el mensaje de error.
   */
  borrarTokenEn401?: boolean;
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
    borrarTokenEn401 = true,
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
    if (respuesta.status === 401 && borrarTokenEn401) borrarToken();

    throw parsearError(respuesta.status, cuerpo);
  }

  // 204 No Content (logout, DELETE) y 202 Accepted (envio de ofertas) no traen body.
  if (respuesta.status === 204 || respuesta.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await leerCuerpo(respuesta)) as T;
}

function leerCuerpoXhr(xhr: XMLHttpRequest): unknown {
  const contenido = xhr.getResponseHeader("content-type") ?? "";
  if (!contenido.includes("application/json")) return xhr.responseText || null;
  try {
    return xhr.responseText ? JSON.parse(xhr.responseText) : null;
  } catch {
    return null;
  }
}

/**
 * POST multipart de un solo archivo, con progreso de subida. No pasa por
 * `apiFetch`: ver el comentario del bloque de arriba.
 *
 * No fija Content-Type a mano: el browser arma el boundary del
 * multipart/form-data solo al mandar un FormData, y pisarlo lo rompe.
 */
export function subirArchivo<T>(
  ruta: string,
  archivo: File,
  opciones: { campo?: string; onProgress?: (fraccion: number) => void } = {},
): Promise<T> {
  const { campo = "file", onProgress } = opciones;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${ruta}`);

    const token = leerToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };

    xhr.onload = () => {
      const cuerpo = leerCuerpoXhr(xhr);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(cuerpo as T);
        return;
      }
      if (xhr.status === 401) borrarToken();
      reject(parsearError(xhr.status, cuerpo));
    };

    xhr.onerror = () => reject(new ApiError({ status: 0, mensaje: "No pudimos conectar con el servidor." }));

    const formData = new FormData();
    formData.append(campo, archivo);
    xhr.send(formData);
  });
}

/** Clave de idempotencia para los POST que el back protege. */
export function nuevaIdempotencyKey(): string {
  return crypto.randomUUID();
}

export { ApiError };
