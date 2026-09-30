import { describe, expect, it } from "vitest";

import { destinoTrasLogin } from "./destino-login";

describe("destinoTrasLogin", () => {
  it("sin nada: ADMIN a /admin/ofertas, OWNER al panel, el resto a la home", () => {
    expect(destinoTrasLogin({ rol: "ADMIN" })).toBe("/admin/ofertas");
    expect(destinoTrasLogin({ rol: "OWNER" })).toBe("/panel/agenda");
    expect(destinoTrasLogin({ rol: "PLAYER" })).toBe("/");
    expect(destinoTrasLogin({ rol: "EMPLOYEE" })).toBe("/");
  });

  it("un volverA interno válido gana para cualquier rol", () => {
    const volverA = "/reservar/x?cancha=1&inicio=a&fin=b";
    for (const rol of ["ADMIN", "OWNER", "PLAYER", "EMPLOYEE"] as const) {
      expect(destinoTrasLogin({ rol, volverA })).toBe(volverA);
    }
  });

  it("un volverA inválido se ignora", () => {
    for (const volverA of ["//evil.com", "https://evil.com", "panel", "", null]) {
      expect(destinoTrasLogin({ rol: "OWNER", volverA })).toBe("/panel/agenda");
      expect(destinoTrasLogin({ rol: "PLAYER", volverA })).toBe("/");
    }
  });

  it("bloquea los vectores de open redirect (barra invertida, salto de línea, tab)", () => {
    const BARRA_INVERTIDA = "\\";
    const vectores = [
      "/" + BARRA_INVERTIDA + "evil.com",
      "/" + BARRA_INVERTIDA + "/evil.com",
      "/\n/evil.com",
      "/\t/evil.com",
      " //evil.com",
      "//evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "",
      null,
      "panel",
    ];
    // Los vectores con barra invertida tienen que traerla de verdad.
    expect(vectores[0]).toHaveLength(10);
    expect(vectores[0]).toContain(BARRA_INVERTIDA);
    expect(BARRA_INVERTIDA).toHaveLength(1);
    for (const volverA of vectores) {
      expect(destinoTrasLogin({ rol: "PLAYER", volverA }), String(volverA)).toBe("/");
    }
  });

  it("acepta como ruta interna lo codificado y el tab sin segunda barra", () => {
    const cases: [string, string][] = [
      ["/%5Cevil.com", "/%5Cevil.com"],
      ["/%2F%2Fevil.com", "/%2F%2Fevil.com"],
      ["/\tevil.com", "/evil.com"],
    ];
    for (const [volverA, esperado] of cases) {
      expect(destinoTrasLogin({ rol: "PLAYER", volverA })).toBe(esperado);
    }
  });

  it("deja intactos los volverA válidos, incluida la URL del checkout", () => {
    const checkout =
      "/reservar/mi-complejo?cancha=3&inicio=2026-01-01T10:00:00-03:00&fin=2026-01-01T11:00:00-03:00&deporte=FUTBOL_5";
    for (const volverA of ["/reservar/12?x=1", checkout, "/perfil"]) {
      expect(destinoTrasLogin({ rol: "PLAYER", volverA })).toBe(volverA);
    }
  });

  it("un volverA inválido cae al rol, no a otro destino", () => {
    expect(destinoTrasLogin({ rol: "OWNER", volverA: "/" + "\\" + "x" })).toBe("/panel/agenda");
    expect(destinoTrasLogin({ rol: "ADMIN", volverA: "//x" })).toBe("/admin/ofertas");
    expect(destinoTrasLogin({ rol: "PLAYER", volverA: "/" + "\\" + "x" })).toBe("/");
  });

  it("volverA válido gana sobre el rol", () => {
    expect(destinoTrasLogin({ rol: "OWNER", volverA: "/perfil" })).toBe("/perfil");
    expect(destinoTrasLogin({ rol: "ADMIN", volverA: "/perfil" })).toBe("/perfil");
  });
});
