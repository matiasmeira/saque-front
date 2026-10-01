import { describe, expect, it } from "vitest";

import { armarBodyIniciarRegistro } from "./registro-body";

describe("armarBodyIniciarRegistro", () => {
  it("incluye volverA cuando viene", () => {
    expect(armarBodyIniciarRegistro({ email: "a@b.com", volverA: "/reservar?x=1" })).toEqual({
      email: "a@b.com",
      volverA: "/reservar?x=1",
    });
  });

  it.each([null, undefined, ""])("omite la clave volverA si es %s", (v) => {
    const body = armarBodyIniciarRegistro({ email: "a@b.com", volverA: v });
    expect(body).toEqual({ email: "a@b.com" });
    expect(JSON.stringify(body)).not.toContain("volverA");
  });

  it("modo jugador no manda tipo", () => {
    const body = armarBodyIniciarRegistro({ email: "a@b.com", volverA: "/x", modo: "jugador" });
    expect(JSON.stringify(body)).not.toContain("tipo");
  });

  it("modo dueño manda tipo DUENO y nunca volverA", () => {
    const body = armarBodyIniciarRegistro({ email: "a@b.com", volverA: "/x", modo: "dueno" });
    expect(body).toEqual({ email: "a@b.com", tipo: "DUENO" });
    expect(JSON.stringify(body)).not.toContain("volverA");
  });
});
