import { describe, expect, it } from "vitest";

import {
  hayNombreRepetido,
  sugerirNombreDispositivo,
  validarNombreDispositivo,
} from "./dispositivo-caja";

describe("validarNombreDispositivo", () => {
  it("vacío es inválido", () => {
    expect(validarNombreDispositivo("")).not.toBeNull();
  });

  it("sólo espacios es inválido", () => {
    expect(validarNombreDispositivo("   ")).not.toBeNull();
  });

  it("40 caracteres exactos (el tope) es válido", () => {
    expect(validarNombreDispositivo("a".repeat(40))).toBeNull();
  });

  it("41 caracteres supera el tope y es inválido", () => {
    expect(validarNombreDispositivo("a".repeat(41))).not.toBeNull();
  });

  it("un nombre normal es válido", () => {
    expect(validarNombreDispositivo("Caja entrada principal")).toBeNull();
  });
});

describe("hayNombreRepetido", () => {
  it("mismo nombre exacto es repetido", () => {
    expect(hayNombreRepetido("Caja 1", ["Caja 1", "Caja 2"])).toBe(true);
  });

  it("distinto casing igual es repetido", () => {
    expect(hayNombreRepetido("caja 1", ["Caja 1"])).toBe(true);
  });

  it("espacios de más alrededor igual es repetido", () => {
    expect(hayNombreRepetido("  Caja 1  ", ["Caja 1"])).toBe(true);
  });

  it("nombre distinto no es repetido", () => {
    expect(hayNombreRepetido("Caja 2", ["Caja 1"])).toBe(false);
  });

  it("lista vacía nunca tiene repetidos", () => {
    expect(hayNombreRepetido("Caja 1", [])).toBe(false);
  });
});

describe("sugerirNombreDispositivo", () => {
  it("sin dispositivos sugiere Caja 1", () => {
    expect(sugerirNombreDispositivo([])).toBe("Caja 1");
  });

  it("con Caja 1 sugiere Caja 2", () => {
    expect(sugerirNombreDispositivo(["Caja 1"])).toBe("Caja 2");
  });

  it("con Caja 1 y Caja 3 sugiere el hueco Caja 2, no Caja 4", () => {
    expect(sugerirNombreDispositivo(["Caja 1", "Caja 3"])).toBe("Caja 2");
  });

  it("con sólo Caja 2 sugiere el hueco Caja 1", () => {
    expect(sugerirNombreDispositivo(["Caja 2"])).toBe("Caja 1");
  });

  it("es case-insensitive al detectar los nombres usados", () => {
    expect(sugerirNombreDispositivo(["caja 1"])).toBe("Caja 2");
  });

  it("ignora nombres que no siguen el patrón Caja N", () => {
    expect(sugerirNombreDispositivo(["Mostrador principal"])).toBe("Caja 1");
  });
});
