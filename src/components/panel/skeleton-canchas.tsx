/** Esqueleto de la tabla mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonCanchas() {
  return (
    <div className="animate-pulse overflow-hidden rounded-card bg-white shadow-card">
      <div className="bg-humo px-6 py-3">
        <div className="h-3 w-24 rounded bg-borde" />
      </div>
      <div className="divide-y divide-borde/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="h-8 w-full rounded bg-humo" />
          </div>
        ))}
      </div>
    </div>
  );
}
