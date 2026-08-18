"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, CreditCard, History, LayoutGrid, LogOut, Mail, Receipt, Settings, Tag, Users, Utensils, Wallet } from "lucide-react";
import { Isotipo } from "@/components/saque/logo";
import { useRolPanel } from "@/lib/rol-panel";
import { usePermisos, useEmpleadoActual } from "@/lib/permisos";
import { useQueryClient } from "@tanstack/react-query";
import { usePerfil } from "@/hooks/api/use-perfil";
import { borrarToken } from "@/lib/api/sesion";
import { cerrarSesionEmpleado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
import type { Permiso } from "@/mocks/empleados";

type Item = { href: string; label: string; icono: typeof Calendar; visible: (tienePermiso: (p: Permiso) => boolean, esDueno: boolean) => boolean };
type Grupo = { label: string; items: Item[] };

// Los grupos son fijos (no dependen de rol/permiso, solo sus items):
// GESTIÓN es el día a día, BUFFET agrupa Productos (C11) y Vender
// (C12) porque son dos permisos independientes (alguien puede vender
// sin ver el stock completo, o llevar el stock sin tocar la caja),
// ADMINISTRACIÓN es todo lo que solo el dueño ve.
const GRUPOS: Grupo[] = [
  {
    label: "Gestión",
    items: [
      { href: "/panel/agenda", label: "Agenda", icono: Calendar, visible: (tp) => tp("ver_agenda") },
      { href: "/panel/canchas", label: "Canchas", icono: LayoutGrid, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/precios", label: "Precios", icono: Tag, visible: (_tp, esDueno) => esDueno },
      // El ClienteController entero es OWNER/ADMIN: no hay PermisoEmpleado que
      // lo habilite, así que `ver_clientes` era un permiso que no abría nada.
      { href: "/panel/clientes", label: "Clientes", icono: Users, visible: (_tp, esDueno) => esDueno },
    ],
  },
  {
    label: "Buffet",
    items: [
      { href: "/panel/buffet/productos", label: "Productos", icono: Utensils, visible: (tp) => tp("ver_stock_buffet") },
      { href: "/panel/buffet/vender", label: "Vender", icono: Utensils, visible: (tp) => tp("vender_buffet") },
    ],
  },
  {
    label: "Caja",
    items: [
      { href: "/panel/caja", label: "Caja", icono: Wallet, visible: (tp) => tp("gestionar_caja") },
      { href: "/panel/caja/historial", label: "Historial de caja", icono: History, visible: (_tp, esDueno) => esDueno },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/panel/pagos", label: "Pagos", icono: CreditCard, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/gastos", label: "Gastos", icono: Receipt, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/reportes", label: "Reportes", icono: BarChart3, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/configuracion", label: "Configuración", icono: Settings, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/configuracion/ofertas", label: "Enviar ofertas", icono: Mail, visible: (_tp, esDueno) => esDueno },
    ],
  },
];

const claseLink = (activo: boolean) =>
  `flex h-11 items-center gap-3 rounded-input px-3 text-sm font-semibold transition-colors ${
    activo ? "bg-celeste-suave text-tinta" : "text-[#9DB6D6] hover:bg-white/5 hover:text-white"
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
  const { data: perfil } = usePerfil();
  const queryClient = useQueryClient();

  /**
   * Devuelve el mostrador a la pantalla de nombres. Tiene que soltar el JWT del
   * empleado además de la marca de sesión: si sólo se limpiara sessionStorage,
   * el token seguiría en localStorage y el próximo que tocara su nombre entraría
   * con los permisos del anterior.
   *
   * No llama a POST /auth/logout a propósito — ese endpoint incrementa
   * tokenVersion e invalidaría la sesión de esa persona en todos lados. Acá sólo
   * se termina el turno en ESTA caja; el token de empleado dura 15 minutos y
   * caduca solo.
   */
  function salirDeLaCaja() {
    cerrarSesionEmpleado();
    borrarToken();
    queryClient.clear();
    router.push("/caja");
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-tinta">
      <div className="flex h-16 items-center gap-2 px-5">
        <Isotipo variant="blanco" className="h-6 w-auto" />
        <span className="font-display text-base font-extrabold text-white">saque</span>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5">
        {GRUPOS.map((grupo) => {
          const items = grupo.items.filter((item) => item.visible(tienePermiso, rol === "dueno"));
          if (items.length === 0) return null;
          return (
            <div key={grupo.label}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6E86A8]">{grupo.label}</p>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icono = item.icono;
                  return (
                    <Link key={item.href} href={item.href} aria-current={activo ? "page" : undefined} className={claseLink(activo)}>
                      <Icono className="size-[18px] shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Solo si esta sesión vino del kiosco de caja (/caja) — el atajo
          ?rol=empleado de prueba no la muestra, no tiene una sesión real
          que cerrar. Nunca desvincula el dispositivo, solo la persona. */}
      {empleadoIdSesion && (
        <div className="border-t border-white/10 p-3">
          {(perfil?.nombre ?? empleadoActual?.nombre) && (
            <p className="truncate px-2.5 pb-2 text-xs text-[#9DB6D6]">{perfil?.nombre ?? empleadoActual?.nombre}</p>
          )}
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
