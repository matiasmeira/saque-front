import { describe, expect, it } from "vitest";

import { construirQuery } from "./query";

describe("construirQuery", () => {
  it("devuelve string vacio cuando no hay params, sin '?' colgado", () => {
    expect(construirQuery({})).toBe("");
  });

  it("omite null y undefined en vez de mandarlos como texto", () => {
    expect(construirQuery({ estado: null, buscar: undefined, page: 0 })).toBe("?page=0");
  });

  it("conserva page=0 y otros valores falsy significativos", () => {
    expect(construirQuery({ page: 0, incluirCanceladas: false })).toBe(
      "?page=0&incluirCanceladas=false",
    );
  });

  it("repite la clave para arrays — el back acepta sort multiple", () => {
    expect(construirQuery({ sort: ["fechaHora,desc", "id,desc"] })).toBe(
      "?sort=fechaHora%2Cdesc&sort=id%2Cdesc",
    );
  });

  it("escapa los valores", () => {
    expect(construirQuery({ buscar: "Juan Pérez" })).toBe("?buscar=Juan+P%C3%A9rez");
  });

  it("omite un string vacio — buscar='' no debe filtrar por nada", () => {
    expect(construirQuery({ buscar: "" })).toBe("");
  });
});
