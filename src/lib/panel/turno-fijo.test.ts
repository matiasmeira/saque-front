import { describe, expect, it } from "vitest";

import {
  horariosPosiblesDelDia,
  inicioDeRenovacion,
  ocurrenciasACancelar,
  ocurrenciasDelPeriodo,
  topeDelPeriodo,
} from "./turno-fijo";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

const horario = (horaApertura: string, horaCierre: string): HorarioAtencionDto => ({
  diaSemana: "MONDAY",
  horaApertura,
  horaCierre,
});

describe("topeDelPeriodo", () => {
  it("topea al 31 de diciembre del año en que arranca el turno fijo", () => {
    expect(topeDelPeriodo("2026-09-06")).toBe("2026-12-31");
  });

  it("arrancando el 1 de enero llega hasta fin de ese mismo año", () => {
    expect(topeDelPeriodo("2026-01-01")).toBe("2026-12-31");
  });

  it("arrancando el propio 31/12 el tope es esa misma fecha", () => {
    expect(topeDelPeriodo("2026-12-31")).toBe("2026-12-31");
  });
});

describe("ocurrenciasDelPeriodo", () => {
  it("devuelve todas las fechas del día pedido, cruzando el cambio de mes", () => {
    expect(ocurrenciasDelPeriodo("2026-09-06", "2026-10-05", "MONDAY")).toEqual([
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
      "2026-10-05",
    ]);
  });

  it("incluye la fecha de inicio cuando ya cae en el día pedido", () => {
    // Espeja el nextOrSame del back: la primera ocurrencia es la primera fecha
    // >= inicio que matchea, y el propio inicio cuenta.
    expect(ocurrenciasDelPeriodo("2026-09-07", "2026-09-21", "MONDAY")[0]).toBe("2026-09-07");
  });

  it("incluye la fecha de fin cuando cae en el día pedido", () => {
    expect(ocurrenciasDelPeriodo("2026-09-06", "2026-09-28", "MONDAY")).toContain("2026-09-28");
  });

  it("un período que no contiene ningún día pedido no devuelve ninguna", () => {
    // Del martes 08 al domingo 13 de septiembre no hay ningún lunes.
    expect(ocurrenciasDelPeriodo("2026-09-08", "2026-09-13", "MONDAY")).toEqual([]);
  });
});

describe("horariosPosiblesDelDia", () => {
  it("marca cada media hora entre apertura y cierre, con los dos extremos incluidos", () => {
    expect(horariosPosiblesDelDia(horario("09:00:00", "12:00:00"))).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
    ]);
  });

  it("un día sin horario de atención cargado no ofrece ninguno", () => {
    expect(horariosPosiblesDelDia(undefined)).toEqual([]);
  });

  it("medianoche como cierre es el final del día, y la última marca posible es 23:30", () => {
    // Misma convención que rangoDeAgenda (ver minutosDeCierre en lib/horarios.ts).
    // El tope en 23:30 no es cosmético: 24:00 no existe como LocalTime del back, y
    // crearReservaSemanal arma inicio y fin sobre la MISMA fecha exigiendo
    // horaInicio < horaFin, así que un turno fijo no puede terminar a medianoche.
    const marcas = horariosPosiblesDelDia(horario("22:00:00", "00:00:00"));
    expect(marcas[0]).toBe("22:00");
    expect(marcas[marcas.length - 1]).toBe("23:30");
  });
});

describe("ocurrenciasACancelar", () => {
  const ocurrencias = [
    "2026-09-01T20:00:00",
    "2026-09-08T20:00:00",
    "2026-09-15T20:00:00",
  ];

  it("deja afuera las que ya pasaron", () => {
    expect(ocurrenciasACancelar(ocurrencias, "2026-09-05", "2026-09-05T10:00:00"))
      .toEqual(["2026-09-08T20:00:00", "2026-09-15T20:00:00"]);
  });

  it("respeta una fecha de corte futura", () => {
    expect(ocurrenciasACancelar(ocurrencias, "2026-09-10", "2026-09-05T10:00:00"))
      .toEqual(["2026-09-15T20:00:00"]);
  });

  it("no cancela un turno de hoy que ya empezo", () => {
    expect(ocurrenciasACancelar(ocurrencias, "2026-09-08", "2026-09-08T21:30:00"))
      .toEqual(["2026-09-15T20:00:00"]);
  });
});

describe("inicioDeRenovacion", () => {
  it("arranca el 1 de enero del anio siguiente", () => {
    expect(inicioDeRenovacion("2026-12-31", "2026-09-06")).toBe("2027-01-01");
  });

  it("arranca hoy si el 1 de enero ya paso", () => {
    expect(inicioDeRenovacion("2026-12-31", "2027-02-10")).toBe("2027-02-10");
  });
});
