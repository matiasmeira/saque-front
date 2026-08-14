import { describe, expect, it } from "vitest";

import { aFechaHora, aHoraBack, partirFechaHora, DIA_SEMANA_A_BACK } from "./fechas";

describe("aFechaHora", () => {
  it("combina fecha y hora en el LocalDateTime que espera el back", () => {
    expect(aFechaHora("2026-08-13", "20:00")).toBe("2026-08-13T20:00:00");
  });

  it("no duplica los segundos si la hora ya los trae", () => {
    expect(aFechaHora("2026-08-13", "20:00:00")).toBe("2026-08-13T20:00:00");
  });

  it("nunca emite Z ni offset — el back parsea LocalDateTime sin zona", () => {
    const resultado = aFechaHora("2026-08-13", "20:00");

    expect(resultado).not.toContain("Z");
    expect(resultado).not.toMatch(/[+-]\d{2}:\d{2}$/);
  });
});

describe("partirFechaHora", () => {
  it("separa un LocalDateTime del back en fecha y hora de UI", () => {
    expect(partirFechaHora("2026-08-13T20:30:00")).toEqual({
      fecha: "2026-08-13",
      hora: "20:30",
    });
  });
});

describe("aHoraBack", () => {
  it("expande HH:mm al LocalTime que espera el back", () => {
    expect(aHoraBack("09:00")).toBe("09:00:00");
  });
});

describe("DIA_SEMANA_A_BACK", () => {
  it("traduce el dia corto del front al DayOfWeek de Java", () => {
    expect(DIA_SEMANA_A_BACK.lun).toBe("MONDAY");
    expect(DIA_SEMANA_A_BACK.dom).toBe("SUNDAY");
  });
});
