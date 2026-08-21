"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useBloqueadoPorCaja, usePerfilPendiente, usePermisos } from "@/lib/permisos";
import { useAccionesCaja, useCajaAbierta } from "@/hooks/api/use-caja";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { formatearPrecio } from "@/lib/formato";

const campoClase = "w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

export default function CerrarCaja() {
  const router = useRouter();
  const tienePermiso = usePermisos();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const puedeGestionarCaja = tienePermiso("OPERAR_CAJA");
  const { establecimientoId } = useEstablecimientoActivo();
  const { caja } = useCajaAbierta(establecimientoId);
  const acciones = useAccionesCaja(establecimientoId);
  const queryClient = useQueryClient();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const turno = caja?.turno ?? null;

  const [efectivoReal, setEfectivoReal] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  // cerrarCaja() vacía el turno abierto y dispara la navegación a
  // /cerrado/{id} en el mismo tick — sin esto, el efecto de abajo
  // (que existe para cuando alguien llega a /cerrar sin caja abierta)
  // alcanza a hacer su propio replace a /panel/caja y pisa esa
  // navegación intencional.
  const cerrandoRef = useRef(false);


  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && !puedeGestionarCaja) router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, puedeGestionarCaja, router]);

  useEffect(() => {
    if (!bloqueadoPorCaja && puedeGestionarCaja && !turno && !cerrandoRef.current) router.replace("/panel/caja");
  }, [bloqueadoPorCaja, puedeGestionarCaja, turno, router]);

  if (bloqueadoPorCaja || !puedeGestionarCaja || !turno) return <div className="min-h-dvh bg-humo" />;

  // El saldo teórico lo calcula el backend, no el cliente.
  const saldoTeorico = caja?.saldoTeoricoEfectivo ?? 0;
  const diferencia = efectivoReal - saldoTeorico;
  const colorDiferencia = diferencia > 0 ? "text-disponible" : diferencia < 0 ? "text-cancelado" : "text-grafito";
  const etiquetaDiferencia = diferencia > 0 ? "Sobrante" : diferencia < 0 ? "Faltante" : "Sin diferencia";

  /**
   * El ticket se dibuja con la respuesta de ESTA mutación, que se deja en el
   * cache: releerlo es GET /caja/turnos/{id}, que es OWNER/ADMIN, así que un
   * empleado que cierre la caja no podría volver a verlo.
   */
  async function confirmarCierre() {
    cerrandoRef.current = true;
    setErrorAccion(null);
    try {
      const cierre = await acciones.cerrar.mutateAsync({
        turnoId: turno!.id,
        body: { saldoRealContado: efectivoReal, observaciones: observaciones || undefined },
      });
      queryClient.setQueryData(keys.caja.cierre(establecimientoId ?? 0, cierre.turnoId), cierre);
      setConfirmando(false);
      router.push(`/panel/caja/cerrado/${cierre.turnoId}`);
    } catch (e) {
      cerrandoRef.current = false;
      setConfirmando(false);
      setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos cerrar la caja.");
    }
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <button
            type="button"
            onClick={() => router.push("/panel/caja")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver a Caja
          </button>

          <div className="mx-auto max-w-lg space-y-6">
            {errorAccion && (
              <p role="alert" className="rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
                {errorAccion}
              </p>
            )}
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Arqueo de caja</h1>

            <div className="rounded-card bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Saldo teórico en efectivo</p>
              <p className="mt-1.5 font-display text-3xl font-extrabold tabular-nums text-tinta">{formatearPrecio(saldoTeorico)}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmando(true);
              }}
              className="space-y-4 rounded-card bg-white p-6 shadow-card"
            >
              <div>
                <label htmlFor="efectivo-real" className="mb-1 block text-xs font-semibold text-grafito">
                  Efectivo real contado
                </label>
                <input
                  id="efectivo-real"
                  type="number"
                  min={0}
                  required
                  autoFocus
                  value={efectivoReal}
                  onChange={(e) => setEfectivoReal(Number(e.target.value))}
                  className={campoClase}
                />
              </div>

              <div className="rounded-input bg-humo px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-grafito">{etiquetaDiferencia}</p>
                <p className={`mt-1 font-display text-xl font-extrabold tabular-nums ${colorDiferencia}`}>
                  {diferencia > 0 ? "+" : ""}
                  {formatearPrecio(diferencia)}
                </p>
              </div>

              <div>
                <label htmlFor="observaciones" className="mb-1 block text-xs font-semibold text-grafito">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="observaciones"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className={campoClase}
                />
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-full bg-tinta font-display text-sm font-bold text-white transition-colors hover:bg-tinta/90 focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cerrar caja
              </button>
            </form>
          </div>
        </main>
      </div>

      {confirmando && (
        <ModalPanel titulo="Confirmar cierre de caja" onClose={() => setConfirmando(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Vas a cerrar la caja con <span className="font-semibold">{formatearPrecio(efectivoReal)}</span> de efectivo real contado
              {diferencia !== 0 && (
                <>
                  {" "}
                  (<span className={`font-semibold ${colorDiferencia}`}>{diferencia > 0 ? "sobrante" : "faltante"} de {formatearPrecio(Math.abs(diferencia))}</span>)
                </>
              )}
              . Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCierre}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-tinta font-display text-sm font-bold text-white transition-colors hover:bg-tinta/90 focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Confirmar cierre
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
