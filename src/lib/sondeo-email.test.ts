import { describe, expect, it } from "vitest";

import { clasificarSondeo } from "./sondeo-email";

describe("clasificarSondeo", () => {
  it.each([200, 201, 204])("%i es nuevo", (s) => {
    expect(clasificarSondeo(s)).toBe("nuevo");
  });
  it("400 es tiene-cuenta", () => {
    expect(clasificarSondeo(400)).toBe("tiene-cuenta");
  });
  it("429 es esperar, no tiene-cuenta", () => {
    expect(clasificarSondeo(429)).toBe("esperar");
  });
  it.each([401, 403, 404, 409, 500, 502])("%i es error", (s) => {
    expect(clasificarSondeo(s)).toBeNull();
  });
});
