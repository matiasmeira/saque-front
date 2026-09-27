import { describe, expect, it } from "vitest";

import { ramaPrereserva } from "./prereserva";

describe("ramaPrereserva", () => {
  it("CONFIRMADA muestra la rama confirmada", () => {
    expect(ramaPrereserva("CONFIRMADA", false)).toBe("confirmada");
  });

  it("PENDIENTE_SENA vigente muestra la rama pendiente", () => {
    expect(ramaPrereserva("PENDIENTE_SENA", false)).toBe("pendiente");
  });

  it("PENDIENTE_SENA vencida por el reloj local muestra la rama vencida", () => {
    expect(ramaPrereserva("PENDIENTE_SENA", true)).toBe("vencida");
  });

  it("CANCELADA_PRERESERVA muestra la rama vencida", () => {
    expect(ramaPrereserva("CANCELADA_PRERESERVA", false)).toBe("vencida");
  });

  it("CONFIRMADA con vencida=true igual muestra vencida (el reloj local manda)", () => {
    expect(ramaPrereserva("CONFIRMADA", true)).toBe("vencida");
  });

  it("un estado inesperado (CANCELADA) muestra la rama otra", () => {
    expect(ramaPrereserva("CANCELADA", false)).toBe("otra");
  });

  it("un estado inesperado (FINALIZADA) muestra la rama otra", () => {
    expect(ramaPrereserva("FINALIZADA", false)).toBe("otra");
  });

  it("un estado inesperado (AUSENTE) muestra la rama otra", () => {
    expect(ramaPrereserva("AUSENTE", false)).toBe("otra");
  });
});
