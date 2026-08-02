import { HeaderPublico } from "@/components/saque/header-publico";
import { VenueCardSkeleton } from "@/components/saque/venue-card-skeleton";

/**
 * Estado de carga de A2. Next.js envuelve page.tsx en Suspense
 * automáticamente y muestra esto mientras resuelve — hoy los mocks
 * son sincrónicos y casi no se alcanza a ver, pero es lo que se
 * activa solo apenas la búsqueda dependa de una API real.
 */
export default function CargandoResultados() {
  return (
    <div className="flex min-h-dvh flex-col bg-humo" role="status" aria-label="Buscando canchas">
      <HeaderPublico variant="claro" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        <div className="h-[104px] animate-pulse rounded-card bg-white" aria-hidden />

        <div className="mb-8 mt-8">
          <div className="h-7 w-64 animate-pulse rounded bg-borde" aria-hidden />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-borde" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <VenueCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
