"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

/**
 * Estado del menú lateral en pantallas chicas (< lg). Vive en un Context
 * porque el botón que lo abre (HeaderPanel) y el drawer (SidebarPanel) los
 * monta cada pantalla del panel por separado, sin un shell compartido.
 *
 * SidebarPanel y HeaderPanel tienen que seguir funcionando SIN provider
 * (guía de estilo, /estilo): por eso useMenuMovil() devuelve null en vez de
 * tirar error, y los dos tratan null como "no hay menú móvil".
 */
type MenuMovil = {
  abierto: boolean;
  abrir: () => void;
  /** Cierra y devuelve el foco a la hamburguesa. */
  cerrar: () => void;
};

// Ids fijos: hay un solo menú por pantalla. El foco se maneja por id (DOM)
// y no con refs en el context, que el lint de React considera lectura en render.
export const ID_MENU_LATERAL = "menu-lateral-panel";
export const ID_BOTON_ABRIR_MENU = "menu-abrir-panel";
export const ID_BOTON_CERRAR_MENU = "menu-cerrar-panel";

const MenuMovilContext = createContext<MenuMovil | null>(null);

export function MenuMovilProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);

  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => {
    setAbierto(false);
    document.getElementById(ID_BOTON_ABRIR_MENU)?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, cerrar]);

  const value = useMemo(() => ({ abierto, abrir, cerrar }), [abierto, abrir, cerrar]);

  return <MenuMovilContext.Provider value={value}>{children}</MenuMovilContext.Provider>;
}

/** null cuando no hay provider. */
export function useMenuMovil(): MenuMovil | null {
  return useContext(MenuMovilContext);
}

const MEDIA_ESCRITORIO = "(min-width: 1024px)"; // = breakpoint lg de Tailwind

function suscribirse(cb: () => void) {
  const mq = window.matchMedia(MEDIA_ESCRITORIO);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true desde lg. En el server asume escritorio: es el markup de hoy. */
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(
    suscribirse,
    () => window.matchMedia(MEDIA_ESCRITORIO).matches,
    () => true,
  );
}
