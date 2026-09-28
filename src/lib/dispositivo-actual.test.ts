import { describe, expect, it } from "vitest";

import { esEstaComputadora } from "./dispositivo-actual";
import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";

function dispositivo(id: number): DispositivoCajaResponse {
  return { id, label: "Caja mostrador", createdAt: "2026-01-01T00:00:00", lastUsedAt: null };
}

describe("esEstaComputadora", () => {
  it("sin id guardado es false", () => {
    expect(esEstaComputadora(dispositivo(1), null)).toBe(false);
  });

  it("id que coincide es true", () => {
    expect(esEstaComputadora(dispositivo(1), 1)).toBe(true);
  });

  it("id que no coincide es false", () => {
    expect(esEstaComputadora(dispositivo(1), 2)).toBe(false);
  });
});
