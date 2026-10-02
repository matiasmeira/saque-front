import { describe, expect, it } from "vitest";

import { DESTINO_TRAS_CONVERTIR, accionCtaClub, puedeConvertirseEnDueno } from "./convertir-en-dueno";

describe("puedeConvertirseEnDueno", () => {
  it("sólo un jugador puede", () => {
    expect(puedeConvertirseEnDueno("PLAYER")).toBe(true);
    expect(puedeConvertirseEnDueno("OWNER")).toBe(false);
    expect(puedeConvertirseEnDueno("ADMIN")).toBe(false);
    expect(puedeConvertirseEnDueno("EMPLOYEE")).toBe(false);
    expect(puedeConvertirseEnDueno(undefined)).toBe(false);
  });
});

describe("accionCtaClub", () => {
  it("cada rol tiene su acción", () => {
    expect(accionCtaClub("PLAYER")).toBe("convertir");
    expect(accionCtaClub("OWNER")).toBe("panel");
    expect(accionCtaClub("ADMIN")).toBe("admin");
  });

  it("sin perfil y EMPLOYEE ven el registro de siempre", () => {
    expect(accionCtaClub(undefined)).toBe("registro");
    expect(accionCtaClub("EMPLOYEE")).toBe("registro");
  });
});

describe("DESTINO_TRAS_CONVERTIR", () => {
  it("es el wizard del primer complejo, sin ?nuevo", () => {
    expect(DESTINO_TRAS_CONVERTIR).toBe("/panel/bienvenida");
  });
});
