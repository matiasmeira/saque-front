import { describe, expect, it } from "vitest";
import { canchaInicialId, puedeCrearTurno } from "./alta-turno";

const ok = { cargando: false, hayError: false };

describe("puedeCrearTurno", () => {
  it("no deja mientras cargan las canchas, aunque la lista esté vacía", () => {
    const r = puedeCrearTurno([], { cargando: true, hayError: false });
    expect(r).toMatchObject({ puede: false, motivo: "cargando" });
  });
  it("sin canchas dice que hay que cargar una", () => {
    expect(puedeCrearTurno([], ok)).toEqual({ puede: false, motivo: "sin-canchas", texto: "Cargá una cancha primero" });
  });
  it("si falló la carga y no hay canchas, avisa del error y no de que faltan canchas", () => {
    expect(puedeCrearTurno([], { cargando: false, hayError: true })).toMatchObject({ puede: false, motivo: "error" });
  });
  it("con canchas deja", () => {
    expect(puedeCrearTurno([{ id: 1 }], ok)).toEqual({ puede: true });
  });
  it("con canchas ya cargadas, un error de refetch no bloquea", () => {
    expect(puedeCrearTurno([{ id: 1 }], { cargando: false, hayError: true })).toEqual({ puede: true });
  });
});

describe("canchaInicialId", () => {
  it("devuelve la pedida si existe", () => {
    expect(canchaInicialId([{ id: 4 }, { id: 7 }], 7)).toBe(7);
  });
  it("cae a la primera si la pedida no existe (canchaId 0)", () => {
    expect(canchaInicialId([{ id: 4 }, { id: 7 }], 0)).toBe(4);
  });
  it("devuelve null sin canchas", () => {
    expect(canchaInicialId([], 0)).toBeNull();
  });
});
