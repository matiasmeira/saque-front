import { describe, expect, it } from "vitest";

import { ApiError, esErrorTelefonoNoVerificado, mensajeVisible, parsearError } from "./errores";

describe("mensajeVisible", () => {
  it("prefiere el mensaje del campo cuando el error es de bean validation", () => {
    // Caso real del back: POST /auth/registro/verificar-codigo con codigo vacio.
    const error = parsearError(400, { codigo: "El código es obligatorio" });

    expect(mensajeVisible(error)).toBe("El código es obligatorio");
  });

  it("usa el mensaje comun cuando no hay campos invalidos", () => {
    const error = parsearError(400, { error: "El token de verificación no es válido" });

    expect(mensajeVisible(error)).toBe("El token de verificación no es válido");
  });
});

describe("parsearError — forma A: { error }", () => {
  it("usa el mensaje de la clave error", () => {
    const error = parsearError(404, { error: "Reserva no encontrada" });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.mensaje).toBe("Reserva no encontrada");
    expect(error.camposInvalidos).toBeUndefined();
  });
});

describe("parsearError — forma B: bean validation (mapa plano campo→mensaje)", () => {
  it("mapea cada campo invalido sin clave error", () => {
    const error = parsearError(400, {
      canchaId: "El ID de la cancha es obligatorio",
      fechaHoraInicio: "La fecha y hora de inicio es obligatoria",
    });

    expect(error.camposInvalidos).toEqual({
      canchaId: "El ID de la cancha es obligatorio",
      fechaHoraInicio: "La fecha y hora de inicio es obligatoria",
    });
  });
});

describe("parsearError — forma C: conflicto con { error, message }", () => {
  it("separa el titulo del detalle", () => {
    const error = parsearError(409, {
      error: "Conflicto de concurrencia",
      message: "La cancha acaba de ser reservada por otro usuario.",
    });

    expect(error.mensaje).toBe("Conflicto de concurrencia");
    expect(error.detalle).toBe("La cancha acaba de ser reservada por otro usuario.");
    expect(error.camposInvalidos).toBeUndefined();
  });
});

describe("parsearError — body ausente o no parseable", () => {
  it("cae a un mensaje derivado del status cuando el body es null", () => {
    const error = parsearError(500, null);

    expect(error.status).toBe(500);
    expect(error.mensaje.length).toBeGreaterThan(0);
    expect(error.camposInvalidos).toBeUndefined();
  });

  it("no confunde un body de texto plano con un mapa de campos", () => {
    const error = parsearError(502, "<html>Bad Gateway</html>");

    expect(error.camposInvalidos).toBeUndefined();
  });
});

describe("esErrorTelefonoNoVerificado", () => {
  it("detecta un 403 cuyo mensaje pide teléfono verificado", () => {
    const error = parsearError(403, { error: "Este complejo exige tener el celular verificado" });

    expect(esErrorTelefonoNoVerificado(error)).toBe(true);
  });

  it("detecta un 409 con el mismo mensaje, sin tilde", () => {
    const error = parsearError(409, { error: "El telefono del jugador no esta verificado" });

    expect(esErrorTelefonoNoVerificado(error)).toBe(true);
  });

  it("no confunde otro 403 conocido (jugador bloqueado)", () => {
    const error = parsearError(403, { error: "El jugador está bloqueado en este establecimiento" });

    expect(esErrorTelefonoNoVerificado(error)).toBe(false);
  });

  it("no dispara fuera de 403/409 aunque el mensaje coincida", () => {
    const error = parsearError(400, { error: "Falta verificar el teléfono" });

    expect(esErrorTelefonoNoVerificado(error)).toBe(false);
  });
});
