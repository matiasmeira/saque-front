"use client";

import { useState } from "react";
import { ArrowRight, LayoutGrid, Plus } from "lucide-react";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { FormCancha } from "@/components/panel/form-cancha";
import { etiquetaDeporte } from "@/lib/deportes";
import { validarPasoCanchas } from "@/lib/panel/wizard-onboarding";
import type { DatosCancha } from "@/lib/api/adaptadores/canchas";
import type { CanchaResponse } from "@/lib/api/tipos/canchas";
import type { Bloqueo, Cancha } from "@/lib/panel/canchas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; canchaId: number } | null;

/** Resumen simplificado — no la tabla completa de /panel/canchas: nombre, deportes, precio "desde", estado. */
function ListaCanchasWizard({
  canchas,
  onEditar,
  onDesactivar,
}: {
  canchas: Cancha[];
  onEditar: (cancha: Cancha) => void;
  onDesactivar: (cancha: Cancha) => void;
}) {
  return (
    <ul className="space-y-2">
      {canchas.map((c) => {
        const desde = c.preciosBase.length > 0 ? Math.min(...c.preciosBase.map((p) => p.precio)) : null;
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-input border border-borde p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-tinta">{c.nombre}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    c.isActive ? "bg-disponible-suave text-disponible" : "bg-humo text-grafito"
                  }`}
                >
                  {c.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.deportes.map((d) => (
                  <span key={d} className="rounded-full bg-humo px-2 py-0.5 text-[11px] font-semibold text-grafito">
                    {etiquetaDeporte(d)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {desde !== null && <span className="text-sm text-grafito">desde ${desde}</span>}
              <button type="button" onClick={() => onEditar(c)} className="text-xs font-semibold text-azul hover:underline">
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDesactivar(c)}
                className="text-xs font-semibold text-cancelado hover:underline"
              >
                Desactivar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PasoCanchas({
  canchas,
  canchasCrudas,
  requiereSena,
  montoSenaDefault,
  bloqueosDeCanchaEnEdicion,
  guardando,
  desactivando,
  error,
  onAbrirEdicion,
  onCrear,
  onActualizar,
  onDesactivar,
  onAgregarBloqueo,
  onQuitarBloqueo,
  onContinuar,
}: {
  /** ya adaptadas a la forma del panel, listas para FormCancha/la lista */
  canchas: Cancha[];
  /** crudas del backend — se lo que necesita validarPasoCanchas (usa montoSena: number | null) */
  canchasCrudas: CanchaResponse[];
  requiereSena: boolean;
  montoSenaDefault: number;
  bloqueosDeCanchaEnEdicion: Bloqueo[];
  guardando: boolean;
  desactivando: boolean;
  error: string | null;
  onAbrirEdicion: (canchaId: number) => void;
  onCrear: (datos: DatosCancha) => void;
  onActualizar: (id: number, datos: DatosCancha) => void;
  onDesactivar: (id: number) => void;
  onAgregarBloqueo: (bloqueo: Bloqueo) => void;
  onQuitarBloqueo: (indice: number) => void;
  onContinuar: () => void;
}) {
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [aDesactivar, setADesactivar] = useState<Cancha | null>(null);
  const [errorGate, setErrorGate] = useState<string | null>(null);

  const canchaEditandoId = panelAbierto?.tipo === "editar" ? panelAbierto.canchaId : null;
  const canchaEnEdicion = canchaEditandoId ? canchas.find((c) => c.id === canchaEditandoId) : undefined;

  function abrirEdicion(cancha: Cancha) {
    onAbrirEdicion(cancha.id);
    setPanelAbierto({ tipo: "editar", canchaId: cancha.id });
  }

  function continuar() {
    const errores = validarPasoCanchas(canchasCrudas, requiereSena);
    const mensaje = errores.canchas ?? errores.sena;
    if (mensaje) {
      setErrorGate(mensaje);
      return;
    }
    setErrorGate(null);
    onContinuar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-tinta">Canchas</h2>
          <p className="mt-1 text-sm text-grafito">Cargá al menos una cancha para poder recibir turnos.</p>
        </div>
        <button
          type="button"
          onClick={() => setPanelAbierto({ tipo: "nueva" })}
          disabled={guardando}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden />
          Nueva cancha
        </button>
      </div>

      {canchas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-borde py-14 text-center">
          <LayoutGrid className="size-7 text-grafito" aria-hidden />
          <p className="text-sm font-semibold text-tinta">Todavía no cargaste ninguna cancha</p>
        </div>
      ) : (
        <ListaCanchasWizard canchas={canchas} onEditar={abrirEdicion} onDesactivar={setADesactivar} />
      )}

      {(error || errorGate) && (
        <p className="text-sm text-cancelado" role="alert">
          {error ?? errorGate}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <span />
        <button
          type="button"
          onClick={continuar}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva cancha" onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={null}
            canchasExistentes={canchas}
            montoSenaSugerido={montoSenaDefault}
            onGuardar={(datos) => {
              onCrear(datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={() => {}}
            onQuitarBloqueo={() => {}}
          />
        </DrawerPanel>
      )}

      {canchaEnEdicion && (
        <DrawerPanel titulo="Editar cancha" subtitulo={canchaEnEdicion.nombre} onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={{ ...canchaEnEdicion, mantenimientos: bloqueosDeCanchaEnEdicion }}
            canchasExistentes={canchas}
            onGuardar={(datos) => {
              onActualizar(canchaEnEdicion.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={onAgregarBloqueo}
            onQuitarBloqueo={onQuitarBloqueo}
          />
        </DrawerPanel>
      )}

      {aDesactivar && (
        <ModalPanel titulo="¿Desactivar esta cancha?" subtitulo={aDesactivar.nombre} onClose={() => setADesactivar(null)}>
          <p className="text-sm text-grafito">
            Deja de recibir turnos y desaparece del listado.{" "}
            <strong className="text-tinta">Esta acción no se puede deshacer</strong>: para volver a tenerla vas a
            tener que crearla de nuevo.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setADesactivar(null)}
              className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                onDesactivar(aDesactivar.id);
                setADesactivar(null);
              }}
              disabled={desactivando}
              className="h-11 flex-1 rounded-full bg-cancelado text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {desactivando ? "Desactivando..." : "Sí, desactivar"}
            </button>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
