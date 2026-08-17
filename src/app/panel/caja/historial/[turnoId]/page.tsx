"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaMovimientosCaja } from "@/components/panel/tabla-movimientos-caja";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { useRolPanel } from "@/lib/rol-panel";
import { useQuery } from "@tanstack/react-query";
import { caja as endpointCaja } from "@/lib/api/endpoints/caja";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { fechaLarga, formatearPrecio } from "@/lib/formato";

function Dato({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: "negativo" | "destacado" }) {
  const color = tono === "negativo" ? "text-cancelado" : tono === "destacado" ? "text-disponible" : "text-tinta";
  return (
    <div className="flex items-center justify-between border-b border-borde/60 py-3 text-sm last:border-0">
      <span className="text-grafito">{etiqueta}</span>
      <span className={`font-display font-bold tabular-nums ${color}`}>{valor}</span>
    </div>
  );
}

// Solo dueño — mismo criterio que HistorialCaja.
export default function DetalleTurnoCaja({ params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = use(params);
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const { establecimientoId } = useEstablecimientoActivo();
  const consulta = useQuery({
    queryKey: keys.caja.turno(establecimientoId ?? 0, Number(turnoId)),
    queryFn: () => endpointCaja.turno(establecimientoId!, Number(turnoId)),
    enabled: establecimientoId !== null && Number.isFinite(Number(turnoId)),
  });
  const turno = consulta.data?.turno;
  const movimientos = consulta.data?.movimientos ?? [];

  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  // Ambos los calcula el backend al cerrar el turno.
  const saldoTeorico = turno?.saldoTeoricoEfectivo ?? 0;
  const diferencia = turno?.diferencia ?? 0;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <Link href="/panel/caja/historial" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul">
            <ArrowLeft className="size-4" aria-hidden />
            Volver al historial
          </Link>

          {!turno ? (
            <p className="text-sm text-grafito">No encontramos ese turno de caja.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">{fechaLarga(turno.fechaApertura.slice(0, 10))}</h1>
                <p className="mt-1 text-sm text-grafito">
                  Abrió {turno.usuarioAperturaNombre}
                  {turno.usuarioCierreNombre ? ` — cerró ${turno.usuarioCierreNombre}` : ""}
                </p>
              </div>

              <div className="max-w-lg rounded-card bg-white p-6 shadow-card">
                <Dato etiqueta="Fondo inicial" valor={formatearPrecio(turno.fondoInicial)} />
                <Dato etiqueta="Saldo teórico" valor={formatearPrecio(saldoTeorico)} />
                <Dato etiqueta="Efectivo real contado" valor={formatearPrecio(turno.saldoRealContado ?? 0)} />
                <Dato
                  etiqueta={diferencia > 0 ? "Sobrante" : diferencia < 0 ? "Faltante" : "Diferencia"}
                  valor={`${diferencia > 0 ? "+" : ""}${formatearPrecio(diferencia)}`}
                  tono={diferencia > 0 ? "destacado" : diferencia < 0 ? "negativo" : undefined}
                />
                {turno.observaciones && (
                  <div className="mt-4 border-t border-borde/60 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Observaciones</p>
                    <p className="mt-1 text-sm text-tinta">{turno.observaciones}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grafito">Movimientos del turno</p>
                <TablaMovimientosCaja movimientos={movimientos} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
