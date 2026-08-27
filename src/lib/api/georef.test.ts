import { describe, expect, it } from "vitest";

import { normalizarDireccion, normalizarLocalidades } from "./georef";

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
          departamento: { nombre: "José C. Paz" },
          centroide: { lat: -34.5217463442325, lon: -58.7553740815986 },
        },
      ],
    });

    expect(localidades).toEqual([
      {
        id: "0641201002",
        nombre: "José C. Paz",
        provincia: "Buenos Aires",
        departamento: "José C. Paz",
        lat: -34.5217463442325,
        lng: -58.7553740815986,
      },
    ]);
  });

  it("deja departamento vacío si la respuesta no lo trae", () => {
    const localidades = normalizarLocalidades({
      localidades: [
        {
          id: "1",
          nombre: "Wildermuth",
          provincia: { id: "82", nombre: "Santa Fe" },
          centroide: { lat: -31, lon: -61 },
        },
      ],
    });

    expect(localidades[0].departamento).toBe("");
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

/**
 * Respuesta capturada de apis.datos.gob.ar/georef/api/direcciones para
 * "Av Corrientes 1000" con provincia=CABA.
 */
describe("normalizarDireccion", () => {
  it("toma la primera coincidencia y arma la etiqueta con la nomenclatura", () => {
    const direccion = normalizarDireccion({
      cantidad: 1,
      direcciones: [
        {
          nomenclatura: "AV CORRIENTES 1000, Comuna 1, Ciudad Autónoma de Buenos Aires",
          ubicacion: { lat: -34.6036694728664, lon: -58.3809752829037 },
        },
      ],
    });

    expect(direccion).toEqual({
      lat: -34.6036694728664,
      lng: -58.3809752829037,
      etiqueta: "AV CORRIENTES 1000, Comuna 1, Ciudad Autónoma de Buenos Aires",
    });
  });

  it("devuelve null cuando la calle no está en el nomenclador", () => {
    expect(normalizarDireccion({ cantidad: 0, direcciones: [] })).toBeNull();
  });

  it("no rompe si la respuesta no tiene la clave direcciones", () => {
    expect(normalizarDireccion({})).toBeNull();
    expect(normalizarDireccion(null)).toBeNull();
  });
});
