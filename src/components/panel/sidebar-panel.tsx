"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, CreditCard, History, LayoutGrid, LogOut, Receipt, Settings, Tag, User, Users, Utensils, Wallet } from "lucide-react";
import { Isotipo } from "@/components/saque/logo";
import { useRolPanel } from "@/lib/rol-panel";
import { usePermisos } from "@/lib/permisos";
import { PERMISOS_DE_AGENDA } from "@/lib/permisos-empleado";
import { useQueryClient } from "@tanstack/react-query";
import { usePerfil, useLogout } from "@/hooks/api/use-perfil";
import { borrarToken } from "@/lib/api/sesion";
import { cerrarSesionEmpleado, useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
import type { PermisoEmpleado } from "@/lib/api/tipos/comunes";

type Item = { href: string; label: string; icono: typeof Calendar; visible: (tienePermiso: (p: PermisoEmpleado) => boolean, esDueno: boolean) => boolean };
type Grupo = { label: string; items: Item[] };

/**
 * Qué ve cada quien.
 *
 * El recorte NO sale sólo de los permisos de acción: sale de qué LISTADOS puede
 * leer cada rol, que es otra cosa. Un empleado con FINALIZAR_RESERVA necesita
 * además poder LEER la agenda para llegar al id del turno que va a cobrar.
 *
 * Los tres listados del mostrador — agenda, canchas y productos de buffet — se
 * abrieron a EMPLOYEE atados al permiso que los usa (B7), y el resto sigue
 * cerrado: clientes, empleados, turnos de caja y todo `/reportes/*` son
 * OWNER/ADMIN y le responden 403 a un empleado con los siete permisos. Por eso
 * esos ítems son `esDueno` a secas y no hay permiso que los habilite.
 *
 * Cada `visible` de acá tiene que reflejar el gateo REAL del backend: si deja
 * pasar de más, el empleado entra a una pantalla que no carga.
 *
 * Ver PLAN_CONEXION.md §5.7 y B7.
 */
const GRUPOS: Grupo[] = [
  {
    label: "Gestión",
    items: [
      { href: "/panel/agenda", label: "Agenda", icono: Calendar, visible: (tp, esDueno) => esDueno || PERMISOS_DE_AGENDA.some(tp) },
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
      { href: "/panel/buffet/productos", label: "Productos", icono: Utensils, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/buffet/vender", label: "Vender", icono: Utensils, visible: (tp) => tp("REGISTRAR_VENTA_BUFFET") },
    ],
  },
  {
    label: "Caja",
    items: [
      // El único ítem que un empleado puede abrir de verdad.
      { href: "/panel/caja", label: "Caja", icono: Wallet, visible: (tp) => tp("OPERAR_CAJA") },
      { href: "/panel/caja/historial", label: "Historial de caja", icono: History, visible: (_tp, esDueno) => esDueno },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/panel/pagos", label: "Cobros", icono: CreditCard, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/gastos", label: "Gastos", icono: Receipt, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/reportes", label: "Reportes", icono: BarChart3, visible: (_tp, esDueno) => esDueno },
      { href: "/panel/configuracion", label: "Configuración", icono: Settings, visible: (_tp, esDueno) => esDueno },
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
  const emparejado = useEmparejado();
  const { data: perfil } = usePerfil();
  const queryClient = useQueryClient();
  const logout = useLogout();

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

  /**
   * Logout real de dueño: a diferencia de salirDeLaCaja, sí llama a
   * POST /auth/logout (invalida el JWT en el server). El destino depende de si
   * ESTA PC quedó emparejada como caja — nunca se toca el emparejamiento acá,
   * solo se lee.
   */
  async function cerrarSesionDueno() {
    await logout.mutateAsync().catch(() => {});
    router.push(emparejado ? "/caja" : "/ingresar");
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
          {perfil?.nombre && <p className="truncate px-2.5 pb-2 text-xs text-[#9DB6D6]">{perfil.nombre}</p>}
          <Link
            href="/panel/perfil"
            aria-current={pathname === "/panel/perfil" ? "page" : undefined}
            className="flex h-10 items-center gap-2.5 rounded-input pl-2.5 pr-3 text-sm font-semibold text-[#9DB6D6] transition-colors hover:bg-white/5 hover:text-white"
          >
            <User className="size-[18px] shrink-0" aria-hidden />
            Mi perfil
          </Link>
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

      {/* Mutuamente excluyente con el bloque de arriba: un dueño real nunca
          tiene empleadoIdSesion seteado. Se chequea perfil.rol directamente
          (no useRolPanel(), que en desarrollo sin perfil cae por defecto a
          "dueno") para no mostrar este botón sin una sesión real. */}
      {!empleadoIdSesion && (perfil?.rol === "OWNER" || perfil?.rol === "ADMIN") && (
        <div className="border-t border-white/10 p-3">
          {perfil?.nombre && <p className="truncate px-2.5 pb-2 text-xs text-[#9DB6D6]">{perfil.nombre}</p>}
          <Link
            href="/panel/perfil"
            aria-current={pathname === "/panel/perfil" ? "page" : undefined}
            className="flex h-10 items-center gap-2.5 rounded-input pl-2.5 pr-3 text-sm font-semibold text-[#9DB6D6] transition-colors hover:bg-white/5 hover:text-white"
          >
            <User className="size-[18px] shrink-0" aria-hidden />
            Mi perfil
          </Link>
          <button
            type="button"
            onClick={cerrarSesionDueno}
            disabled={logout.isPending}
            className="flex h-10 w-full items-center gap-2.5 rounded-input pl-2.5 pr-3 text-sm font-semibold text-[#9DB6D6] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </aside>
  );
}
