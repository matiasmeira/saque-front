import { Suspense } from "react";
import { GuardSesionPanel } from "@/components/panel/guard-sesion-panel";

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
 *
 * GuardSesionPanel también va acá (y no repetido en cada pantalla, a
 * diferencia de useBloqueadoPorCaja) porque cubre un caso transversal a todo
 * /panel/*: sin esto, una pantalla nueva que se agregue sin acordarse del
 * guard deja al usuario navegando sin sesión y sin salida, que es justo el
 * bug que esto arregla.
 *
 * NO hay chrome compartido acá (sidebar/header): cada pantalla monta su
 * propio `<div className="flex h-dvh ...">` con `SidebarPanel`+`HeaderPanel`.
 * Por eso BannerVerificacionPendiente NO vive acá (agregarlo como hermano de
 * `{children}` sumaría altura arriba de ese `h-dvh` y desbordaría el shell en
 * cada pantalla) sino dentro de `HeaderPanel`, que sí está montado por las
 * ~20 pantallas del panel — mismo efecto de "aparece en todas sin que cada
 * una se acuerde", sin romper el alto.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <GuardSesionPanel />
      {children}
    </Suspense>
  );
}
