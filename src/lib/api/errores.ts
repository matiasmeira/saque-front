/**
 * Error normalizado de la API. El backend devuelve tres formas de error
 * incompatibles entre si (ver PLAN_CONEXION.md seccion 2.5); este tipo las
 * colapsa en una sola para que la UI no tenga que distinguirlas.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly mensaje: string;
  readonly camposInvalidos?: Record<string, string>;
  readonly detalle?: string;

  constructor(init: {
    status: number;
    mensaje: string;
    camposInvalidos?: Record<string, string>;
    detalle?: string;
  }) {
    super(init.mensaje);
    this.name = "ApiError";
    this.status = init.status;
    this.mensaje = init.mensaje;
    this.camposInvalidos = init.camposInvalidos;
    this.detalle = init.detalle;
  }
}

/**
 * Mensaje para mostrarle al usuario.
 *
 * En un error de bean validation el mensaje comun es generico ("Revisá los
 * datos ingresados") pero el back mando algo mucho mas util por campo, del
 * estilo `{"codigo": "El código es obligatorio"}`. Cuando hay un solo campo
 * invalido conviene mostrar ese texto; con varios, el generico y que cada
 * input resalte lo suyo con `camposInvalidos`.
 */
export function mensajeVisible(error: ApiError): string {
  const campos = error.camposInvalidos;
  if (!campos) return error.mensaje;

  const mensajes = Object.values(campos);
  return mensajes.length === 1 ? mensajes[0] : error.mensaje;
}

/**
 * Detecta el 403/409 de "el complejo exige teléfono verificado y el jugador
 * no lo tiene", para poder mostrar un aviso accionable en vez del mensaje
 * genérico del backend.
 *
 * HEURÍSTICO: el backend no manda un código de error propio para este caso,
 * sólo status + un mensaje de texto libre — igual que "el jugador está
 * bloqueado en el establecimiento", que también es un 403 (ver
 * reservas.crear). Matchea por contenido del mensaje (("telefono" o
 * "celular") + "verifi") hasta que el backend exponga algo distinguible; si
 * el texto del mensaje cambia del lado del backend, esto deja de detectarlo
 * silenciosamente y el jugador vuelve a ver el mensaje genérico en vez del
 * aviso amigable.
 */
export function esErrorTelefonoNoVerificado(error: ApiError): boolean {
  if (error.status !== 403 && error.status !== 409) return false;
  const mensaje = error.mensaje.toLowerCase();
  return /tel[eé]fono|celular/.test(mensaje) && /verifi/.test(mensaje);
}

/**
 * Mensajes de ultimo recurso cuando el body no trae uno usable (5xx detras de
 * un proxy, respuesta vacia, HTML de error de infraestructura).
 */
function mensajePorStatus(status: number): string {
  if (status === 401) return "Tu sesión expiró. Ingresá de nuevo.";
  if (status === 403) return "No tenés permiso para hacer esto.";
  if (status === 404) return "No encontramos lo que buscabas.";
  if (status === 429) return "Demasiados intentos. Esperá unos minutos.";
  if (status >= 500) return "Ocurrió un error en el servidor. Intentá de nuevo.";
  return "No pudimos completar la operación.";
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Normaliza las tres formas de error del backend:
 *
 *  A. `{ "error": "mensaje" }`                       — la mayoria de los casos
 *  B. `{ "campo": "mensaje", ... }`                  — bean validation, SIN clave `error`
 *  C. `{ "error": "titulo", "message": "detalle" }`  — conflictos 409
 *
 * Un body que no sea objeto plano (null, string, array) cae al mensaje por status:
 * tratarlo como mapa de campos convertiria un string en {0:"<",1:"h",...}.
 */
export function parsearError(status: number, body: unknown): ApiError {
  if (!esObjetoPlano(body)) {
    return new ApiError({ status, mensaje: mensajePorStatus(status) });
  }

  if (typeof body.error === "string") {
    return new ApiError({
      status,
      mensaje: body.error,
      detalle: typeof body.message === "string" ? body.message : undefined,
    });
  }

  const camposInvalidos = Object.fromEntries(
    Object.entries(body).filter(
      (entrada): entrada is [string, string] => typeof entrada[1] === "string",
    ),
  );

  if (Object.keys(camposInvalidos).length === 0) {
    return new ApiError({ status, mensaje: mensajePorStatus(status) });
  }

  return new ApiError({
    status,
    mensaje: "Revisá los datos ingresados.",
    camposInvalidos,
  });
}
