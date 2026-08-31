/**
 * Localidades de Argentina, vía georef-ar-api (apis.datos.gob.ar), el servicio
 * de normalización geográfica del Estado. Es público, sin API key y responde
 * con `Access-Control-Allow-Origin: *`, así que se consume desde el browser.
 *
 * A propósito NO usa apiFetch: ese cliente resuelve la base URL de Canche,
 * adjunta el JWT y traduce las tres formas de error del backend propio. Nada
 * de eso aplica acá — es otro host y otro contrato.
 *
 * La ubicación es OPCIONAL en la búsqueda: sin lat/lng el backend devuelve
 * todos los complejos ordenados por calificación. Si este servicio no
 * responde, /buscar sigue funcionando; sólo se pierde el filtro por cercanía.
 */

const GEOREF_URL_LOCALIDADES = "https://apis.datos.gob.ar/georef/api/localidades";
const GEOREF_URL_DIRECCIONES = "https://apis.datos.gob.ar/georef/api/direcciones";

/** Tope de sugerencias del autocompletado. */
const MAX_RESULTADOS = 8;

export type Localidad = {
  id: string;
  nombre: string;
  provincia: string;
  /** Para desambiguar direcciones al geocodificar; ver geocodificarDireccion. */
  departamento: string;
  lat: number;
  lng: number;
};

type LocalidadCruda = {
  id: string;
  nombre: string;
  provincia: { nombre: string };
  departamento?: { nombre: string };
  centroide: { lat: number; lon: number };
};

/**
 * Aplana la respuesta de georef y deduplica.
 *
 * La API devuelve entidades de distinto nivel con el mismo nombre: buscando
 * "jose c paz" vuelven la localidad (id 0641201002) y el municipio
 * (id 06412010), con centroides que difieren en metros. Para el usuario son
 * la misma opción repetida, así que se conserva la primera de cada
 * nombre+provincia — la API ya las devuelve por relevancia.
 */
export function normalizarLocalidades(respuesta: unknown): Localidad[] {
  const crudas = (respuesta as { localidades?: LocalidadCruda[] } | null)?.localidades;
  if (!Array.isArray(crudas)) return [];

  const vistas = new Set<string>();
  const localidades: Localidad[] = [];

  for (const cruda of crudas) {
    const provincia = cruda.provincia?.nombre ?? "";
    const clave = `${cruda.nombre}|${provincia}`.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);

    localidades.push({
      id: cruda.id,
      nombre: cruda.nombre,
      provincia,
      departamento: cruda.departamento?.nombre ?? "",
      lat: cruda.centroide.lat,
      lng: cruda.centroide.lon,
    });
  }

  return localidades;
}

/**
 * Busca localidades por nombre. La API ignora acentos y mayúsculas, así que
 * "jose" encuentra "José" sin normalizar nada de este lado.
 */
export async function buscarLocalidades(
  nombre: string,
  signal?: AbortSignal,
): Promise<Localidad[]> {
  const termino = nombre.trim();
  if (termino === "") return [];

  const params = new URLSearchParams({
    nombre: termino,
    // Se piden más de los que se muestran porque la deduplicación descarta
    // los homónimos localidad/municipio.
    max: String(MAX_RESULTADOS * 2),
    campos: "id,nombre,provincia,departamento,centroide",
  });

  const respuesta = await fetch(`${GEOREF_URL_LOCALIDADES}?${params}`, { signal });
  if (!respuesta.ok) {
    throw new Error(`georef respondió ${respuesta.status}`);
  }

  return normalizarLocalidades(await respuesta.json()).slice(0, MAX_RESULTADOS);
}

export type DireccionGeocodificada = {
  lat: number;
  lng: number;
  /** Nomenclatura devuelta por georef, lista para mostrar. */
  etiqueta: string;
};

type DireccionCruda = {
  nomenclatura: string;
  ubicacion: { lat: number; lon: number };
};

/**
 * Toma la primera coincidencia de /direcciones. La API ya ordena por
 * relevancia, y acá sólo hace falta un punto para el mapa, no una lista.
 */
export function normalizarDireccion(respuesta: unknown): DireccionGeocodificada | null {
  const crudas = (respuesta as { direcciones?: DireccionCruda[] } | null)?.direcciones;
  const primera = crudas?.[0];
  if (!primera) return null;

  return {
    lat: primera.ubicacion.lat,
    lng: primera.ubicacion.lon,
    etiqueta: primera.nomenclatura,
  };
}

/**
 * Geocodifica una dirección a nivel de calle+altura. Sin `provincia` (y
 * `departamento`, si se tiene) el resultado es una ruleta: "Rivadavia 5000"
 * sin contexto devuelve la primera Rivadavia que encuentre en cualquier
 * provincia. `SelectorUbicacion` ya obliga a elegir una localidad, así que
 * ese contexto siempre está disponible antes de llamar a esto.
 *
 * Devuelve `null` cuando la calle no está en el nomenclador (direcciones
 * nuevas, countries, barrios cerrados) o si la request falla: quien llama
 * cae al centroide de la localidad en ese caso, nunca bloquea el guardado.
 */
export async function geocodificarDireccion(
  direccion: string,
  contexto: { provincia: string; departamento?: string },
  signal?: AbortSignal,
): Promise<DireccionGeocodificada | null> {
  const termino = direccion.trim();
  if (termino === "") return null;

  const params = new URLSearchParams({
    direccion: termino,
    provincia: contexto.provincia,
    max: "1",
  });
  if (contexto.departamento) params.set("departamento", contexto.departamento);

  try {
    const respuesta = await fetch(`${GEOREF_URL_DIRECCIONES}?${params}`, { signal });
    if (!respuesta.ok) return null;
    return normalizarDireccion(await respuesta.json());
  } catch {
    return null;
  }
}

/**
 * Ubicación actual del navegador. Se resuelve a coordenadas nada más: georef
 * tiene geocodificación inversa, pero para el listado alcanza con lat/lng y
 * evita una segunda llamada en el camino crítico.
 */
export function ubicacionActual(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Tu navegador no permite compartir la ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolve({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }),
      () => reject(new Error("No pudimos acceder a tu ubicación. Revisá los permisos.")),
      { timeout: 10_000 },
    );
  });
}
