import { describe, expect, it } from "vitest";

import { itemsMenuUsuario } from "./menu-usuario";

describe("itemsMenuUsuario", () => {
  it("PLAYER ve Mis reservas y Mi perfil", () => {
    expect(itemsMenuUsuario("PLAYER")).toEqual([
      { label: "Mis reservas", href: "/mis-reservas" },
      { label: "Mi perfil", href: "/perfil" },
    ]);
  });

  it("OWNER ve el acceso a su panel y Mi perfil", () => {
    expect(itemsMenuUsuario("OWNER")).toEqual([
      { label: "Ir a mi panel", href: "/panel/agenda" },
      { label: "Mi perfil", href: "/perfil" },
    ]);
  });

  it("ADMIN ve solo el panel de administración", () => {
    expect(itemsMenuUsuario("ADMIN")).toEqual([
      { label: "Panel de administración", href: "/panel/agenda" },
    ]);
  });

  it("EMPLOYEE no tiene links de navegación: caso borde en el sitio público", () => {
    expect(itemsMenuUsuario("EMPLOYEE")).toEqual([]);
  });
});
