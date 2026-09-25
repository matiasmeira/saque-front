"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { HeaderMinimo } from "@/components/canche/header-minimo";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { hayToken } from "@/lib/api/sesion";

const LINKS = [
  { href: "/admin/establecimientos", label: "Establecimientos" },
  { href: "/admin/ofertas", label: "Ofertas" },
];

/**
 * Shell de /admin: HeaderMinimo + una nav de dos links, sin sidebar propia —
 * lo usa un puñado de administradores de la plataforma, no justifica un shell
 * como el del panel del dueño.
 *
 * Centraliza acá el chequeo de rol que antes vivía copiado a mano en
 * /admin/ofertas. Es un chequeo de UX, no de seguridad (el backend ya
 * rechaza con 403 a quien no sea ADMIN): por eso ante un rol incorrecto NO
 * redirige, muestra un cartel explicando por qué no puede usarlo. Alguien
 * que llegó sabiendo la URL merece saber el motivo, no un rebote silencioso
 * al panel. El único redirect que queda es por falta de sesión.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const haySesion = useHaySesion();
  const { data: perfil, isPending } = usePerfil();

  // Lee hayToken() adentro del efecto en vez de confiar en haySesion (que sólo
  // dispara el efecto): useSyncExternalStore rinde false en el primer commit
  // post-hidratación, y confiar en ese false transitorio expulsaría una
  // sesión real. Mismo patrón que guard-sesion-panel.tsx.
  useEffect(() => {
    if (hayToken()) return;
    router.replace("/ingresar");
  }, [haySesion, router]);

  if (!haySesion || (isPending && !perfil)) return <div className="min-h-dvh bg-humo" />;

  const esAdmin = perfil?.rol === "ADMIN";

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />

      {esAdmin && (
        <nav className="flex gap-1 border-b border-borde bg-white px-4">
          {LINKS.map((link) => {
            const activo = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 px-3 py-3 font-display text-sm font-bold transition-colors ${
                  activo ? "border-azul text-tinta" : "border-transparent text-grafito hover:text-tinta"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}

      {esAdmin ? (
        children
      ) : (
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-sm rounded-card bg-white p-8 text-center shadow-card">
            <ShieldAlert className="mx-auto size-8 text-grafito" aria-hidden />
            <h1 className="mt-3 font-display text-lg font-bold text-tinta">Esto es de administración</h1>
            <p className="mt-2 text-sm text-grafito">
              Esta sección es para administradores de la plataforma, no para dueños de un complejo.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}
