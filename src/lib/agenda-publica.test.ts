import { describe, expect, it } from "vitest";

import { agendaDeCancha } from "./agenda-publica";

const iso = (hora: string) => `2026-08-17T${hora}:00`;
const slot = (hora: string) => ({ inicio: iso(hora), fin: iso(hora) });

describe("agendaDeCancha", () => {
  it("sin slots libres, todo el rango queda ocupado", () => {
    const { ocupados, franjas } = agendaDeCancha([], 60, { abre: "08:00", cierra: "23:00" }, []);

    expect(ocupados).toEqual([{ desde: 480, hasta: 1380, propia: false }]);
    expect(franjas).toEqual([]);
  });

  it("un slot libre simple deja el resto del día ocupado", () => {
    const { ocupados, franjas } = agendaDeCancha([slot("09:00")], 60, { abre: "08:00", cierra: "23:00" }, []);

    expect(ocupados).toEqual([
      { desde: 480, hasta: 540, propia: false },
      { desde: 600, hasta: 1380, propia: false },
    ]);
    expect(franjas).toEqual([{ desde: 540, hasta: 600, inicioISO: iso("09:00"), finISO: iso("09:00") }]);
  });

  it("duración mayor al paso: los tramos libres fusionan y las franjas no se solapan", () => {
    const slots = [slot("09:00"), slot("09:30"), slot("10:00")];
    const { ocupados, franjas } = agendaDeCancha(slots, 90, { abre: "08:00", cierra: "23:00" }, []);

    // [09:00, 10:30) ∪ [09:30, 11:00) ∪ [10:00, 11:30) = [09:00, 11:30) sin cortes.
    expect(ocupados).toEqual([
      { desde: 480, hasta: 540, propia: false },
      { desde: 690, hasta: 1380, propia: false },
    ]);

    expect(franjas).toEqual([
      { desde: 540, hasta: 570, inicioISO: iso("09:00"), finISO: iso("09:00") },
      { desde: 570, hasta: 600, inicioISO: iso("09:30"), finISO: iso("09:30") },
      { desde: 600, hasta: 690, inicioISO: iso("10:00"), finISO: iso("10:00") },
    ]);
    // Ninguna franja se pisa con la siguiente.
    for (let i = 0; i < franjas.length - 1; i++) {
      expect(franjas[i].hasta).toBeLessThanOrEqual(franjas[i + 1].desde);
    }
  });

  it("una reserva propia parte un tramo ocupado en gris-verde-gris", () => {
    const { ocupados } = agendaDeCancha([], 60, { abre: "08:00", cierra: "23:00" }, [
      { desde: 600, hasta: 660 },
    ]);

    expect(ocupados).toEqual([
      { desde: 480, hasta: 600, propia: false },
      { desde: 600, hasta: 660, propia: true },
      { desde: 660, hasta: 1380, propia: false },
    ]);
  });

  it("una reserva propia que cubre el tramo ocupado entero no lo parte", () => {
    const { ocupados } = agendaDeCancha([slot("08:00")], 60, { abre: "08:00", cierra: "10:00" }, [
      { desde: 540, hasta: 600 },
    ]);

    expect(ocupados).toEqual([{ desde: 540, hasta: 600, propia: true }]);
  });

  it("rango que cruza medianoche ubica los slots del día siguiente después de las 24:00", () => {
    const { ocupados, franjas } = agendaDeCancha([slot("00:30")], 30, { abre: "22:00", cierra: "01:00" }, []);

    expect(ocupados).toEqual([{ desde: 1320, hasta: 1470, propia: false }]);
    expect(franjas).toEqual([{ desde: 1470, hasta: 1500, inicioISO: iso("00:30"), finISO: iso("00:30") }]);
  });

  it("descarta un slot cuya hora cae fuera de [abre, cierra)", () => {
    const { ocupados, franjas } = agendaDeCancha([slot("07:00")], 60, { abre: "08:00", cierra: "23:00" }, []);

    expect(ocupados).toEqual([{ desde: 480, hasta: 1380, propia: false }]);
    expect(franjas).toEqual([]);
  });
});
