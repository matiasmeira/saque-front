/** Esqueleto mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonPrecios() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-card bg-white p-5">
        <div className="h-4 w-32 rounded bg-borde" />
        <div className="mt-4 space-y-2.5">
          <div className="h-8 w-full rounded bg-humo" />
          <div className="h-8 w-full rounded bg-humo" />
        </div>
      </div>
      <div className="rounded-card bg-white p-5">
        <div className="h-4 w-40 rounded bg-borde" />
        <div className="mt-4 space-y-2">
          <div className="h-12 w-full rounded bg-humo" />
          <div className="h-12 w-full rounded bg-humo" />
        </div>
      </div>
    </div>
  );
}
