import { describe, expect, it } from "vitest";

import { puedeReservarComoJugador } from "./puede-reservar";

describe("puedeReservarComoJugador", () => {
  it("una cuenta de dueño no puede reservar", () => {
    expect(puedeReservarComoJugador("OWNER")).toBe(false);
  });

  it("jugador, admin y empleado ven la ficha como siempre", () => {
    expect(puedeReservarComoJugador("PLAYER")).toBe(true);
    expect(puedeReservarComoJugador("ADMIN")).toBe(true);
    expect(puedeReservarComoJugador("EMPLOYEE")).toBe(true);
  });

  it("sin perfil (anónimo o cargando) se ofrece reservar", () => {
    expect(puedeReservarComoJugador(undefined)).toBe(true);
  });
});
