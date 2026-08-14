import { Suspense } from "react";

/**
 * Boundary de Suspense para este subárbol.
 *
 * Las pantallas de acá usan useSearchParams() — varias de forma transitiva, a
 * través de useRolPanel()/usePermisos() — y sin un boundary por encima el
 * prerender de `next build` falla con "missing-suspense-with-csr-bailout".
 *
 * Va por ruta y no en el layout raíz porque un boundary global arranca el
 * streaming en todas las páginas, y eso impide que notFound() responda con
 * status 404 en la zona pública.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-dvh bg-humo" />}>{children}</Suspense>;
}
