/**
 * Enlace a una subpágina que todavía no existe. No es un <a> ni un botón:
 * un link roto o un botón que no hace nada le mienten al visitante. Se
 * muestra atenuado, con un rótulo que dice la verdad.
 *
 * `claro` es para fondos humo/blanco; `oscuro` para fondos tinta.
 */
export function Proximamente({ children, oscuro = false }: { children: React.ReactNode; oscuro?: boolean }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 text-sm font-semibold ${oscuro ? "text-white/50" : "text-grafito/70"}`}>
      {children}
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${oscuro ? "bg-white/10 text-white/70" : "bg-celeste-suave text-grafito"}`}
      >
        Próximamente
      </span>
    </span>
  );
}
