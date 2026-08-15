import { describe, expect, it } from "vitest";

import { aTarifasDto, aTarifasPanel } from "./tarifas";
import type { DiaSemana } from "@/mocks/tarifas";

/**
 * El front modela una tarifa como "estos días, en esta franja, a este precio"
 * (`dias: DiaSemana[]`). El backend modela UNA fila por día
 * (`TarifaDto.diaSemana`). Una tarifa de lunes a viernes son 5 TarifaDto.
 */
describe("aTarifasDto — expande una tarifa del front a N del backend", () => {
  it("emite un TarifaDto por cada día", () => {
    const dtos = aTarifasDto([
      {
        id: 1,
        canchaId: 1,
        dias: ["lun", "mie", "vie"],
        horaDesde: "18:00",
        horaHasta: "23:00",
        precios: [{ duracionMinutos: 60, precio: 20000 }],
      },
    ]);

    expect(dtos).toHaveLength(3);
    expect(dtos.map((d) => d.diaSemana)).toEqual(["MONDAY", "WEDNESDAY", "FRIDAY"]);
  });

  it("expande las horas a LocalTime con segundos", () => {
    const [dto] = aTarifasDto([
      {
        id: 1,
        canchaId: 1,
        dias: ["sab"],
        horaDesde: "09:00",
        horaHasta: "14:30",
        precios: [{ duracionMinutos: 90, precio: 30000 }],
      },
    ]);

    expect(dto.horaInicio).toBe("09:00:00");
    expect(dto.horaFin).toBe("14:30:00");
  });

  it("usa el precio de la duracion mas corta como precio base de la fila", () => {
    const [dto] = aTarifasDto([
      {
        id: 1,
        canchaId: 1,
        dias: ["dom"],
        horaDesde: "10:00",
        horaHasta: "12:00",
        precios: [
          { duracionMinutos: 90, precio: 30000 },
          { duracionMinutos: 60, precio: 21000 },
        ],
      },
    ]);

    expect(dto.precio).toBe(21000);
    expect(dto.preciosPorDuracion).toEqual({ "60": 21000, "90": 30000 });
  });
});

describe("aTarifasPanel — agrupa las del backend en una del front", () => {
  it("junta los dias de filas con la misma franja y el mismo precio", () => {
    const tarifas = aTarifasPanel(
      [
        {
          diaSemana: "MONDAY",
          horaInicio: "18:00:00",
          horaFin: "23:00:00",
          precio: 20000,
          preciosPorDuracion: { "60": 20000 },
        },
        {
          diaSemana: "TUESDAY",
          horaInicio: "18:00:00",
          horaFin: "23:00:00",
          precio: 20000,
          preciosPorDuracion: { "60": 20000 },
        },
      ],
      7,
    );

    expect(tarifas).toHaveLength(1);
    expect(tarifas[0].dias).toEqual(["lun", "mar"]);
    expect(tarifas[0].horaDesde).toBe("18:00");
    expect(tarifas[0].canchaId).toBe(7);
  });

  it("NO agrupa filas del mismo horario con precios distintos", () => {
    const tarifas = aTarifasPanel(
      [
        {
          diaSemana: "MONDAY",
          horaInicio: "18:00:00",
          horaFin: "23:00:00",
          precio: 20000,
          preciosPorDuracion: { "60": 20000 },
        },
        {
          diaSemana: "SATURDAY",
          horaInicio: "18:00:00",
          horaFin: "23:00:00",
          precio: 25000,
          preciosPorDuracion: { "60": 25000 },
        },
      ],
      7,
    );

    expect(tarifas).toHaveLength(2);
  });

  it("es reversible: expandir y volver a agrupar da lo mismo", () => {
    const original = [
      {
        id: 1,
        canchaId: 3,
        dias: ["lun", "mar", "mie"] as DiaSemana[],
        horaDesde: "18:00",
        horaHasta: "23:00",
        precios: [{ duracionMinutos: 60, precio: 20000 }],
      },
    ];

    const ida = aTarifasDto([...original]);
    const vuelta = aTarifasPanel(ida, 3);

    expect(vuelta).toHaveLength(1);
    expect(vuelta[0].dias).toEqual(["lun", "mar", "mie"]);
    expect(vuelta[0].precios).toEqual([{ duracionMinutos: 60, precio: 20000 }]);
  });
});
