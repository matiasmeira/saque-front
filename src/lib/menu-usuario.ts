import type { Role } from "./api/tipos/comunes";

/**
 * Ítems de navegación del menú de usuario del header público, según rol.
 * "Cerrar sesión" no está acá a propósito: es una acción, no un link, y el
 * componente que consume esto (MenuUsuario) siempre la agrega al final.
 */
export type ItemMenuUsuario = {
  label: string;
  href: string;
};

export function itemsMenuUsuario(rol: Role): ItemMenuUsuario[] {
  switch (rol) {
    case "PLAYER":
      return [
        { label: "Mis reservas", href: "/mis-reservas" },
        { label: "Mi perfil", href: "/perfil" },
      ];
    case "OWNER":
      return [
        { label: "Ir a mi panel", href: "/panel/agenda" },
        { label: "Mi perfil", href: "/perfil" },
      ];
    case "ADMIN":
      // Mismo destino que OWNER: no existe un panel de administración
      // separado, ADMIN comparte /panel/agenda (ver entrar() en
      // src/app/ingresar/page.tsx). /admin/ofertas existe pero es una
      // pantalla puntual, no "el" panel.
      return [{ label: "Panel de administración", href: "/panel/agenda" }];
    case "EMPLOYEE":
      // No entra por acá en el uso normal (login por PIN en /caja): si un
      // token de empleado sobrevive en localStorage y esta persona cae en
      // una página pública, solo ve su nombre y Cerrar sesión.
      return [];
  }
}
