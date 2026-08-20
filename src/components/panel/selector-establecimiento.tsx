"use client";

import { Selector } from "@/components/saque/selector";
import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";

const OPCION_CREAR = "__crear__";

/**
 * Cambia cuál establecimiento está activo en el panel. Sólo para OWNER/ADMIN
 * — un EMPLOYEE tiene uno solo y no elige nada. Siempre visible para esos
 * roles, aunque tengan un único complejo: es la forma de descubrir que se
 * puede agregar otro.
 *
 * "+ Agregar complejo" viaja como una opción más del `<select>` nativo (no
 * hay otro lugar para alojarlo sin salir del componente Selector que ya usa
 * el resto de la app) y no cambia la selección real: sólo abre el modal. Si
 * ya se llegó al límite de 3, el modal es quien avisa y no deja guardar —
 * acá no se oculta la opción para no esconder por qué "no pasa nada" al
 * elegirla.
 *
 * Con CERO establecimientos (recién registrado, todavía no creó ninguno) no
 * hay nada que un <select> pueda mostrar como "seleccionado" distinto de la
 * propia opción de crear, así que un click sobre la MISMA opción ya elegida
 * no dispara onChange en el navegador y el modal nunca se abriría. Para ese
 * caso puntual se muestra un botón en vez del select.
 */
export function SelectorEstablecimiento({ onCrear }: { onCrear: () => void }) {
  const { data: perfil } = usePerfil();
  const { establecimientoId, misEstablecimientos, seleccionarEstablecimiento, cargando } =
    useEstablecimientoActivo();

  const esDuenoOAdmin = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";
  if (!esDuenoOAdmin) return null;

  if (cargando) {
    return <div className="h-6 w-40 animate-pulse rounded bg-humo" aria-hidden />;
  }

  if (misEstablecimientos.length === 0) {
    return (
      <button type="button" onClick={onCrear} className="font-display text-sm font-bold text-azul hover:underline">
        + Agregar complejo
      </button>
    );
  }

  const opciones = [
    ...misEstablecimientos.map((e) => ({ valor: String(e.id), etiqueta: e.nombre })),
    { valor: OPCION_CREAR, etiqueta: "+ Agregar complejo" },
  ];

  function manejarCambio(valor: string) {
    if (valor === OPCION_CREAR) {
      onCrear();
      return;
    }
    seleccionarEstablecimiento(Number(valor));
  }

  return (
    <Selector
      id="selector-establecimiento"
      value={String(establecimientoId)}
      onChange={manejarCambio}
      opciones={opciones}
    />
  );
}
