/** Esqueleto de la grilla + ticket mientras "carga" (Parte 10: los cuatro estados). */
export function SkeletonVentaBuffet() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-card bg-white shadow-card" />
        ))}
      </div>
      <div className="h-80 rounded-card bg-white shadow-card" />
    </div>
  );
}
