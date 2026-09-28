import { describe, expect, it } from "vitest";

import { yaEmpezoTurno } from "./fecha";

describe("yaEmpezoTurno", () => {
  it("antes del inicio es false", () => {
    expect(yaEmpezoTurno("2026-09-27", "14:00", new Date("2026-09-27T13:59:00"))).toBe(false);
  });

  it("exactamente en el inicio es true", () => {
    expect(yaEmpezoTurno("2026-09-27", "14:00", new Date("2026-09-27T14:00:00"))).toBe(true);
  });

  it("después del inicio es true", () => {
    expect(yaEmpezoTurno("2026-09-27", "14:00", new Date("2026-09-27T14:01:00"))).toBe(true);
  });
});
