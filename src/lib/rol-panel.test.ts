import { describe, expect, it } from "vitest";

import { rolDesdePerfil } from "./rol-panel";
import type { PerfilResponse } from "@/lib/api/tipos/auth";
import type { Role } from "@/lib/api/tipos/comunes";

function perfilCon(rol: Role): PerfilResponse {
  return {
    id: 1,
    email: "test@saque.com",
    nombre: "Test",
    rol,
    planSuscripcion: "FREE",
    emailVerified: true,
    telefonoVerificado: true,
    establecimientoId: null,
    permisos: [],
  };
}

describe("rolDesdePerfil", () => {
  it("OWNER es dueno", () => {
    expect(rolDesdePerfil(perfilCon("OWNER"))).toBe("dueno");
  });

  it("ADMIN es dueno", () => {
    expect(rolDesdePerfil(perfilCon("ADMIN"))).toBe("dueno");
  });

  it("EMPLOYEE es empleado", () => {
    expect(rolDesdePerfil(perfilCon("EMPLOYEE"))).toBe("empleado");
  });

  it("PLAYER es empleado", () => {
    expect(rolDesdePerfil(perfilCon("PLAYER"))).toBe("empleado");
  });

  it("sin perfil (cargando, error o sin sesión) es empleado", () => {
    expect(rolDesdePerfil(undefined)).toBe("empleado");
  });
});
