import { describe, expect, it } from "vitest";

import { destinoSinSesion } from "./sesion-caja";

describe("destinoSinSesion", () => {
  it("OWNER sin sesión va a /ingresar", () => {
    expect(destinoSinSesion(null)).toBe("/ingresar");
  });

  it("ADMIN sin sesión va a /ingresar", () => {
    expect(destinoSinSesion(null)).toBe("/ingresar");
  });

  it("usuario que nunca inició sesión va a /ingresar", () => {
    expect(destinoSinSesion(null)).toBe("/ingresar");
  });

  it("EMPLOYEE con dispositivo vinculado sin sesión va a /caja", () => {
    expect(destinoSinSesion("42")).toBe("/caja");
  });
});
