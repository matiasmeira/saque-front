import { describe, expect, it } from "vitest";

import { modoDesdeParam, textosModo } from "./modo-registro";

describe("modoDesdeParam", () => {
  it("dueno sólo con el valor exacto", () => {
    expect(modoDesdeParam("dueno")).toBe("dueno");
  });
  it.each([null, undefined, "", "jugador", "DUENO", "otro"])("%s es jugador", (v) => {
    expect(modoDesdeParam(v)).toBe("jugador");
  });
});

describe("textosModo", () => {
  it("modo dueño", () => {
    const t = textosModo("dueno", 6);
    expect(t.tituloEmail).toBe("Creá tu cuenta de dueño");
    expect(t.parrafoCodigo).toContain("6 dígitos");
    expect(t.parrafoCodigo).toContain("cuenta de dueño");
    expect(t.pieEmail).toBeNull();
    expect(t.avisoCuentaExistente).toBe(
      "Ya tenés una cuenta con este email. Ingresá con tu contraseña.",
    );
  });
  it("modo jugador queda como antes", () => {
    const t = textosModo("jugador", 6);
    expect(t.tituloEmail).toBe("Ingresá o creá tu cuenta");
    expect(t.parrafoCodigo).toBe("Te mandamos un código de 6 dígitos para crear tu cuenta.");
    expect(t.pieEmail).toBe("Si ya tenés cuenta, entrás igual con este mismo email.");
    expect(t.avisoCuentaExistente).toBeNull();
  });
});
