import { describe, expect, it } from "vitest";
import {
  SELECTOR_ENFOCABLES,
  apilarDialogo,
  debeDevolverFoco,
  debeEnfocarCierre,
  desapilarDialogo,
  esTopeDePila,
  indiceFocoTrap,
} from "./focus-trap";

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

describe("pila de diálogos", () => {
  it("apilar agrega arriba y no muta la pila original", () => {
    const vacia: readonly string[] = [];
    expect(apilarDialogo(vacia, "a")).toEqual(["a"]);
    expect(vacia).toEqual([]);
    expect(apilarDialogo(["a"], "b")).toEqual(["a", "b"]);
  });

  it("apilar un id que ya estaba lo lleva arriba sin duplicarlo", () => {
    expect(apilarDialogo(["a", "b"], "a")).toEqual(["b", "a"]);
  });

  it("pila vacía: nadie es el tope", () => {
    expect(esTopeDePila([], "a")).toBe(false);
  });

  it("un solo elemento: es el tope", () => {
    expect(esTopeDePila(["a"], "a")).toBe(true);
  });

  it("con varios, sólo el último es el tope", () => {
    expect(esTopeDePila(["a", "b"], "b")).toBe(true);
    expect(esTopeDePila(["a", "b"], "a")).toBe(false);
    expect(esTopeDePila(["a", "b"], "x")).toBe(false);
  });

  it("desapilar el tope deja al de abajo como tope", () => {
    const pila = desapilarDialogo(["a", "b"], "b");
    expect(pila).toEqual(["a"]);
    expect(esTopeDePila(pila, "a")).toBe(true);
  });

  it("desapilar del medio conserva el orden del resto", () => {
    expect(desapilarDialogo(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("desapilar un id inexistente no cambia nada", () => {
    expect(desapilarDialogo(["a", "b"], "x")).toEqual(["a", "b"]);
    expect(desapilarDialogo([], "x")).toEqual([]);
  });
});

describe("foco al abrir y al cerrar un diálogo", () => {
  it("foco ya adentro (autoFocus): no se toca; afuera: va al ✕", () => {
    expect(debeEnfocarCierre({ focoDentro: true })).toBe(false);
    expect(debeEnfocarCierre({ focoDentro: false })).toBe(true);
  });

  it("previo conectado: se le devuelve el foco", () => {
    expect(debeDevolverFoco({ previoConectado: true, previoEsBody: false })).toBe(true);
  });

  it("previo desconectado o body: no se hace nada", () => {
    expect(debeDevolverFoco({ previoConectado: false, previoEsBody: false })).toBe(false);
    expect(debeDevolverFoco({ previoConectado: true, previoEsBody: true })).toBe(false);
  });
});

describe("SELECTOR_ENFOCABLES", () => {
  it("excluye deshabilitados, tabindex=-1 e inputs hidden", () => {
    expect(SELECTOR_ENFOCABLES).toContain('input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])');
    expect(SELECTOR_ENFOCABLES).toContain('button:not([disabled]):not([tabindex="-1"])');
    expect(SELECTOR_ENFOCABLES).toContain('[tabindex]:not([disabled]):not([tabindex="-1"])');
  });
});
