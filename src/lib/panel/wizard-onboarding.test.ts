import { describe, expect, it } from "vitest";

import { calcularSlugPreview, validarPasoIdentidad, validarPasoPoliticas } from "./wizard-onboarding";

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
