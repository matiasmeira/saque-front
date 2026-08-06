/** Esqueleto de las 5 tarjetas de Configuración mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonConfig() {
  return (
    <div className="animate-pulse space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-card bg-white p-6 shadow-card">
          <div className="h-4 w-40 rounded bg-humo" />
          <div className="h-9 w-full rounded bg-humo" />
          <div className="h-9 w-2/3 rounded bg-humo" />
        </div>
      ))}
    </div>
  );
}
