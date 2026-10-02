import { describe, expect, it } from "vitest";
import { guardiaDebeEsperar, perfilPendiente } from "./perfil-pendiente";

describe("perfilPendiente", () => {
  it("antes de hidratar es pendiente aunque haySesion todavía dé false", () => {
    expect(perfilPendiente({ hidratado: false, haySesion: false, perfilCargando: true })).toBe(true);
  });
  it("antes de hidratar es pendiente aunque el perfil figure sin cargar", () => {
    expect(perfilPendiente({ hidratado: false, haySesion: true, perfilCargando: false })).toBe(true);
  });
  it("hidratado, con sesión y /me en vuelo es pendiente", () => {
    expect(perfilPendiente({ hidratado: true, haySesion: true, perfilCargando: true })).toBe(true);
  });
  it("hidratado, con sesión y perfil resuelto no es pendiente", () => {
    expect(perfilPendiente({ hidratado: true, haySesion: true, perfilCargando: false })).toBe(false);
  });
  it("hidratado y sin sesión no es pendiente: las guardias siguen su camino sin sesión", () => {
    expect(perfilPendiente({ hidratado: true, haySesion: false, perfilCargando: true })).toBe(false);
  });
});

describe("guardiaDebeEsperar", () => {
  it("sin sesión (hidratado) las guardias de pantalla esperan: redirige GuardSesionPanel", () => {
    expect(guardiaDebeEsperar({ hidratado: true, haySesion: false, perfilCargando: true })).toBe(true);
  });
  it("antes de hidratar espera", () => {
    expect(guardiaDebeEsperar({ hidratado: false, haySesion: true, perfilCargando: false })).toBe(true);
  });
  it("con sesión y /me en vuelo espera", () => {
    expect(guardiaDebeEsperar({ hidratado: true, haySesion: true, perfilCargando: true })).toBe(true);
  });
  it("con sesión y perfil resuelto la guardia decide según el rol", () => {
    expect(guardiaDebeEsperar({ hidratado: true, haySesion: true, perfilCargando: false })).toBe(false);
  });
});
