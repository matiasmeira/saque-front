import { describe, expect, it } from "vitest";

import { debeBorrarTokenPor401 } from "./cliente";

describe("debeBorrarTokenPor401", () => {
  it("borra si el 401 vino de una request con Authorization", () => {
    expect(debeBorrarTokenPor401(401, true, true)).toBe(true);
  });

  it("no borra si la request no llevaba Authorization", () => {
    // Caso real: rutas de caja autenticadas por cookie de dispositivo, no JWT.
    expect(debeBorrarTokenPor401(401, false, true)).toBe(false);
  });

  it("no borra si el endpoint pidio no borrar en 401", () => {
    // Caso real: DELETE /usuarios/me, donde un 401 es contraseña incorrecta.
    expect(debeBorrarTokenPor401(401, true, false)).toBe(false);
  });

  it("no borra ante otros status aunque haya Authorization", () => {
    expect(debeBorrarTokenPor401(403, true, true)).toBe(false);
    expect(debeBorrarTokenPor401(500, true, true)).toBe(false);
  });
});
