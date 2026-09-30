import { describe, expect, it } from "vitest";

import { armarBodyIniciarRegistro } from "./registro-body";

describe("armarBodyIniciarRegistro", () => {
  it("incluye volverA cuando viene", () => {
    expect(armarBodyIniciarRegistro("a@b.com", "/reservar?x=1")).toEqual({
      email: "a@b.com",
      volverA: "/reservar?x=1",
    });
  });

  it.each([null, undefined, ""])("omite la clave volverA si es %s", (v) => {
    const body = armarBodyIniciarRegistro("a@b.com", v);
    expect(body).toEqual({ email: "a@b.com" });
    expect(JSON.stringify(body)).not.toContain("volverA");
  });
});
