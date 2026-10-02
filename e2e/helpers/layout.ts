import type { Page } from "@playwright/test";

/**
 * Elementos cuyo contenido no entra en su caja (scrollWidth > clientWidth) sin que sea a propósito:
 * se ignoran los que ofrecen scroll (overflow-x auto/scroll) y los textos truncados con "…".
 * Además mide la página entera: el documento nunca puede ser más ancho que la ventana.
 */
export async function desbordes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const encontrados: string[] = [];
    const ancho = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > ancho) {
      encontrados.push(`documento: scrollWidth ${document.documentElement.scrollWidth} > ${ancho}`);
    }
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      if (el instanceof SVGElement || el.classList.contains("sr-only")) continue;
      const estilo = getComputedStyle(el);
      if (estilo.display === "none" || estilo.display === "contents") continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      if (estilo.overflowX === "auto" || estilo.overflowX === "scroll") continue;
      if (estilo.textOverflow === "ellipsis") continue;
      const clases = (el.getAttribute("class") ?? "").slice(0, 80);
      encontrados.push(`${el.tagName.toLowerCase()}.${clases}: scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`);
    }
    return encontrados;
  });
}
