"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";

import { useLogout } from "@/hooks/api/use-perfil";
import { itemsMenuUsuario } from "@/lib/menu-usuario";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/**
 * Menú de usuario del header público: reemplaza a "Ingresar" cuando hay
 * sesión. Solo se monta con un `perfil` ya resuelto (ver NavSesion para los
 * estados de carga / no-logueado).
 */
export function MenuUsuario({ perfil, oscuro }: { perfil: PerfilResponse; oscuro: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logout = useLogout();

  useEffect(() => {
    function alClickAfuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    function alEscapar(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    window.addEventListener("keydown", alEscapar);
    return () => {
      document.removeEventListener("mousedown", alClickAfuera);
      window.removeEventListener("keydown", alEscapar);
    };
  }, []);

  async function cerrarSesion() {
    setAbierto(false);
    // Igual que src/app/perfil/page.tsx: si el logout del servidor falla,
    // igual se limpia el cliente — quedar "logueado" contra un token muerto
    // es peor.
    await logout.mutateAsync().catch(() => {});
    router.push("/");
  }

  const items = itemsMenuUsuario(perfil.rol);
  const primerNombre = perfil.nombre.split(" ")[0];
  const textoTrigger = oscuro ? "text-white" : "text-tinta";

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className={`inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-bold ${textoTrigger}`}
      >
        {primerNombre}
        <ChevronDown className="size-4" aria-hidden />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-card border border-borde bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="block px-4 py-2.5 text-sm text-tinta transition-colors hover:bg-humo"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={cerrarSesion}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-grafito transition-colors hover:bg-humo hover:text-cancelado disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
