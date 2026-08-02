/** Esqueleto de las tarjetas de métrica y los gráficos mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonReportes() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-card bg-white p-5">
        <div className="h-3 w-32 rounded bg-borde" />
        <div className="mt-3 h-9 w-40 rounded bg-humo" />
        <div className="mt-4 h-64 w-full rounded bg-humo" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-card bg-white p-5">
            <div className="h-3 w-24 rounded bg-borde" />
            <div className="mt-3 h-40 w-full rounded bg-humo" />
          </div>
        ))}
      </div>
    </div>
  );
}
