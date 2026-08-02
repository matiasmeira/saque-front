/** Esqueleto de la tabla mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonCanchas() {
  return (
    <div className="animate-pulse overflow-hidden rounded-card bg-white">
      <div className="bg-humo px-4 py-2.5">
        <div className="h-3 w-24 rounded bg-borde" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-full rounded bg-humo" />
        ))}
      </div>
    </div>
  );
}
