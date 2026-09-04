import { describe, expect, it } from "vitest";

import { calcularSlugPreview, validarPasoIdentidad, validarPasoPoliticas, validarPasoCanchas, horariosDelPatron } from "./wizard-onboarding";
import type { CanchaResponse } from "@/lib/api/tipos/canchas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

describe("calcularSlugPreview", () => {
  it("pasa a minúsculas y separa por guiones", () => {
    expect(calcularSlugPreview("Club Atlético Pilar")).toBe("club-atletico-pilar");
  });

  it("saca acentos y diéresis", () => {
    expect(calcularSlugPreview("Ñandú Fútbol Club")).toBe("nandu-futbol-club");
  });

  it("colapsa símbolos y espacios repetidos en un solo guión", () => {
    expect(calcularSlugPreview("El  Súper   Complejo!!")).toBe("el-super-complejo");
  });

  it("saca guiones al principio y al final", () => {
    expect(calcularSlugPreview("  -Pilar-  ")).toBe("pilar");
  });

  it("un nombre vacío o sin caracteres alfanuméricos cae a 'complejo'", () => {
    expect(calcularSlugPreview("")).toBe("complejo");
    expect(calcularSlugPreview("   ")).toBe("complejo");
    expect(calcularSlugPreview("###")).toBe("complejo");
  });
});

describe("validarPasoIdentidad", () => {
  const base = { nombre: "Club Pilar", direccion: "Falsa 123", coords: { lat: -34.1, lng: -58.9 } };

  it("sin errores cuando todo está completo", () => {
    expect(validarPasoIdentidad(base)).toEqual({});
  });

  it("nombre vacío o solo espacios", () => {
    expect(validarPasoIdentidad({ ...base, nombre: "  " })).toEqual({
      nombre: "Falta el nombre del complejo.",
    });
  });

  it("dirección vacía", () => {
    expect(validarPasoIdentidad({ ...base, direccion: "" })).toEqual({
      direccion: "Falta la dirección.",
    });
  });

  it("sin ubicación resuelta", () => {
    expect(validarPasoIdentidad({ ...base, coords: null })).toEqual({
      ubicacion: "Elegí una localidad para ubicar el complejo.",
    });
  });

  it("acumula varios errores a la vez", () => {
    expect(validarPasoIdentidad({ nombre: "", direccion: "", coords: null })).toEqual({
      nombre: "Falta el nombre del complejo.",
      direccion: "Falta la dirección.",
      ubicacion: "Elegí una localidad para ubicar el complejo.",
    });
  });
});

describe("validarPasoPoliticas", () => {
  const base = { horasCancelacionAntesPartido: 24, minutosGraciaCancelacion: 30, montoSenaDefault: 0 };

  it("sin errores con los valores por defecto", () => {
    expect(validarPasoPoliticas(base)).toEqual({});
  });

  it("horas negativas o por encima de 168", () => {
    expect(validarPasoPoliticas({ ...base, horasCancelacionAntesPartido: -1 }).horasCancelacionAntesPartido).toBe(
      "Tiene que ser un número entero entre 0 y 168.",
    );
    expect(validarPasoPoliticas({ ...base, horasCancelacionAntesPartido: 169 }).horasCancelacionAntesPartido).toBe(
      "Tiene que ser un número entero entre 0 y 168.",
    );
  });

  it("minutos negativos o por encima de 1440", () => {
    expect(validarPasoPoliticas({ ...base, minutosGraciaCancelacion: -1 }).minutosGraciaCancelacion).toBe(
      "Tiene que ser un número entero entre 0 y 1440.",
    );
    expect(validarPasoPoliticas({ ...base, minutosGraciaCancelacion: 1441 }).minutosGraciaCancelacion).toBe(
      "Tiene que ser un número entero entre 0 y 1440.",
    );
  });

  it("monto de seña por defecto negativo", () => {
    expect(validarPasoPoliticas({ ...base, montoSenaDefault: -100 }).montoSenaDefault).toBe(
      "Tiene que ser un número entero mayor o igual a 0.",
    );
  });
});

describe("validarPasoCanchas", () => {
  const cancha = (montoSena: number | null): CanchaResponse => ({
    id: 1,
    nombre: "Cancha 1",
    deportes: ["PADEL"],
    isActive: true,
    establecimientoId: 1,
    precioBase: 1000,
    montoSena,
    duracionesPermitidas: [60],
    preciosPorDuracion: { "60": 1000 },
    permiteInicioMediaHora: false,
    tarifas: [],
    canchasFisicasIds: [],
    cantidadCanchasNecesarias: null,
  });

  it("sin canchas, siempre falla sin importar la seña", () => {
    expect(validarPasoCanchas([], false)).toEqual({
      canchas: "Cargá al menos una cancha para continuar.",
    });
    expect(validarPasoCanchas([], true)).toEqual({
      canchas: "Cargá al menos una cancha para continuar.",
    });
  });

  it("con canchas y sin seña obligatoria, no hace falta monto de seña", () => {
    expect(validarPasoCanchas([cancha(0)], false)).toEqual({});
  });

  it("con seña obligatoria, exige al menos una cancha con montoSena > 0", () => {
    expect(validarPasoCanchas([cancha(0), cancha(null)], true)).toEqual({
      sena: "Con seña obligatoria, al menos una cancha necesita un monto de seña mayor a 0.",
    });
  });

  it("con seña obligatoria y alguna cancha con seña > 0, no hay error", () => {
    expect(validarPasoCanchas([cancha(0), cancha(1500)], true)).toEqual({});
  });
});

describe("horariosDelPatron", () => {
  const base: HorarioAtencionDto[] = [
    { diaSemana: "MONDAY", horaApertura: "08:00:00", horaCierre: "22:00:00" },
  ];

  it("'dia-por-dia' devuelve la base sin tocarla", () => {
    expect(horariosDelPatron("dia-por-dia", base)).toBe(base);
  });

  it("'mismo' pone los 7 días con el horario del primero de la base", () => {
    const resultado = horariosDelPatron("mismo", base);
    expect(resultado).toHaveLength(7);
    expect(resultado.every((h) => h.horaApertura === "08:00:00" && h.horaCierre === "22:00:00")).toBe(true);
    expect(resultado.map((h) => h.diaSemana).sort()).toEqual(
      ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].sort(),
    );
  });

  it("'mismo' sin base usa el default 09:00-23:00", () => {
    const resultado = horariosDelPatron("mismo", []);
    expect(resultado.every((h) => h.horaApertura === "09:00:00" && h.horaCierre === "23:00:00")).toBe(true);
  });

  it("'semana-finde' separa lunes a viernes del fin de semana", () => {
    const resultado = horariosDelPatron("semana-finde", base);
    const entreSemana = resultado.filter((h) => !["SATURDAY", "SUNDAY"].includes(h.diaSemana));
    const finde = resultado.filter((h) => ["SATURDAY", "SUNDAY"].includes(h.diaSemana));
    expect(entreSemana).toHaveLength(5);
    expect(finde).toHaveLength(2);
    expect(entreSemana.every((h) => h.horaApertura === "08:00:00" && h.horaCierre === "22:00:00")).toBe(true);
    expect(finde.every((h) => h.horaApertura === "10:00:00" && h.horaCierre === "20:00:00")).toBe(true);
  });
});
