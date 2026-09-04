import type { Servicio } from "@/lib/api/tipos/comunes";

/**
 * Datos que entrega cada paso al confirmarlo. `fotos`/`montoSenaDefault` no
 * viajan en ningún DTO del backend — fotos se sube aparte por su propio
 * endpoint, montoSenaDefault es un valor local que solo sirve para prellenar
 * el formulario de cancha en el paso 4 (fuera del alcance de esta fase).
 */
export type DatosPasoIdentidad = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  servicios: Servicio[];
  fotos: File[];
};

export type DatosPasoPoliticas = {
  requiereSena: boolean;
  requiereTelefonoVerificado: boolean;
  montoSenaDefault: number;
  horasCancelacionAntesPartido: number;
  minutosGraciaCancelacion: number;
};

export type ErroresCampo = Record<string, string>;

const HORAS_CANCELACION_MAX = 168;
const MINUTOS_GRACIA_MAX = 1440;

/**
 * Mismo algoritmo que `SlugGenerator.normalizar` del backend
 * (sacaladelangulo/establecimiento/service/SlugGenerator.java): minúsculas,
 * sin diacríticos, todo lo no alfanumérico se colapsa en un guión, sin
 * guiones al borde. El backend es quien genera el slug real (con sufijo si
 * hay colisión) — esto es sólo un preview, nunca se manda al servidor.
 */
export function calcularSlugPreview(nombre: string): string {
  const descompuesto = nombre.toLowerCase().normalize("NFD");
  const sinDiacriticos = descompuesto.replace(/[̀-ͯ]/g, "");
  const conGuiones = sinDiacriticos.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return conGuiones === "" ? "complejo" : conGuiones;
}

export function validarPasoIdentidad(datos: {
  nombre: string;
  direccion: string;
  coords: { lat: number; lng: number } | null;
}): ErroresCampo {
  const errores: ErroresCampo = {};
  if (!datos.nombre.trim()) errores.nombre = "Falta el nombre del complejo.";
  if (!datos.direccion.trim()) errores.direccion = "Falta la dirección.";
  if (!datos.coords) errores.ubicacion = "Elegí una localidad para ubicar el complejo.";
  return errores;
}

export function validarPasoPoliticas(datos: {
  horasCancelacionAntesPartido: number;
  minutosGraciaCancelacion: number;
  montoSenaDefault: number;
}): ErroresCampo {
  const errores: ErroresCampo = {};
  if (
    !Number.isInteger(datos.horasCancelacionAntesPartido) ||
    datos.horasCancelacionAntesPartido < 0 ||
    datos.horasCancelacionAntesPartido > HORAS_CANCELACION_MAX
  ) {
    errores.horasCancelacionAntesPartido = `Tiene que ser un número entero entre 0 y ${HORAS_CANCELACION_MAX}.`;
  }
  if (
    !Number.isInteger(datos.minutosGraciaCancelacion) ||
    datos.minutosGraciaCancelacion < 0 ||
    datos.minutosGraciaCancelacion > MINUTOS_GRACIA_MAX
  ) {
    errores.minutosGraciaCancelacion = `Tiene que ser un número entero entre 0 y ${MINUTOS_GRACIA_MAX}.`;
  }
  if (!Number.isInteger(datos.montoSenaDefault) || datos.montoSenaDefault < 0) {
    errores.montoSenaDefault = "Tiene que ser un número entero mayor o igual a 0.";
  }
  return errores;
}
