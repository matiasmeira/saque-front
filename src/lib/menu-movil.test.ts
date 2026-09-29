import { describe, expect, it } from "vitest";
import { semanticaSidebar } from "./menu-movil";

describe("semanticaSidebar", () => {
  it("abierto en pantalla chica: es un dialog modal con nombre", () => {
    expect(semanticaSidebar({ conMenuMovil: true, esEscritorio: false, abierto: true })).toEqual({
      role: "dialog",
      "aria-modal": true,
      "aria-label": "Menú del panel",
    });
  });

  it("cerrado en pantalla chica: sin semántica de dialog", () => {
    expect(semanticaSidebar({ conMenuMovil: true, esEscritorio: false, abierto: false })).toEqual({});
  });

  it("en escritorio nunca es dialog, aunque el estado quedó abierto", () => {
    expect(semanticaSidebar({ conMenuMovil: true, esEscritorio: true, abierto: true })).toEqual({});
  });

  it("sin provider (por ejemplo /estilo) se comporta como siempre", () => {
    expect(semanticaSidebar({ conMenuMovil: false, esEscritorio: false, abierto: true })).toEqual({});
  });
});
