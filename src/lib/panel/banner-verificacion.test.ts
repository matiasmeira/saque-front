import { describe, expect, it } from "vitest";

import { hayBannerVerificacion } from "./banner-verificacion";

describe("hayBannerVerificacion", () => {
  it("OWNER con el complejo PENDIENTE lo ve", () => {
    expect(hayBannerVerificacion("OWNER", "PENDIENTE")).toBe(true);
  });
  it("OWNER con cualquier otro estado no", () => {
    expect(hayBannerVerificacion("OWNER", "EN_REVISION")).toBe(false);
    expect(hayBannerVerificacion("OWNER", "VERIFICADO")).toBe(false);
    expect(hayBannerVerificacion("OWNER", "RECHAZADO")).toBe(false);
    expect(hayBannerVerificacion("OWNER", undefined)).toBe(false);
  });
  it("ADMIN, EMPLOYEE y sin perfil no, aunque esté PENDIENTE", () => {
    expect(hayBannerVerificacion("ADMIN", "PENDIENTE")).toBe(false);
    expect(hayBannerVerificacion("EMPLOYEE", "PENDIENTE")).toBe(false);
    expect(hayBannerVerificacion(undefined, "PENDIENTE")).toBe(false);
  });
});
