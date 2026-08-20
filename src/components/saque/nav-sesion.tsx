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
 * `usePerfil()` tiene `enabled: haySesion` (src/hooks/api/use-perfil.ts), así
 * que `isPending` ya es `false` sin sesión — no hace falta un chequeo extra
 * para eso acá.
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
  const { data: perfil, isPending } = usePerfil();

  return (
    <nav className="flex items-center gap-5 text-sm">
      {!haySesion && (
        <Link
          href="/negocios"
          className={`hidden min-h-11 items-center decoration-celeste decoration-2 underline-offset-4 transition-colors hover:underline sm:inline-flex ${textoSecundario}`}
        >
          Software para negocios
        </Link>
      )}

      {!haySesion && (
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
