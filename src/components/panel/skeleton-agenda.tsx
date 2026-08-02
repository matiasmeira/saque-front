/** Esqueleto de la grilla mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonAgenda({ columnas }: { columnas: number }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-card border border-borde bg-white">
      <div className="flex border-b border-borde bg-humo p-3">
        <div className="w-16 shrink-0" />
        {Array.from({ length: columnas }).map((_, i) => (
          <div key={i} className="flex-1 px-2">
            <div className="h-3.5 w-3/4 rounded bg-borde" />
          </div>
        ))}
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 w-full rounded bg-humo" />
        ))}
      </div>
    </div>
  );
}
