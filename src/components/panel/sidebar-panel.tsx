"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, CreditCard, LayoutGrid, LogOut, Settings, Tag, Users, Utensils } from "lucide-react";
import { Isotipo } from "@/components/saque/logo";
import { useRolPanel } from "@/lib/rol-panel";
import { usePermisos, useEmpleadoActual } from "@/lib/permisos";
import { cerrarSesionEmpleado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
import type { Permiso } from "@/mocks/empleados";

type Entrada =
  | { tipo: "link"; href: string; label: string; icono: typeof Calendar; visible: (tienePermiso: (p: Permiso) => boolean, esDueno: boolean) => boolean }
  | { tipo: "grupo"; label: string; icono: typeof Calendar; items: { href: string; label: string; visible: (tienePermiso: (p: Permiso) => boolean) => boolean }[] };

// Buffet es un grupo, no un link — agrupa Productos (C11) y Vender
// (C12) porque son dos permisos independientes: alguien puede vender
// sin ver el stock completo, o llevar el stock sin tocar la caja.
const ENTRADAS: Entrada[] = [
  { tipo: "link", href: "/panel/agenda", label: "Agenda", icono: Calendar, visible: (tp) => tp("ver_agenda") },
  { tipo: "link", href: "/panel/canchas", label: "Canchas", icono: LayoutGrid, visible: (_tp, esDueno) => esDueno },
  { tipo: "link", href: "/panel/precios", label: "Precios", icono: Tag, visible: (_tp, esDueno) => esDueno },
  { tipo: "link", href: "/panel/clientes", label: "Clientes", icono: Users, visible: (tp) => tp("ver_clientes") },
  {
    tipo: "grupo",
    label: "Buffet",
    icono: Utensils,
    items: [
      { href: "/panel/buffet/productos", label: "Productos", visible: (tp) => tp("ver_stock_buffet") },
      { href: "/panel/buffet/vender", label: "Vender", visible: (tp) => tp("vender_buffet") },
    ],
  },
  { tipo: "link", href: "/panel/pagos", label: "Pagos", icono: CreditCard, visible: (_tp, esDueno) => esDueno },
  { tipo: "link", href: "/panel/reportes", label: "Reportes", icono: BarChart3, visible: (_tp, esDueno) => esDueno },
  { tipo: "link", href: "/panel/configuracion", label: "Configuración", icono: Settings, visible: (_tp, esDueno) => esDueno },
];

const claseLink = (activo: boolean) =>
  `flex h-11 items-center gap-3 rounded-input pl-2.5 pr-3 text-sm font-semibold transition-colors ${
    activo ? "bg-white/10 text-white" : "text-[#9DB6D6] hover:bg-white/5 hover:text-white"
  }`;

/**
 * Sidebar fija del panel. El recorte por permiso saca los ítems del
 * todo — nunca los deja deshabilitados — porque un empleado no tiene
 * por qué enterarse de que existen precios, pagos o reportes. Ya no
 * depende de un rol fijo: resuelve permisos y "es dueño" ella misma
 * (dueño = todos los permisos, implícito), así cualquier pantalla
 * que la use no tiene que pasarle nada.
 */
export function SidebarPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const rol = useRolPanel();
  const tienePermiso = usePermisos();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const empleadoActual = useEmpleadoActual();

  function salirDeLaCaja() {
    cerrarSesionEmpleado();
    router.push("/caja");
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-tinta">
      <div className="flex h-16 items-center gap-2 px-5">
        <Isotipo variant="blanco" className="h-6 w-auto" />
        <span className="font-display text-base font-extrabold text-white">saque</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {ENTRADAS.map((entrada) => {
          if (entrada.tipo === "link") {
            if (!entrada.visible(tienePermiso, rol === "dueno")) return null;
            const activo = pathname === entrada.href || pathname.startsWith(`${entrada.href}/`);
            const Icono = entrada.icono;
            return (
              <Link key={entrada.href} href={entrada.href} aria-current={activo ? "page" : undefined} className={claseLink(activo)}>
                <span className={`h-5 w-[3px] shrink-0 rounded-full ${activo ? "bg-celeste" : "bg-transparent"}`} aria-hidden />
                <Icono className="size-[18px] shrink-0" aria-hidden />
                {entrada.label}
              </Link>
            );
          }

          const items = entrada.items.filter((item) => item.visible(tienePermiso));
          if (items.length === 0) return null;
          const Icono = entrada.icono;
          return (
            <div key={entrada.label} className="mt-1 first:mt-0">
              <div className="flex h-9 items-center gap-3 pl-2.5 pr-3 text-xs font-semibold uppercase tracking-wide text-[#6E86A8]">
                <Icono className="size-[18px] shrink-0" aria-hidden />
                {entrada.label}
              </div>
              {items.map((item) => {
                const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} aria-current={activo ? "page" : undefined} className={claseLink(activo)}>
                    <span className={`h-5 w-[3px] shrink-0 rounded-full ${activo ? "bg-celeste" : "bg-transparent"}`} aria-hidden />
                    <span className="pl-[18px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Solo si esta sesión vino del kiosco de caja (/caja) — el atajo
          ?rol=empleado de prueba no la muestra, no tiene una sesión real
          que cerrar. Nunca desvincula el dispositivo, solo la persona. */}
      {empleadoIdSesion && (
        <div className="border-t border-white/10 p-3">
          {empleadoActual && <p className="truncate px-2.5 pb-2 text-xs text-[#9DB6D6]">{empleadoActual.nombre}</p>}
          <button
            type="button"
            onClick={salirDeLaCaja}
            className="flex h-10 w-full items-center gap-2.5 rounded-input pl-2.5 pr-3 text-sm font-semibold text-[#9DB6D6] transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            Salir / cambiar de empleado
          </button>
        </div>
      )}
    </aside>
  );
}
