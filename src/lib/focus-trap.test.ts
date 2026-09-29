import { describe, expect, it } from "vitest";
import { indiceFocoTrap } from "./focus-trap";

describe("indiceFocoTrap", () => {
  it("sin enfocables: null", () => {
    expect(indiceFocoTrap({ actual: -1, cantidad: 0, shift: false })).toBeNull();
  });

  it("un solo enfocable: siempre el 0, con y sin shift", () => {
    expect(indiceFocoTrap({ actual: 0, cantidad: 1, shift: false })).toBe(0);
    expect(indiceFocoTrap({ actual: 0, cantidad: 1, shift: true })).toBe(0);
  });

  it("foco afuera (-1): Tab va al primero, Shift+Tab al último", () => {
    expect(indiceFocoTrap({ actual: -1, cantidad: 4, shift: false })).toBe(0);
    expect(indiceFocoTrap({ actual: -1, cantidad: 4, shift: true })).toBe(3);
  });

  it("índice fuera de rango por arriba: se trata como foco afuera", () => {
    expect(indiceFocoTrap({ actual: 9, cantidad: 4, shift: false })).toBe(0);
    expect(indiceFocoTrap({ actual: 9, cantidad: 4, shift: true })).toBe(3);
  });

  it("Tab en el último vuelve al primero", () => {
    expect(indiceFocoTrap({ actual: 3, cantidad: 4, shift: false })).toBe(0);
  });

  it("Shift+Tab en el primero salta al último", () => {
    expect(indiceFocoTrap({ actual: 0, cantidad: 4, shift: true })).toBe(3);
  });

  it("en el medio: el navegador sigue solo", () => {
    expect(indiceFocoTrap({ actual: 1, cantidad: 4, shift: false })).toBeNull();
    expect(indiceFocoTrap({ actual: 2, cantidad: 4, shift: true })).toBeNull();
  });

  it("movimiento normal en los bordes: Tab en el primero y Shift+Tab en el último", () => {
    expect(indiceFocoTrap({ actual: 0, cantidad: 4, shift: false })).toBeNull();
    expect(indiceFocoTrap({ actual: 3, cantidad: 4, shift: true })).toBeNull();
  });
});
