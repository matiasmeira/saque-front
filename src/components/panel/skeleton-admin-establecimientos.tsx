/** Esqueleto de la cola de moderación mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonAdminEstablecimientos() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-card bg-white p-6 shadow-card">
          <div className="h-4 w-56 rounded bg-borde" />
          <div className="mt-2 h-3 w-40 rounded bg-humo" />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-full max-w-xs rounded bg-humo" />
            ))}
          </div>
          <div className="mt-5 h-9 w-full rounded bg-humo" />
        </div>
      ))}
    </div>
  );
}
