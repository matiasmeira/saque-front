import { describe, expect, it } from "vitest";

import { destinoTrasLogin } from "./destino-login";

const RESERVA = "/reservar/x?cancha=1&fecha=2026-01-01&hora=10:00";

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

  it("modo reserva sin volverA va al destino de la reserva, para cualquier rol", () => {
    for (const rol of ["ADMIN", "OWNER", "PLAYER"] as const) {
      expect(destinoTrasLogin({ rol, destinoReserva: RESERVA })).toBe(RESERVA);
    }
  });

  it("volverA válido gana sobre la reserva; inválido cae a la reserva", () => {
    expect(destinoTrasLogin({ rol: "PLAYER", volverA: "/perfil", destinoReserva: RESERVA })).toBe("/perfil");
    expect(destinoTrasLogin({ rol: "PLAYER", volverA: "//x", destinoReserva: RESERVA })).toBe(RESERVA);
  });

  it("sin destinoReserva (null) cae al rol", () => {
    expect(destinoTrasLogin({ rol: "ADMIN", destinoReserva: null })).toBe("/admin/ofertas");
  });
});
