"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarX2, X } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { EmptyState } from "@/components/saque/empty-state";
import { ReservaCard } from "@/components/saque/reserva-card";
import { useUsuario } from "@/lib/usuario";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import {
  complejoDeReserva,
  esProxima,
  RESERVAS_JUGADOR,
  type ReservaJugador,
} from "@/mocks/reservas-jugador";

type EstadoCarga = "cargando" | "error" | "listo";
type Pestania = "proximas" | "anteriores";

function fechaHoraMs(reserva: ReservaJugador): number {
  return new Date(`${reserva.fecha}T${reserva.hora}:00`).getTime();
}

// ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo patrón que
// el resto de la app. El gate de sesión se resuelve DESPUÉS de la
// carga simulada (500ms): useUsuario() vuelve del snapshot neutro
// del servidor (null) y se corrige al montar, pero nunca hay forma
// de distinguir "todavía sincronizando" de "no hay sesión" con una
// sola lectura — esperar a que termine el fetch simulado da tiempo
// de sobra para que ya esté sincronizado, sin redirigir en un efecto
// sobre un valor transitorio (mismo error que ya se pisó en Zona E).
export default function MisReservas() {
  const searchParams = useSearchParams();
  const usuario = useUsuario();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [reservas, setReservas] = useState<ReservaJugador[]>([]);
  const [pestania, setPestania] = useState<Pestania>("proximas");
  const [reintento, setReintento] = useState(0);
  const [aCancelar, setACancelar] = useState<ReservaJugador | null>(null);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setReservas(mockVacio ? [] : RESERVAS_JUGADOR.map((r) => ({ ...r })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  function confirmarCancelacion() {
    if (!aCancelar) return;
    setReservas((prev) => prev.map((r) => (r.id === aCancelar.id ? { ...r, estado: "cancelada" } : r)));
    setACancelar(null);
  }

  const proximas = reservas.filter(esProxima).sort((a, b) => fechaHoraMs(a) - fechaHoraMs(b));
  const anteriores = reservas.filter((r) => !esProxima(r)).sort((a, b) => fechaHoraMs(b) - fechaHoraMs(a));
  const [destacada, ...masAdelante] = proximas;

  const complejoACancelar = aCancelar ? complejoDeReserva(aCancelar) : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">Mis reservas</h1>

          {estadoCarga === "cargando" && (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-card bg-white" />
              ))}
            </div>
          )}

          {estadoCarga === "error" && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar tus reservas.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && !usuario && (
            <div className="mt-6">
              <EmptyState
                titulo="Iniciá sesión para ver tus reservas"
                descripcion="Tus turnos quedan asociados a la cuenta con la que reservaste."
                salidas={[{ label: "Ingresar", href: "/ingresar" }]}
              />
            </div>
          )}

          {estadoCarga === "listo" && usuario && reservas.length === 0 && (
            <div className="mt-6">
              <EmptyState
                titulo="Todavía no reservaste nada"
                descripcion="Buscá una cancha disponible cerca tuyo y asegurá tu turno en minutos."
                salidas={[{ label: "Buscar canchas", href: "/buscar" }]}
              />
            </div>
          )}

          {estadoCarga === "listo" && usuario && reservas.length > 0 && (
            <>
              <div className="mt-5 flex rounded-full border border-borde bg-white p-1">
                <button
                  type="button"
                  onClick={() => setPestania("proximas")}
                  className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${
                    pestania === "proximas" ? "bg-tinta text-white" : "text-grafito hover:text-tinta"
                  }`}
                >
                  Próximas
                </button>
                <button
                  type="button"
                  onClick={() => setPestania("anteriores")}
                  className={`h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${
                    pestania === "anteriores" ? "bg-tinta text-white" : "text-grafito hover:text-tinta"
                  }`}
                >
                  Anteriores
                </button>
              </div>

              {pestania === "proximas" && (
                <div className="mt-5">
                  {proximas.length === 0 ? (
                    <EmptyState
                      titulo="No tenés reservas próximas"
                      descripcion="Cuando reserves un turno, va a aparecer acá."
                      salidas={[{ label: "Buscar canchas", href: "/buscar" }]}
                    />
                  ) : (
                    <>
                      <ReservaCard reserva={destacada} destacada onCancelar={setACancelar} />

                      {masAdelante.length > 0 && (
                        <div className="mt-6">
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-grafito">Más adelante</p>
                          <div className="space-y-3">
                            {masAdelante.map((r) => (
                              <ReservaCard key={r.id} reserva={r} onCancelar={setACancelar} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {pestania === "anteriores" && (
                <div className="mt-5">
                  {anteriores.length === 0 ? (
                    <EmptyState titulo="Todavía no tenés reservas anteriores" salidas={[]} />
                  ) : (
                    <div className="space-y-3">
                      {anteriores.map((r) => (
                        <ReservaCard key={r.id} reserva={r} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <FooterPublico />

      {aCancelar && complejoACancelar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setACancelar(null)}
            className="absolute inset-0 bg-tinta/40"
          />
          <div className="relative z-10 w-full rounded-t-card bg-white p-6 sm:max-w-sm sm:rounded-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CalendarX2 className="size-5 shrink-0 text-cancelado" aria-hidden />
                <h2 className="font-display text-lg font-bold text-tinta">Cancelar reserva</h2>
              </div>
              <button
                type="button"
                onClick={() => setACancelar(null)}
                aria-label="Cerrar"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <p className="text-sm text-tinta">
              {complejoACancelar.nombre} · {fechaLarga(aCancelar.fecha)}, {aCancelar.hora}
            </p>
            <p className="mt-2 text-sm text-grafito">
              {aCancelar.senia > 0
                ? `Estás dentro del plazo que pide el complejo (hasta ${aCancelar.horasLimiteCancelacion}hs antes) — te devolvemos la seña de ${formatearPrecio(aCancelar.senia)} completa.`
                : "Esta reserva no tenía seña online, así que no hay nada que reembolsar."}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setACancelar(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90"
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
