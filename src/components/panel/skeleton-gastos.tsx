/** Esqueleto de la pantalla de gastos mientras "carga" (mismo patrón que SkeletonProductosBuffet). */
export function SkeletonGastos() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-card bg-white p-6 shadow-card">
        <div className="h-3 w-32 rounded bg-humo" />
        <div className="mt-4 h-8 w-40 rounded bg-humo" />
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
