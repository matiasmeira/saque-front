import type { Servicio, HorarioAtencionDto } from "@/lib/api/tipos/comunes";
import type { DiaSemanaBack } from "@/lib/api/fechas";
import type { CanchaResponse } from "@/lib/api/tipos/canchas";

/**
 * Datos que entrega cada paso al confirmarlo. `fotos`/`montoSenaDefault` no
 * viajan en ningún DTO del backend — fotos se sube aparte por su propio
 * endpoint, montoSenaDefault es un valor local que se usa para prellenar el
 * campo de seña de `FormCancha` al crear una cancha nueva en el paso 4.
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

/**
 * Paso 4 — Canchas. No hay llamada al backend al confirmar: cada cancha ya se
 * creó individualmente al agregarla (ver useWizardOnboarding). Esto sólo
 * valida que haya al menos una, y — si el plan fuerza seña — que al menos una
 * cobre algo, igual que exige CanchaService.validarMontoSena en el backend.
 */
export function validarPasoCanchas(canchas: CanchaResponse[], requiereSena: boolean): ErroresCampo {
  const errores: ErroresCampo = {};
  if (canchas.length === 0) {
    errores.canchas = "Cargá al menos una cancha para continuar.";
    return errores;
  }
  if (requiereSena && !canchas.some((c) => (c.montoSena ?? 0) > 0)) {
    errores.sena = "Con seña obligatoria, al menos una cancha necesita un monto de seña mayor a 0.";
  }
  return errores;
}

/**
 * Paso 3 — Horarios. Los 3 radios de patrón rápido que Stitch mockeó y
 * `FormHorariosAtencion` no tiene: son sólo una PRE-CARGA del valor inicial
 * con el que ese formulario arranca (se remonta vía `key={patron}` — ver
 * PasoHorarios) — la validación y el guardado se heredan sin tocarlos, así
 * que nada impide seguir editando una fila suelta después de elegir un
 * patrón.
 */
export type PatronHorario = "mismo" | "semana-finde" | "dia-por-dia";

const DEFAULT_APERTURA = "09:00:00";
const DEFAULT_CIERRE = "23:00:00";
const DEFAULT_APERTURA_FINDE = "10:00:00";
const DEFAULT_CIERRE_FINDE = "20:00:00";

const DIAS_SEMANA_BACK: DiaSemanaBack[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DIAS_FINDE_BACK: DiaSemanaBack[] = ["SATURDAY", "SUNDAY"];

export function horariosDelPatron(patron: PatronHorario, base: HorarioAtencionDto[]): HorarioAtencionDto[] {
  if (patron === "dia-por-dia") return base;

  const referencia = base[0] ?? { horaApertura: DEFAULT_APERTURA, horaCierre: DEFAULT_CIERRE };

  if (patron === "mismo") {
    return DIAS_SEMANA_BACK.map((diaSemana) => ({
      diaSemana,
      horaApertura: referencia.horaApertura,
      horaCierre: referencia.horaCierre,
    }));
  }

  return DIAS_SEMANA_BACK.map((diaSemana) => {
    const esFinde = DIAS_FINDE_BACK.includes(diaSemana);
    return {
      diaSemana,
      horaApertura: esFinde ? DEFAULT_APERTURA_FINDE : referencia.horaApertura,
      horaCierre: esFinde ? DEFAULT_CIERRE_FINDE : referencia.horaCierre,
    };
  });
}
