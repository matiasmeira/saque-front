/** Esqueleto de la tabla de productos mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonProductosBuffet() {
  return (
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
  );
}
