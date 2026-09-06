import { describe, expect, it } from "vitest";
import { aTurno } from "./agenda";

const reservaBase = {
  id: 1, jugadorId: null, jugadorNombre: null, canchaId: 3, canchaNombre: "Cancha 1",
  fechaHoraInicio: "2026-09-08T20:00:00", fechaHoraFin: "2026-09-08T21:00:00",
  estado: "CONFIRMADA" as const, precioTotal: 15000, senaPagada: 0,
  nombreClienteManual: "Grupo del Colo", telefonoClienteManual: "11 5555-4444",
  deporteSeleccionado: "FUTBOL_5" as const, expiraEn: null, metodoPago: null,
};

describe("aTurno", () => {
  it("propaga el id de la serie cuando la reserva es de un turno fijo", () => {
    expect(aTurno({ ...reservaBase, turnoFijoId: 7 }).turnoFijoId).toBe(7);
  });

  it("deja el id de serie en null en una reserva puntual", () => {
    expect(aTurno({ ...reservaBase, turnoFijoId: null }).turnoFijoId).toBeNull();
  });
});
