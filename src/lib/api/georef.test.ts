import { describe, expect, it } from "vitest";

import { normalizarLocalidades } from "./georef";

/**
 * Respuestas capturadas de apis.datos.gob.ar/georef/api/localidades.
 * El caso de "jose c paz" es real: la API devuelve la localidad y el municipio
 * homónimos con ids y centroides distintos.
 */
describe("normalizarLocalidades", () => {
  it("aplana la respuesta de georef a nuestro tipo", () => {
    const localidades = normalizarLocalidades({
      localidades: [
        {
          id: "0641201002",
          nombre: "José C. Paz",
          provincia: { id: "06", nombre: "Buenos Aires" },
          centroide: { lat: -34.5217463442325, lon: -58.7553740815986 },
        },
      ],
    });

    expect(localidades).toEqual([
      {
        id: "0641201002",
        nombre: "José C. Paz",
        provincia: "Buenos Aires",
        lat: -34.5217463442325,
        lng: -58.7553740815986,
      },
    ]);
  });

  it("deduplica localidad y municipio homonimos de la misma provincia", () => {
    const localidades = normalizarLocalidades({
      localidades: [
        {
          id: "0641201002",
          nombre: "José C. Paz",
          provincia: { id: "06", nombre: "Buenos Aires" },
          centroide: { lat: -34.5217, lon: -58.7553 },
        },
        {
          id: "06412010",
          nombre: "José C. Paz",
          provincia: { id: "06", nombre: "Buenos Aires" },
          centroide: { lat: -34.5231, lon: -58.7519 },
        },
      ],
    });

    expect(localidades).toHaveLength(1);
    expect(localidades[0].id).toBe("0641201002");
  });

  it("conserva homonimos de provincias distintas", () => {
    const localidades = normalizarLocalidades({
      localidades: [
        {
          id: "1",
          nombre: "San José",
          provincia: { id: "06", nombre: "Buenos Aires" },
          centroide: { lat: -34, lon: -58 },
        },
        {
          id: "2",
          nombre: "San José",
          provincia: { id: "30", nombre: "Entre Ríos" },
          centroide: { lat: -32, lon: -58 },
        },
      ],
    });

    expect(localidades).toHaveLength(2);
  });

  it("devuelve lista vacia cuando no hay resultados", () => {
    expect(normalizarLocalidades({ localidades: [] })).toEqual([]);
  });

  it("no rompe si la respuesta no tiene la clave localidades", () => {
    expect(normalizarLocalidades({})).toEqual([]);
    expect(normalizarLocalidades(null)).toEqual([]);
  });
});
