"use client";

import Link from "next/link";

import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { MenuUsuario } from "@/components/saque/menu-usuario";

/**
 * Slot derecho del header público. "Software para negocios" es un link
 * discreto a propósito: es la puerta de entrada B2B, pero no puede competir
 * visualmente con la acción de sesión. Para alguien ya logueado no aplica
 * (cualquier rol ya tiene cuenta), así que desaparece junto con "Ingresar".
 *
 * `usePerfil()` tiene `enabled: haySesion` (src/hooks/api/use-perfil.ts). En
 * TanStack Query v5 una query deshabilitada queda en `status: "pending"`, así
 * que `isPending` es `true` sin sesión — por eso el `haySesion &&` es
 * obligatorio en la rama del placeholder, no un chequeo redundante.
 *
 * `sinSesionUtil` cubre el caso que "Ingresar"/"placeholder"/"menú" no
 * contemplaban: un error de /me que NO es 401 (5xx, red caída, CORS).
 * `apiFetch` solo limpia el token en un 401 (src/lib/api/cliente.ts), así que
 * `haySesion` sigue en `true` y sin este chequeo el header no renderiza nada.
 * Mismo criterio que ya usa src/app/perfil/page.tsx con el mismo trío de hooks.
 */
export function NavSesion({
  texto,
  textoSecundario,
  oscuro,
}: {
  texto: string;
  textoSecundario: string;
  oscuro: boolean;
}) {
  const haySesion = useHaySesion();
  const { data: perfil, isPending, isError } = usePerfil();
  const sinSesionUtil = !haySesion || (isError && !perfil);

  return (
    <nav className="flex items-center gap-5 text-sm">
      {sinSesionUtil && (
        <Link
          href="/negocios"
          className={`hidden min-h-11 items-center decoration-celeste decoration-2 underline-offset-4 transition-colors hover:underline sm:inline-flex ${textoSecundario}`}
        >
          Software para negocios
        </Link>
      )}

      {sinSesionUtil && (
        <Link
          href="/ingresar"
          className={`inline-flex min-h-11 items-center font-semibold decoration-celeste decoration-2 underline-offset-4 transition-colors hover:underline ${texto}`}
        >
          Ingresar
        </Link>
      )}

      {haySesion && isPending && (
        <div
          className={`h-4 w-20 animate-pulse rounded ${oscuro ? "bg-white/20" : "bg-borde"}`}
          aria-hidden
        />
      )}

      {haySesion && perfil && <MenuUsuario perfil={perfil} oscuro={oscuro} />}
    </nav>
  );
}
