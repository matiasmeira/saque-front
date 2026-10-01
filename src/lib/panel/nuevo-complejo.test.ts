import { describe, expect, it } from "vitest";

import {
  debeRedirigirGuardWizard,
  esComplejoAdicional,
  LIMITE_ESTABLECIMIENTOS,
  esUltimoPaso,
  pasosDelWizard,
  textoBotonAvance,
  puedeCrearOtroComplejo,
  rutaCrearComplejo,
  textoCierreEnRevision,
  textoCierrePendiente,
  textoPasoVerificacion,
} from "./nuevo-complejo";

describe("puedeCrearOtroComplejo", () => {
  it("el límite es 3", () => {
    expect(LIMITE_ESTABLECIMIENTOS).toBe(3);
  });
  it("con 0, 1 y 2 puede", () => {
    expect(puedeCrearOtroComplejo(0)).toBe(true);
    expect(puedeCrearOtroComplejo(2)).toBe(true);
  });
  it("con 3 o más no puede", () => {
    expect(puedeCrearOtroComplejo(3)).toBe(false);
    expect(puedeCrearOtroComplejo(4)).toBe(false);
  });
});

describe("rutaCrearComplejo", () => {
  it("sin complejos va al wizard normal", () => {
    expect(rutaCrearComplejo(0)).toBe("/panel/bienvenida");
  });
  it("con 1 o 2 va al wizard con nuevo=1", () => {
    expect(rutaCrearComplejo(1)).toBe("/panel/bienvenida?nuevo=1");
    expect(rutaCrearComplejo(2)).toBe("/panel/bienvenida?nuevo=1");
  });
  it("con 3 no navega", () => {
    expect(rutaCrearComplejo(3)).toBeNull();
  });
});

describe("debeRedirigirGuardWizard", () => {
  it("OWNER con complejo y sin nuevo: redirige", () => {
    expect(debeRedirigirGuardWizard({ rol: "OWNER", yaTeniaEstablecimiento: true, esNuevo: false })).toBe(true);
  });
  it("OWNER con complejo y con nuevo: no redirige", () => {
    expect(debeRedirigirGuardWizard({ rol: "OWNER", yaTeniaEstablecimiento: true, esNuevo: true })).toBe(false);
  });
  it("OWNER sin complejo: no redirige", () => {
    expect(debeRedirigirGuardWizard({ rol: "OWNER", yaTeniaEstablecimiento: false, esNuevo: false })).toBe(false);
  });
  it("ADMIN: no redirige", () => {
    expect(debeRedirigirGuardWizard({ rol: "ADMIN", yaTeniaEstablecimiento: true, esNuevo: false })).toBe(false);
  });
});

describe("esComplejoAdicional", () => {
  it("sólo con nuevo=1 y un complejo previo", () => {
    expect(esComplejoAdicional({ esNuevo: true, yaTeniaEstablecimiento: true })).toBe(true);
    expect(esComplejoAdicional({ esNuevo: true, yaTeniaEstablecimiento: false })).toBe(false);
    expect(esComplejoAdicional({ esNuevo: false, yaTeniaEstablecimiento: true })).toBe(false);
  });
});

describe("pasosDelWizard", () => {
  it("OWNER tiene 6 pasos, el último Verificación", () => {
    const pasos = pasosDelWizard("OWNER");
    expect(pasos).toHaveLength(6);
    expect(pasos[5]).toBe("Verificación");
  });
  it("ADMIN tiene 5 pasos, sin Verificación", () => {
    const pasos = pasosDelWizard("ADMIN");
    expect(pasos).toHaveLength(5);
    expect(pasos).not.toContain("Verificación");
  });
});

describe("esUltimoPaso / textoBotonAvance", () => {
  it("ADMIN: el paso 5 es el último y dice Terminar", () => {
    expect(esUltimoPaso("ADMIN", 5)).toBe(true);
    expect(textoBotonAvance("ADMIN", 5)).toBe("Terminar");
  });
  it("OWNER: el paso 5 no es el último y dice Continuar", () => {
    expect(esUltimoPaso("OWNER", 5)).toBe(false);
    expect(textoBotonAvance("OWNER", 5)).toBe("Continuar");
  });
  it("OWNER: el paso 6 es el último", () => {
    expect(esUltimoPaso("OWNER", 6)).toBe(true);
    expect(textoBotonAvance("OWNER", 6)).toBe("Terminar");
  });
  it("ADMIN: los pasos anteriores dicen Continuar", () => {
    expect(textoBotonAvance("ADMIN", 4)).toBe("Continuar");
  });
});

describe("textos", () => {
  it("el primer complejo menciona el mes de prueba; el adicional no", () => {
    expect(textoPasoVerificacion(false)).toContain("mes de prueba");
    expect(textoCierreEnRevision(false)).toContain("mes de prueba");
    expect(textoPasoVerificacion(true)).not.toContain("prueba");
    expect(textoCierreEnRevision(true)).not.toContain("prueba");
    expect(textoPasoVerificacion(true)).toContain(
      "Hasta que lo aprobemos no vas a aparecer en el buscador ni recibir reservas.",
    );
  });
  it("el cierre pendiente no le dice a un ADMIN que mande la solicitud", () => {
    expect(textoCierrePendiente("OWNER")).toContain("solicitud de verificación");
    expect(textoCierrePendiente("ADMIN")).not.toContain("solicitud");
  });
});
