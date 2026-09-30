"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  SELECTOR_ENFOCABLES,
  apilarDialogo,
  debeDevolverFoco,
  debeEnfocarCierre,
  desapilarDialogo,
  esTopeDePila,
  indiceFocoTrap,
} from "@/lib/focus-trap";

/** El ✕ de cada diálogo lleva `data-dialogo-cerrar`: es adonde va el foco si nadie lo tomó al abrir. */
const SELECTOR_CERRAR = "[data-dialogo-cerrar]";

// Diálogos abiertos, el último arriba. Es de módulo a propósito: hay que
// coordinar diálogos que no se conocen entre sí (el modal dentro del detalle
// de turno). Sólo lo tocan los efectos de abajo.
let pila: readonly string[] = [];

/**
 * Comportamiento de diálogo modal para DrawerPanel y ModalPanel: el foco entra
 * al abrir (respetando un autoFocus de adentro), Tab queda atrapado, Escape
 * cierra y el foco vuelve a quien abrió el diálogo al cerrarlo. Con diálogos
 * apilados, Escape, Tab y el foco de respaldo sólo actúan en el de arriba.
 *
 * Devuelve el id para `aria-labelledby` (el título del diálogo).
 */
export function useDialogoAccesible({ ref, onClose }: { ref: RefObject<HTMLElement | null>; onClose: () => void }): { idTitulo: string } {
  const id = useId();
  const idTitulo = `${id}-titulo`;

  // Quién tenía el foco antes de abrir. Se lee en el render (lectura sin mutar,
  // así que respeta el render puro) porque en el commit los autoFocus de los
  // hijos ya corrieron y el previo se habría perdido.
  const [previo] = useState<Element | null>(() => (typeof document === "undefined" ? null : document.activeElement));

  // onClose en un ref: los efectos no se reinstalan por una lambda inline.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    const cerrar = () => nodo.querySelector<HTMLElement>(SELECTOR_CERRAR);

    pila = apilarDialogo(pila, id);

    if (debeEnfocarCierre({ focoDentro: nodo.contains(document.activeElement) })) cerrar()?.focus();

    // Fase de captura: Escape del tope se maneja acá y no sigue hacia los
    // listeners de window (p. ej. el del menú móvil ni el de otro diálogo).
    function onEscape(e: KeyboardEvent) {
      if (e.key !== "Escape" || !esTopeDePila(pila, id)) return;
      e.stopPropagation();
      onCloseRef.current();
    }

    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !esTopeDePila(pila, id) || !nodo) return;
      const enfocables = Array.from(nodo.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      const destino = indiceFocoTrap({
        actual: enfocables.indexOf(document.activeElement as HTMLElement),
        cantidad: enfocables.length,
        shift: e.shiftKey,
      });
      if (destino === null) return;
      e.preventDefault();
      enfocables[destino].focus();
    }

    // Red de seguridad: si el foco sale por otro camino (clic, lector de
    // pantalla), vuelve al ✕. Sólo el tope: el de abajo no debe pelear con el
    // de arriba, ni con el foco que vuelve al desmontar (el cleanup desapila
    // antes de devolverlo).
    function onFocusIn(e: FocusEvent) {
      const t = e.target as Node | null;
      if (!t || !esTopeDePila(pila, id) || !nodo || nodo.contains(t)) return;
      cerrar()?.focus();
    }

    document.addEventListener("keydown", onEscape, true);
    document.addEventListener("keydown", onTab);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onEscape, true);
      document.removeEventListener("keydown", onTab);
      document.removeEventListener("focusin", onFocusIn);
      pila = desapilarDialogo(pila, id);
      // StrictMode simula un desmontaje con el nodo todavía en la página: ahí
      // no se devuelve el foco, para que dev y prod se comporten igual.
      if (nodo.isConnected) return;
      const p = previo instanceof HTMLElement ? previo : null;
      if (p && debeDevolverFoco({ previoConectado: p.isConnected, previoEsBody: p === document.body })) p.focus();
    };
  }, [ref, id, previo]);

  return { idTitulo };
}
