import { Ban, CheckCircle2, KeyRound, Store, type LucideIcon } from "lucide-react";
import { LineasDeCancha } from "@/components/canche/lineas-de-cancha";

function Pieza({
  Icono,
  rotulo,
  claseRotulo,
  titulo,
  detalle,
}: {
  Icono: LucideIcon;
  rotulo: string;
  claseRotulo: string;
  titulo: string;
  detalle: string;
}) {
  return (
    <div className="rounded-card border border-white/10 bg-white/5 p-5">
      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold ${claseRotulo}`}>
        <Icono className="size-3.5" aria-hidden />
        {rotulo}
      </span>
      <p className="mt-3 font-display text-lg font-extrabold text-white">{titulo}</p>
      <p className="text-sm text-[#9DB6D6]">{detalle}</p>
    </div>
  );
}

/** Las cuatro piezas son ilustrativas (datos de ejemplo). */
export function BloqueControl() {
  return (
    <section className="relative overflow-hidden bg-tinta px-5 py-16 sm:px-8 sm:py-20">
      <LineasDeCancha className="opacity-[0.12]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl text-white sm:text-5xl sm:leading-[1.02]">Menos mensajes. Más control del club.</h2>
          <p className="mt-5 max-w-xl text-lg text-[#9DB6D6]">
            Centralizá la operación diaria para que tu equipo tenga una lectura clara de cada cancha, cada turno y cada cobro.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Pieza Icono={CheckCircle2} rotulo="Turno confirmado" claseRotulo="bg-disponible text-white" titulo="Cancha 1" detalle="20:00, turno completo" />
          <Pieza Icono={Ban} rotulo="Desactivada" claseRotulo="bg-grafito text-white" titulo="Cancha 3" detalle="Fuera de servicio por ahora" />
          <Pieza Icono={Store} rotulo="Caja abierta" claseRotulo="bg-azul text-white" titulo="Caja del mostrador" detalle="PC emparejada" />
          <Pieza Icono={KeyRound} rotulo="Empleado con PIN" claseRotulo="bg-celeste/20 text-celeste" titulo="Acceso con PIN" detalle="Permisos por empleado" />
        </div>
      </div>
    </section>
  );
}
