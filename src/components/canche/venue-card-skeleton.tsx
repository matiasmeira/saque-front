/**
 * Skeleton con la forma real de VenueCard — no un rectángulo
 * genérico. Es lo que muestra src/app/buscar/loading.tsx mientras
 * el listado carga.
 */
export function VenueCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-white" aria-hidden>
      <div className="flex animate-pulse flex-col md:flex-row">
        <div className="aspect-video shrink-0 bg-borde md:aspect-auto md:w-2/5" />
        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="h-5 w-2/3 rounded bg-borde" />
              <div className="h-5 w-10 rounded bg-borde" />
            </div>
            <div className="mb-4 h-4 w-4/5 rounded bg-borde" />
            <div className="h-3 w-24 rounded bg-borde" />
            <div className="mt-2 flex gap-2">
              <div className="h-11 w-16 rounded-input bg-borde" />
              <div className="h-11 w-16 rounded-input bg-borde" />
              <div className="h-11 w-16 rounded-input bg-borde" />
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-borde pt-3">
            <div className="h-6 w-20 rounded bg-borde" />
            <div className="h-6 w-16 rounded bg-borde" />
          </div>
        </div>
      </div>
    </div>
  );
}
