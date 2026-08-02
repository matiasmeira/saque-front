/** Esqueleto de la tabla de empleados mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonEmpleados() {
  return (
    <div className="animate-pulse overflow-hidden rounded-card bg-white">
      <div className="bg-humo px-4 py-2.5">
        <div className="h-3 w-24 rounded bg-borde" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-full rounded bg-humo" />
        ))}
      </div>
    </div>
  );
}
