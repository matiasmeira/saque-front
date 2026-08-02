import { ChevronDown } from "lucide-react";

/**
 * Select nativo con estilo propio: sin la flecha ni el look que le
 * pone cada navegador, con la misma tipografía y el mismo chevron
 * que el resto de los campos. Es la base de Deporte, Dónde, Franja
 * y de SelectorFecha — así los cuatro campos del buscador se ven
 * como una sola familia, no como controles sueltos.
 */
export type OpcionSelector = {
  valor: string;
  etiqueta: string;
};

export function Selector({
  id,
  value,
  onChange,
  opciones,
}: {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: OpcionSelector[];
}) {
  return (
    <div className="relative mt-0.5">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent pr-6 font-display text-base font-semibold text-tinta focus:outline-none"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-grafito"
        aria-hidden
      />
    </div>
  );
}
