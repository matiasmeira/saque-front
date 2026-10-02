/**
 * Rótulo de una celda para las filas que se ven como tarjeta (por debajo de md).
 * Desde md la tabla tiene cabecera de columnas y esto no se muestra.
 */
export function EtiquetaMovil({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-grafito md:hidden">
      {children}
    </span>
  );
}
