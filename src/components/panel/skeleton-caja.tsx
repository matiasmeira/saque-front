/** Esqueleto de la pantalla de caja mientras "carga" (mismo patrón que SkeletonGastos). */
export function SkeletonCaja() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-card bg-white p-6 shadow-card">
        <div className="h-3 w-40 rounded bg-humo" />
        <div className="mt-4 h-10 w-48 rounded bg-humo" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-card bg-white p-5 shadow-card">
            <div className="h-3 w-20 rounded bg-humo" />
            <div className="mt-3 h-6 w-24 rounded bg-humo" />
          </div>
        ))}
      </div>
      <div className="animate-pulse overflow-hidden rounded-card bg-white shadow-card">
        <div className="px-6 py-3">
          <div className="h-3 w-24 rounded bg-humo" />
        </div>
        <div className="space-y-3 px-6 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-humo" />
          ))}
        </div>
      </div>
    </div>
  );
}
