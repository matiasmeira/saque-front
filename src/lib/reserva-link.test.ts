import { describe, expect, it } from "vitest";

import { etiquetaSlot, hrefDeSlot } from "./reserva-link";

const slot = {
  canchaId: 5,
  inicioISO: "2026-09-28T18:00:00",
  finISO: "2026-09-28T19:00:00",
  deporte: "FUTBOL_5" as const,
};

describe("hrefDeSlot", () => {
  it("en sólo lectura no da ninguna ruta", () => {
    expect(hrefDeSlot({ soloLectura: true }, slot)).toBeNull();
  });

  it("en modo reservable arma la URL de /reservar con todos los parámetros", () => {
    expect(hrefDeSlot({ slug: "complejo-demo" }, slot)).toBe(
      "/reservar/complejo-demo?cancha=5&inicio=2026-09-28T18:00:00&fin=2026-09-28T19:00:00&deporte=FUTBOL_5",
    );
  });
});

describe("etiquetaSlot", () => {
  it("en sólo lectura describe el estado sin sugerir una acción", () => {
    expect(etiquetaSlot({ soloLectura: true }, "Cancha 1", "18:00", "19:00")).toBe(
      "Cancha 1: libre de 18:00 a 19:00",
    );
  });

  it("en modo reservable invita a reservar", () => {
    expect(etiquetaSlot({ slug: "complejo-demo" }, "Cancha 1", "18:00", "19:00")).toBe(
      "Reservar Cancha 1 de 18:00 a 19:00",
    );
  });
});
