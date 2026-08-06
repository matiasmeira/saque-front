/** Esqueleto de la tabla mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonClientes() {
  return (
    <div className="animate-pulse overflow-hidden rounded-card bg-white shadow-card">
      <div className="bg-humo px-6 py-3">
        <div className="h-3 w-24 rounded bg-borde" />
      </div>
      <div className="space-y-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-full rounded bg-humo" />
        ))}
      </div>
    </div>
  );
}
