import { describe, expect, it } from "vitest";

import { requiereTelefonoEfectivo, VERIFICACION_TELEFONO_HABILITADA } from "./verificacion-telefono";

describe("requiereTelefonoEfectivo", () => {
  it("con la verificación apagada siempre da false, aunque esté guardado en true", () => {
    expect(requiereTelefonoEfectivo(true, false)).toBe(false);
    expect(requiereTelefonoEfectivo(false, false)).toBe(false);
  });

  it("con la verificación encendida respeta el valor guardado", () => {
    expect(requiereTelefonoEfectivo(true, true)).toBe(true);
    expect(requiereTelefonoEfectivo(false, true)).toBe(false);
  });

  it("por defecto usa la constante, que hoy está apagada", () => {
    expect(VERIFICACION_TELEFONO_HABILITADA).toBe(false);
    expect(requiereTelefonoEfectivo(true)).toBe(false);
  });
});
