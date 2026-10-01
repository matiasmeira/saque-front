import { describe, expect, it } from "vitest";

import { armarBodyRegistroDueno, validarRegistroDueno } from "./registro-dueno";

const OK = { nombre: "Ana", email: "ana@ejemplo.com", password: "abcdefg1" };

describe("validarRegistroDueno", () => {
  it("datos válidos: sin errores", () => {
    expect(validarRegistroDueno(OK)).toEqual({});
  });

  it("contraseña de exactamente 8 caracteres con letra y número es válida", () => {
    expect(validarRegistroDueno({ ...OK, password: "abcdefg1" }).password).toBeUndefined();
  });

  it("contraseña de 7 caracteres es inválida", () => {
    expect(validarRegistroDueno({ ...OK, password: "abcdef1" }).password).toBeDefined();
  });

  it("contraseña sin número es inválida", () => {
    expect(validarRegistroDueno({ ...OK, password: "abcdefghij" }).password).toBeDefined();
  });

  it("contraseña sin letra es inválida", () => {
    expect(validarRegistroDueno({ ...OK, password: "1234567890" }).password).toBeDefined();
  });

  it("los espacios cuentan como caracteres y no se recortan (igual que el back)", () => {
    expect(validarRegistroDueno({ ...OK, password: "ab 1 xyz" }).password).toBeUndefined();
    expect(validarRegistroDueno({ ...OK, password: "        " }).password).toBeDefined();
    expect(validarRegistroDueno({ ...OK, password: "abc1    " }).password).toBeUndefined();
  });

  it("nombre vacío o en blanco es inválido", () => {
    expect(validarRegistroDueno({ ...OK, nombre: "" }).nombre).toBeDefined();
    expect(validarRegistroDueno({ ...OK, nombre: "   " }).nombre).toBeDefined();
  });

  it("email vacío o sin formato es inválido", () => {
    expect(validarRegistroDueno({ ...OK, email: "" }).email).toBeDefined();
    expect(validarRegistroDueno({ ...OK, email: "ana" }).email).toBeDefined();
    expect(validarRegistroDueno({ ...OK, email: "ana@" }).email).toBeDefined();
  });

  it("informa todos los campos inválidos juntos", () => {
    expect(Object.keys(validarRegistroDueno({ nombre: "", email: "", password: "" }))).toEqual([
      "nombre",
      "email",
      "password",
    ]);
  });
});

describe("armarBodyRegistroDueno", () => {
  it("recorta el nombre, normaliza el email y deja la contraseña tal cual", () => {
    expect(
      armarBodyRegistroDueno({ nombre: "  Ana  ", email: " Ana@Ejemplo.COM ", password: " abc12345 " }),
    ).toEqual({ nombre: "Ana", email: "ana@ejemplo.com", password: " abc12345 " });
  });
});
