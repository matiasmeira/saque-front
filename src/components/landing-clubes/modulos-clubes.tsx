import { ArrowRight, BarChart3, Calendar, LayoutGrid, Wallet, type LucideIcon } from "lucide-react";
import { Proximamente } from "@/components/canche/proximamente";

/** Todo lo que se muestra en los mini mockups es ilustrativo (datos de ejemplo). */

function Tarjeta({
  Icono,
  titulo,
  descripcion,
  enlace,
  children,
}: {
  Icono: LucideIcon;
  titulo: string;
  descripcion: string;
  enlace: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col justify-between rounded-card bg-white p-6 shadow-card lg:p-8">
      <div>
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-celeste-suave text-azul">
          <Icono className="size-6" aria-hidden />
        </div>
        <h3 className="text-2xl text-tinta">{titulo}</h3>
        <p className="mt-2 text-grafito">{descripcion}</p>
        <div className="mt-5 rounded-card bg-humo p-4" aria-hidden>
          {children}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <Proximamente>
          {enlace}
          <ArrowRight className="size-4" aria-hidden />
        </Proximamente>
      </div>
    </article>
  );
}

function Fila({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2 rounded bg-white p-2 text-xs ring-1 ring-borde">{children}</div>;
}

export function ModulosClubes() {
  return (
    <section className="bg-humo px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-azul">Una plataforma, cuatro áreas clave</p>
          <h2 className="mt-2 text-3xl text-tinta sm:text-4xl">Lo esencial para ordenar la operación</h2>
          <p className="mt-4 text-lg text-grafito">Cada parte de canche está pensada para acompañar el trabajo diario de tu complejo.</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Tarjeta
            Icono={Calendar}
            titulo="Reservas y agenda"
            descripcion="Organizá turnos, reservas de mostrador y turnos fijos desde una sola grilla."
            enlace="Conocer reservas"
          >
            <div className="mb-2 flex justify-between text-xs font-semibold text-grafito">
              <span>Ejemplo del día</span>
              <span>3 turnos</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <div className="rounded border-l-2 border-ocupado bg-ocupado-suave p-2 text-tinta">
                19:00<div className="text-[11px] font-normal">Confirmada</div>
              </div>
              <div className="rounded border-l-2 border-pendiente bg-pendiente-suave p-2 text-tinta">
                20:00<div className="text-[11px] font-normal">Pendiente de seña</div>
              </div>
              <div className="rounded bg-disponible-suave p-2 text-disponible">
                21:00<div className="text-[11px] font-normal">Libre</div>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta
            Icono={LayoutGrid}
            titulo="Gestión de canchas"
            descripcion="Configurá precios, señas, bloqueos y el estado de cada cancha."
            enlace="Conocer la gestión de canchas"
          >
            <div className="space-y-2">
              <Fila>
                <span className="font-semibold text-tinta">Fútbol 5, Cancha 1</span>
                <span className="rounded-full bg-disponible-suave px-2 py-0.5 font-semibold text-disponible">Activa</span>
              </Fila>
              <Fila>
                <span className="font-semibold text-tinta">Pádel, Cancha 2</span>
                <span className="rounded-full bg-disponible-suave px-2 py-0.5 font-semibold text-disponible">Activa</span>
              </Fila>
              <Fila>
                <span className="font-semibold text-tinta">Fútbol 7, Cancha 3</span>
                <span className="rounded-full bg-ocupado-suave px-2 py-0.5 font-semibold text-grafito">Desactivada</span>
              </Fila>
            </div>
          </Tarjeta>

          <Tarjeta
            Icono={Wallet}
            titulo="Caja y equipo"
            descripcion="Registrá los cobros del mostrador y sumá empleados con PIN y permisos por empleado."
            enlace="Conocer caja y equipo"
          >
            <div className="space-y-2">
              <Fila>
                <div>
                  <div className="font-semibold text-tinta">Caja del mostrador</div>
                  <div className="text-[11px] text-grafito">PC emparejada</div>
                </div>
                <span className="rounded-full bg-disponible-suave px-2 py-0.5 font-semibold text-disponible">Abierta</span>
              </Fila>
              <Fila>
                <span className="font-semibold text-tinta">Empleado</span>
                <span className="font-semibold text-grafito">Entra con PIN</span>
              </Fila>
            </div>
          </Tarjeta>

          <Tarjeta
            Icono={BarChart3}
            titulo="Reportes"
            descripcion="Mirá la facturación, la ocupación, los horarios más pedidos y tus clientes."
            enlace="Conocer los reportes"
          >
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-tinta">
                  <span>Ocupación (ejemplo)</span>
                  <span>75%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-borde">
                  <div className="h-full w-3/4 bg-azul" />
                </div>
              </div>
              <Fila>
                <span className="font-semibold text-tinta">Horario más pedido</span>
                <span className="font-semibold text-grafito">20:00</span>
              </Fila>
            </div>
          </Tarjeta>
        </div>
      </div>
    </section>
  );
}
