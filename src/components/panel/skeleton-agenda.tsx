/** Esqueleto de la grilla mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonAgenda({ columnas }: { columnas: number }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-card bg-white shadow-card">
      <div className="flex border-b border-borde bg-humo p-4">
        <div className="w-16 shrink-0" />
        {Array.from({ length: columnas }).map((_, i) => (
          <div key={i} className="flex-1 px-2">
            <div className="h-3.5 w-3/4 rounded bg-borde" />
          </div>
        ))}
      </div>
      <div className="space-y-3 p-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 w-full rounded bg-humo" />
        ))}
      </div>
    </div>
  );
}
