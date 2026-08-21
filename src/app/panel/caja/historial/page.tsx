"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaHistorialCaja } from "@/components/panel/tabla-historial-caja";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { useRolPanel } from "@/lib/rol-panel";
import { useQuery } from "@tanstack/react-query";
import { caja as endpointCaja } from "@/lib/api/endpoints/caja";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";

// Solo dueño — mismo criterio que Pagos/Reportes/Gastos.
export default function HistorialCaja() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const { establecimientoId } = useEstablecimientoActivo();
  const consulta = useQuery({
    queryKey: keys.caja.turnos(establecimientoId ?? 0),
    queryFn: () => endpointCaja.turnos(establecimientoId!),
    enabled: establecimientoId !== null,
  });
  // Sólo los cerrados: el turno abierto se opera desde /panel/caja.
  const historial = (consulta.data?.content ?? []).filter((t) => t.estado === "CERRADO");

  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Historial de caja</h1>

          {historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <p className="font-display font-bold text-tinta">Todavía no hay turnos de caja cerrados</p>
            </div>
          ) : (
            <TablaHistorialCaja turnos={historial} />
          )}
        </main>
      </div>
    </div>
  );
}
