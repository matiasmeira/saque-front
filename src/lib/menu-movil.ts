/**
 * Semántica ARIA del sidebar del panel según el modo en que se muestra.
 *
 * Por debajo de lg el sidebar es un drawer modal; desde lg es una nav fija
 * siempre accesible. Los atributos de dialog no se pueden condicionar con CSS,
 * por eso la decisión vive acá: sólo hay dialog cuando existe el menú móvil
 * (hay provider), la pantalla es chica y el drawer está abierto. En cualquier
 * otro caso el sidebar es un `aside` común, sin atributos extra.
 */
export type SemanticaSidebar = {
  role?: "dialog";
  "aria-modal"?: true;
  "aria-label"?: string;
};

export function semanticaSidebar({
  conMenuMovil,
  esEscritorio,
  abierto,
}: {
  conMenuMovil: boolean;
  esEscritorio: boolean;
  abierto: boolean;
}): SemanticaSidebar {
  if (!conMenuMovil || esEscritorio || !abierto) return {};
  return { role: "dialog", "aria-modal": true, "aria-label": "Menú del panel" };
}
