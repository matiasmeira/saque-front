"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { useBloqueadoPorCaja, usePerfilPendiente, usePermisos } from "@/lib/permisos";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { caja as endpointCaja } from "@/lib/api/endpoints/caja";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo, usePerfil } from "@/hooks/api/use-perfil";
import type { CierreCajaResponse } from "@/lib/api/tipos/caja";
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

/**
 * Ticket del cierre.
 *
 * Se dibuja con lo que dejó en el cache la mutación de cierre, no con una
 * lectura: releer el turno es GET /caja/turnos/{id}, que es OWNER/ADMIN. Un
 * empleado con OPERAR_CAJA puede cerrar la caja pero no puede volver a
 * consultarla, así que si dependiera del GET vería un 403 justo después de
 * haber cerrado. Para el dueño sí se cae al GET, que además permite reimprimir
 * el ticket más tarde.
 */
export default function ResumenCierreCaja({ params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = use(params);
  const router = useRouter();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const puedeGestionarCaja = tienePermiso("OPERAR_CAJA");
  const { establecimientoId } = useEstablecimientoActivo();
  const { data: perfil } = usePerfil();
  const queryClient = useQueryClient();
  const esDuenoOAdmin = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";

  const cierreEnCache = queryClient.getQueryData<CierreCajaResponse>(
    keys.caja.cierre(establecimientoId ?? 0, Number(turnoId)),
  );

  const consulta = useQuery({
    queryKey: keys.caja.turno(establecimientoId ?? 0, Number(turnoId)),
    queryFn: () => endpointCaja.turno(establecimientoId!, Number(turnoId)),
    enabled: !cierreEnCache && esDuenoOAdmin && establecimientoId !== null,
  });

  const detalle = consulta.data;
  const turno = cierreEnCache
    ? {
        fondoInicial: cierreEnCache.fondoInicial,
        saldoTeoricoEfectivo: cierreEnCache.saldoTeoricoEfectivo,
        saldoRealContado: cierreEnCache.saldoRealContado,
        diferencia: cierreEnCache.diferencia,
        observaciones: cierreEnCache.observaciones,
        fechaCierre: cierreEnCache.fechaCierre,
        // CierreCajaResponse no trae los nombres de quién abrió y cerró: para
        // eso hace falta el detalle del turno, que es OWNER/ADMIN.
        abiertoPor: null as string | null,
        cerradoPor: null as string | null,
      }
    : detalle
      ? {
          fondoInicial: detalle.turno.fondoInicial,
          saldoTeoricoEfectivo: detalle.turno.saldoTeoricoEfectivo ?? 0,
          saldoRealContado: detalle.turno.saldoRealContado ?? 0,
          diferencia: detalle.turno.diferencia ?? 0,
          observaciones: detalle.turno.observaciones,
          fechaCierre: detalle.turno.fechaCierre ?? detalle.turno.fechaApertura,
          abiertoPor: detalle.turno.usuarioAperturaNombre,
          cerradoPor: detalle.turno.usuarioCierreNombre,
        }
      : null;

  // Los totales de efectivo sólo están si se pudo leer el detalle: el
  // CierreCajaResponse trae el arqueo, no la lista de movimientos.
  const movimientos = detalle?.movimientos ?? [];

  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && !puedeGestionarCaja) router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, puedeGestionarCaja, router]);

  if (bloqueadoPorCaja || !puedeGestionarCaja) return <div className="min-h-dvh bg-humo" />;

  if (!turno) {
    return (
      <div className="flex h-dvh bg-humo">
        <SidebarPanel />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <HeaderPanel />
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <p className="text-sm text-grafito">No encontramos ese turno de caja.</p>
          </main>
        </div>
      </div>
    );
  }

  const ingresos = movimientos.filter((m) => m.tipo === "INGRESO" && m.metodoPago === "EFECTIVO").reduce((acc, m) => acc + m.monto, 0);
  const egresos = movimientos.filter((m) => m.tipo === "EGRESO" && m.metodoPago === "EFECTIVO").reduce((acc, m) => acc + m.monto, 0);
  const saldoTeorico = turno.saldoTeoricoEfectivo;
  const diferencia = turno.diferencia;

  return (
    <div className="flex h-dvh bg-humo print:h-auto print:bg-white">
      <div className="print:hidden">
        <SidebarPanel />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <HeaderPanel />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8 print:overflow-visible print:px-0 print:py-0">
          <div className="mx-auto max-w-lg space-y-6">
            <div className="flex items-center justify-between print:hidden">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Caja cerrada</h1>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Printer className="size-4" aria-hidden />
                Imprimir
              </button>
            </div>

            <div className="rounded-card bg-white p-6 shadow-card print:rounded-none print:p-0 print:shadow-none">
              <p className="mb-1 font-display text-lg font-extrabold text-tinta">
                Cierre de caja #{turnoId}
              </p>
              <p className="mb-4 text-sm text-grafito">
                {fechaLarga(turno.fechaCierre.slice(0, 10))}
                {turno.abiertoPor ? ` — ${turno.abiertoPor}` : ""}
                {turno.cerradoPor && turno.cerradoPor !== turno.abiertoPor
                  ? ` (cerró ${turno.cerradoPor})`
                  : ""}
              </p>

              <Dato etiqueta="Fondo inicial" valor={formatearPrecio(turno.fondoInicial)} />
              <Dato etiqueta="Ingresos en efectivo" valor={`+${formatearPrecio(ingresos)}`} tono="destacado" />
              <Dato etiqueta="Egresos en efectivo" valor={`−${formatearPrecio(egresos)}`} tono="negativo" />
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

            <button
              type="button"
              onClick={() => router.push("/panel/caja")}
              className="flex h-11 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste print:hidden"
            >
              Volver a Caja
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
