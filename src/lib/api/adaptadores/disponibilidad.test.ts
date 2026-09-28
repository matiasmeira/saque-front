import { describe, expect, it } from "vitest";

import { aDisponibilidadPublica } from "./disponibilidad";
import type { DisponibilidadEstablecimientoResponse } from "@/lib/api/tipos/disponibilidad";

const respuestaPanel: DisponibilidadEstablecimientoResponse = {
  establecimientoId: 7,
  fechaInicio: "2026-09-28",
  fechaFin: "2026-09-28",
  dias: [
    {
      fecha: "2026-09-28",
      abierto: true,
      motivoCierre: null,
      canchas: [
        {
          canchaId: 1,
          canchaNombre: "Cancha 1",
          deportes: ["FUTBOL_5"],
          opcionesDuracion: [{ duracionMinutos: 60, slotsLibres: [{ inicio: "2026-09-28T18:00:00", fin: "2026-09-28T19:00:00" }] }],
          ocupadaPorPool: [{ inicio: "2026-09-28T20:00:00", fin: "2026-09-28T21:00:00" }],
        },
        {
          canchaId: 2,
          canchaNombre: "Cancha 2",
          deportes: ["PADEL"],
          opcionesDuracion: [],
          ocupadaPorPool: [],
        },
      ],
    },
    {
      fecha: "2026-09-29",
      abierto: false,
      motivoCierre: "El establecimiento está cerrado los SUNDAY",
      canchas: [],
    },
  ],
};

describe("aDisponibilidadPublica", () => {
  it("pone ocupadaPorPool en null en todas las canchas de todos los días", () => {
    const resultado = aDisponibilidadPublica(respuestaPanel);

    expect(resultado.dias[0].canchas[0].ocupadaPorPool).toBeNull();
    expect(resultado.dias[0].canchas[1].ocupadaPorPool).toBeNull();
  });

  it("deja el resto de la estructura idéntica", () => {
    const resultado = aDisponibilidadPublica(respuestaPanel);

    expect(resultado.establecimientoId).toBe(respuestaPanel.establecimientoId);
    expect(resultado.fechaInicio).toBe(respuestaPanel.fechaInicio);
    expect(resultado.fechaFin).toBe(respuestaPanel.fechaFin);
    expect(resultado.dias[1]).toEqual(respuestaPanel.dias[1]);
    expect(resultado.dias[0].canchas[0]).toEqual({
      ...respuestaPanel.dias[0].canchas[0],
      ocupadaPorPool: null,
    });
    expect(resultado.dias[0].canchas[0].opcionesDuracion).toEqual(
      respuestaPanel.dias[0].canchas[0].opcionesDuracion,
    );
  });

  it("no muta el objeto original", () => {
    aDisponibilidadPublica(respuestaPanel);

    expect(respuestaPanel.dias[0].canchas[0].ocupadaPorPool).toEqual([
      { inicio: "2026-09-28T20:00:00", fin: "2026-09-28T21:00:00" },
    ]);
  });
});
