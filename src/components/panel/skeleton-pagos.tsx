/** Esqueleto mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonPagos() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card bg-white p-5">
            <div className="h-3 w-24 rounded bg-borde" />
            <div className="mt-3 h-6 w-20 rounded bg-humo" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-card bg-white">
        <div className="bg-humo px-4 py-2.5">
          <div className="h-3 w-24 rounded bg-borde" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded bg-humo" />
          ))}
        </div>
      </div>
    </div>
  );
}
