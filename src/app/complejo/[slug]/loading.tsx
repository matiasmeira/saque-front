import { HeaderPublico } from "@/components/canche/header-publico";

/**
 * Estado de carga de A3. Next envuelve page.tsx en Suspense solo;
 * esto se activa apenas la ficha dependa de una llamada real.
 */
export default function CargandoFicha() {
  return (
    <div className="flex min-h-dvh flex-col bg-humo" role="status" aria-label="Cargando complejo">
      <HeaderPublico variant="claro" ancho="7xl" />

      <div className="h-[300px] animate-pulse bg-borde md:h-[500px]" aria-hidden />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <div className="h-5 w-40 animate-pulse rounded-full bg-borde" aria-hidden />
        <div className="mt-3 h-12 w-2/3 animate-pulse rounded bg-borde" aria-hidden />
        <div className="mt-3 h-4 w-52 animate-pulse rounded bg-borde" aria-hidden />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-24 animate-pulse rounded-card bg-white" aria-hidden />
            <div className="h-24 animate-pulse rounded-card bg-white" aria-hidden />
          </div>
          <div className="hidden h-80 animate-pulse rounded-card bg-white lg:block" aria-hidden />
        </div>
      </main>
    </div>
  );
}
