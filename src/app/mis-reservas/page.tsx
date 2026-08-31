"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { HeaderPublico } from "@/components/canche/header-publico";
import { FooterPublico } from "@/components/canche/footer-publico";
import { ReservaCard } from "@/components/canche/reserva-card";
import { EmptyState } from "@/components/canche/empty-state";
import { ModalPanel } from "@/components/panel/modal-panel";
import { reservas as endpointReservas } from "@/lib/api/endpoints/reservas";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHoraActual } from "@/lib/hora-actual";
import type { ReservaResponse } from "@/lib/api/tipos/reservas";

type Tab = "proximas" | "anteriores";

/**
 * A9 · Mis reservas.
 *
 * GET /api/v1/reservas/mis-reservas es exclusivo del rol PLAYER: un OWNER
 * recibe 403. Se trae una sola página y se parte en dos pestañas del lado del
 * cliente comparando fechaHoraInicio contra ahora — el backend no ofrece un
 * filtro "próximas/pasadas", sólo por estado.
 *
 * El plazo de cancelación lo valida el backend contra la política del
 * establecimiento, que ningún DTO expone. Por eso acá no se pre-calcula nada:
 * se ofrece cancelar y se muestra el mensaje del 400 si no corresponde.
 */
export default function MisReservas() {
  const queryClient = useQueryClient();
  const haySesion = useHaySesion();
  const { data: perfil } = usePerfil();

  const [tab, setTab] = useState<Tab>("proximas");
  const [aCancelar, setACancelar] = useState<ReservaResponse | null>(null);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: keys.reservas.mias(),
    queryFn: () => endpointReservas.mias({ size: 50 }),
    enabled: haySesion,
  });

  const cancelar = useMutation({
    mutationFn: (id: number) => endpointReservas.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reservas.todas() });
      setACancelar(null);
      setErrorCancelacion(null);
    },
    onError: (e) => {
      setErrorCancelacion(
        e instanceof ApiError ? mensajeVisible(e) : "No pudimos cancelar la reserva.",
      );
    },
  });

  // Date.now() en render es impuro para el React Compiler
  // (react-hooks/purity). useHoraActual es la fuente externa que ya usa el
  // proyecto para el "ahora", y de paso reevalúa las pestañas cada minuto.
  const ahora = useHoraActual().getTime();
  const todas = consulta.data?.content ?? [];
  const proximas = todas
    .filter(
      (r) =>
        new Date(r.fechaHoraInicio).getTime() >= ahora &&
        (r.estado === "CONFIRMADA" || r.estado === "PENDIENTE_SENA"),
    )
    .sort(
      (a, b) =>
        new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime(),
    );
  const anteriores = todas.filter((r) => !proximas.includes(r));
  const visibles = tab === "proximas" ? proximas : anteriores;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
          Mis reservas
        </h1>

        {!haySesion ? (
          <div className="mt-8">
            <EmptyState
              titulo="Ingresá para ver tus reservas"
              descripcion="Necesitás una cuenta para reservar y seguir tus turnos."
              salidas={[{ label: "Ingresar o crear cuenta", href: "/ingresar" }]}
              ctaLabel="Ingresar"
            />
          </div>
        ) : perfil && perfil.rol !== "PLAYER" ? (
          /*
            El endpoint es @PreAuthorize("hasRole('PLAYER')"): con una sesión de
            dueño o empleado devuelve 403. Se dice en vez de mostrar un error.
          */
          <div className="mt-8">
            <EmptyState
              titulo="Esta sección es para jugadores"
              descripcion="Tu cuenta administra un complejo. Los turnos se gestionan desde el panel."
              salidas={[{ label: "Ir al panel", href: "/panel/agenda" }]}
              ctaLabel="Ir al panel"
            />
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-2">
              {(["proximas", "anteriores"] as const).map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setTab(valor)}
                  className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors ${
                    tab === valor
                      ? "bg-azul text-white"
                      : "bg-white text-grafito hover:text-azul"
                  }`}
                >
                  {valor === "proximas" ? "Próximas" : "Anteriores"}
                </button>
              ))}
            </div>

            {consulta.isPending && (
              <p className="mt-8 text-sm text-grafito">Cargando tus reservas...</p>
            )}

            {consulta.isError && (
              <p className="mt-8 text-sm text-cancelado" role="alert">
                {consulta.error instanceof ApiError
                  ? mensajeVisible(consulta.error)
                  : "No pudimos cargar tus reservas."}
              </p>
            )}

            {consulta.isSuccess && visibles.length === 0 && (
              <div className="mt-8">
                <EmptyState
                  titulo={
                    tab === "proximas"
                      ? "No tenés turnos próximos"
                      : "Todavía no jugaste ninguno"
                  }
                  descripcion="Buscá una cancha cerca tuyo y reservá en 30 segundos."
                  salidas={[{ label: "Buscar canchas", href: "/buscar" }]}
                  ctaLabel="Buscar canchas"
                />
              </div>
            )}

            <div className="mt-6 space-y-4">
              {visibles.map((reserva, i) => (
                <ReservaCard
                  key={reserva.id}
                  reserva={reserva}
                  destacada={tab === "proximas" && i === 0}
                  onCancelar={setACancelar}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {aCancelar && (
      <ModalPanel
        onClose={() => {
          setACancelar(null);
          setErrorCancelacion(null);
        }}
        titulo="¿Cancelar esta reserva?"
      >
        <p className="text-sm text-grafito">
          El turno vuelve a quedar disponible para otros jugadores. Según la política del
          complejo, puede haber un plazo mínimo para cancelar sin cargo.
        </p>

        {errorCancelacion && (
          <p role="alert" className="mt-3 text-sm text-cancelado">
            {errorCancelacion}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setACancelar(null);
              setErrorCancelacion(null);
            }}
            className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => aCancelar && cancelar.mutate(aCancelar.id)}
            disabled={cancelar.isPending}
            className="h-11 flex-1 rounded-full bg-cancelado text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {cancelar.isPending ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </ModalPanel>
      )}

      <div className="px-5 pb-10 text-center sm:px-8">
        <Link href="/buscar" className="text-sm font-semibold text-azul hover:underline">
          Buscar otra cancha
        </Link>
      </div>

      <FooterPublico />
    </div>
  );
}
