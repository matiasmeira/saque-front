import { describe, expect, it } from "vitest";

import { rangoDeAgenda } from "./horarios";

/** 2026-08-17 es lunes; 2026-08-18, martes. */
const LUNES = "2026-08-17";
const MARTES = "2026-08-18";

const horario = (diaSemana: string, horaApertura: string, horaCierre: string) => ({
  diaSemana,
  horaApertura,
  horaCierre,
});

describe("rangoDeAgenda", () => {
  it("toma el horario de atención del día visible", () => {
    expect(rangoDeAgenda([horario("MONDAY", "07:00:00", "23:00:00")], [LUNES], [])).toEqual({
      abre: "07:00",
      cierra: "23:00",
    });
  });

  it("une los horarios de todos los días de la vista semanal", () => {
    const horarios = [
      horario("MONDAY", "09:00:00", "23:00:00"),
      horario("TUESDAY", "07:00:00", "20:00:00"),
    ];

    expect(rangoDeAgenda(horarios, [LUNES, MARTES], [])).toEqual({ abre: "07:00", cierra: "23:00" });
  });

  it("cierra a medianoche significa el final del día, no el principio", () => {
    expect(rangoDeAgenda([horario("MONDAY", "09:00:00", "00:00:00")], [LUNES], [])).toEqual({
      abre: "09:00",
      cierra: "24:00",
    });
  });

  it("estira el rango para no cortar un turno cargado fuera del horario", () => {
    const horarios = [horario("MONDAY", "09:00:00", "23:00:00")];
    const turnos = [{ horaInicio: "07:30", horaFin: "09:00" }];

    expect(rangoDeAgenda(horarios, [LUNES], turnos)).toEqual({ abre: "07:00", cierra: "23:00" });
  });

  it("redondea a la hora en punto para que cierren las filas", () => {
    expect(rangoDeAgenda([horario("MONDAY", "08:30:00", "22:45:00")], [LUNES], [])).toEqual({
      abre: "08:00",
      cierra: "23:00",
    });
  });

  it("sin horarios ni turnos cae al rango por defecto", () => {
    expect(rangoDeAgenda(null, [LUNES], [])).toEqual({ abre: "08:00", cierra: "24:00" });
  });

  it("sin horarios se apoya en lo que haya que dibujar", () => {
    expect(rangoDeAgenda(undefined, [LUNES], [{ horaInicio: "19:00", horaFin: "20:30" }])).toEqual({
      abre: "19:00",
      cierra: "21:00",
    });
  });
});
