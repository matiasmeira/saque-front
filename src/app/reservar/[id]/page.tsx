"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Info, Loader2 } from "lucide-react";

import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { CountdownBadge } from "@/components/saque/countdown-badge";
import { publico } from "@/lib/api/endpoints/publico";
import { reservas } from "@/lib/api/endpoints/reservas";
import { keys } from "@/lib/api/keys";
import { partirFechaHora } from "@/lib/api/fechas";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { etiquetaDeporte } from "@/lib/deportes";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { useHaySesion } from "@/hooks/api/use-sesion";
import type { Deporte } from "@/lib/api/tipos/comunes";
import type { ReservaResponse } from "@/lib/api/tipos/reservas";

/**
 * A7 · Checkout.
 *
 * Llega desde la grilla del detalle con el SLOT ENTERO en la URL: canchaId,
 * inicio y fin son exactamente los campos de ReservaRequest, así que no se
 * recalcula nada. Recalcular el fin desde una duración es la forma de comerse
 * un 400 por duración no permitida o por inicio fuera de :00/:30.
 *
 * El contador de 10 minutos YA NO es del cliente: sale de
 * ReservaResponse.expiraEn, que el backend fija al crear la prereserva. Y por
 * eso mismo sólo empieza cuando la reserva existe de verdad — antes vivía en
 * sessionStorage y no bloqueaba nada.
 *
 * BLOQUEO CONOCIDO (ver PLAN_CONEXION.md, B1): el jugador puede crear la
 * prereserva pero NO confirmarla. PUT /reservas/{id}/confirmar exige rol
 * OWNER o ADMIN, y no hay ninguna integración de pagos en el backend
 * (MERCADO_PAGO es sólo un valor del enum MetodoPago). La reserva queda en
 * PENDIENTE_SENA y, si nadie la confirma, un job la pasa a
 * CANCELADA_PRERESERVA a los 10 minutos. La UI lo dice explícitamente en vez
 * de simular un pago que no existe.
 */
export default function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const haySesion = useHaySesion();

  const canchaId = Number(searchParams.get("cancha"));
  const inicio = searchParams.get("inicio");
  const fin = searchParams.get("fin");
  const deporte = searchParams.get("deporte") as Deporte | null;

  const [reserva, setReserva] = useState<ReservaResponse | null>(null);
  const [vencida, setVencida] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complejo = useQuery({
    queryKey: keys.publico.detalle(slug),
    queryFn: () => publico.detalle(slug),
  });

  const crear = useMutation({
    mutationFn: () =>
      reservas.crear({
        canchaId,
        fechaHoraInicio: inicio!,
        fechaHoraFin: fin!,
        deporteSeleccionado: deporte!,
      }),
    onSuccess: setReserva,
  });

  const datosCompletos = Number.isFinite(canchaId) && canchaId > 0 && inicio && fin && deporte;

  if (!datosCompletos) {
    return (
      <Marco>
        <h1 className="font-display text-xl font-bold text-tinta">No encontramos esa reserva</h1>
        <p className="mt-2 max-w-sm text-grafito">
          El enlace puede estar vencido o incompleto. Volvé a elegir el horario.
        </p>
        <Link
          href="/buscar"
          className="mt-6 flex h-12 items-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
        >
          Buscar canchas
        </Link>
      </Marco>
    );
  }

  const { fecha, hora } = partirFechaHora(inicio);
  const duracionMin = Math.round(
    (new Date(fin).getTime() - new Date(inicio).getTime()) / 60000,
  );
  const cancha = complejo.data?.canchas.find((c) => c.id === canchaId);
  const requiereSena = complejo.data?.requiereSena ?? false;

  async function reservar() {
    setError(null);
    if (!haySesion) {
      const destino = `/reservar/${slug}?cancha=${canchaId}&inicio=${inicio}&fin=${fin}&deporte=${deporte}`;
      router.push(`/ingresar?volverA=${encodeURIComponent(destino)}`);
      return;
    }
    try {
      await crear.mutateAsync();
    } catch (e) {
      setError(
        e instanceof ApiError ? mensajeVisible(e) : "No pudimos crear la reserva.",
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      {reserva?.expiraEn && !vencida && (
        <CountdownBadge
          deadline={new Date(reserva.expiraEn).getTime()}
          etiquetaTurno={`${fechaLarga(fecha)}, ${hora}`}
          onVencido={() => setVencida(true)}
        />
      )}

      <main className="flex-1 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Link
            href={`/complejo/${slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver
          </Link>

          <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
            {reserva ? "Tu turno quedó reservado" : "Confirmá tu reserva"}
          </h1>
          <p className="mt-1 text-grafito">
            {reserva
              ? "Te lo guardamos por unos minutos."
              : "Revisá los detalles antes de confirmar."}
          </p>

          <div className="mt-6 rounded-card bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-tinta">
              {complejo.data?.nombre ?? "Cargando..."}
            </h2>
            <p className="mt-1 text-sm text-grafito">
              {cancha?.nombre ?? reserva?.canchaNombre ?? "—"} · {etiquetaDeporte(deporte)}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-input bg-humo p-4">
                <CalendarDays className="size-5 shrink-0 text-azul" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-grafito">
                    Fecha y hora
                  </p>
                  <p className="font-display font-semibold text-tinta">
                    {fechaLarga(fecha)}, {hora}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-input bg-humo p-4">
                <Clock className="size-5 shrink-0 text-azul" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-grafito">
                    Duración
                  </p>
                  <p className="font-display font-semibold text-tinta">{duracionMin} minutos</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-borde pt-6">
              <div className="flex items-center justify-between text-grafito">
                <span>Total de la cancha</span>
                <span className="font-display font-semibold text-tinta">
                  {/* El precio real lo calcula el backend al crear la reserva
                      (aplica tarifas por día y horario). Antes de eso sólo se
                      puede mostrar el "desde" del complejo. */}
                  {reserva
                    ? formatearPrecio(reserva.precioTotal)
                    : cancha?.precioDesde !== null && cancha?.precioDesde !== undefined
                      ? `desde ${formatearPrecio(cancha.precioDesde)}`
                      : "—"}
                </span>
              </div>

              {requiereSena && complejo.data?.senaDesde !== null && (
                <p className="mt-2 text-sm text-grafito">
                  Este complejo pide una seña desde{" "}
                  {formatearPrecio(complejo.data?.senaDesde ?? 0)} para confirmar.
                </p>
              )}
            </div>

            {reserva ? (
              <EstadoPrereserva reserva={reserva} vencida={vencida} />
            ) : (
              <>
                <button
                  type="button"
                  onClick={reservar}
                  disabled={crear.isPending || complejo.isPending}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-azul font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                >
                  {crear.isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
                  {crear.isPending
                    ? "Reservando..."
                    : haySesion
                      ? "Reservar este turno"
                      : "Ingresar para reservar"}
                </button>

                {error && (
                  <p role="alert" className="mt-4 text-center text-sm text-cancelado">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <FooterPublico />
    </div>
  );
}

/**
 * Estado posterior a crear la prereserva. Es donde se hace visible el bloqueo
 * B1: no hay forma de que el jugador pague ni confirme desde acá.
 */
function EstadoPrereserva({
  reserva,
  vencida,
}: {
  reserva: ReservaResponse;
  vencida: boolean;
}) {
  if (vencida || reserva.estado === "CANCELADA_PRERESERVA") {
    return (
      <div className="mt-6 rounded-input bg-humo p-5 text-center">
        <p className="font-display font-bold text-tinta">Se venció el tiempo de reserva</p>
        <p className="mt-1 text-sm text-grafito">
          El turno volvió a quedar disponible para otros jugadores.
        </p>
        <Link
          href="/buscar"
          className="mt-4 inline-flex h-11 items-center rounded-full border border-azul px-5 text-sm font-semibold text-azul transition-colors hover:bg-azul hover:text-white"
        >
          Buscar otro horario
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-start gap-3 rounded-input bg-disponible-suave p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-disponible" aria-hidden />
        <div>
          <p className="font-display font-bold text-tinta">Reserva #{reserva.id} creada</p>
          <p className="mt-1 text-sm text-grafito">
            Total: {formatearPrecio(reserva.precioTotal)}
          </p>
        </div>
      </div>

      {/*
        No se simula un pago que el backend no puede procesar: no hay
        integración de cobro y confirmar la reserva exige rol OWNER/ADMIN.
        Decirlo es más honesto que mostrar un botón que no hace nada.
      */}
      <div className="flex items-start gap-3 rounded-input border border-borde bg-white p-5">
        <Info className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
        <div>
          <p className="font-semibold text-tinta">Falta confirmar el pago de la seña</p>
          <p className="mt-1 text-sm leading-relaxed text-grafito">
            El pago online todavía no está disponible. Comunicate con el complejo para
            confirmar el turno antes de que se venza el tiempo.
          </p>
        </div>
      </div>

      <Link
        href="/mis-reservas"
        className="flex h-12 w-full items-center justify-center rounded-full border border-azul font-display text-sm font-bold text-azul transition-colors hover:bg-azul hover:text-white"
      >
        Ver mis reservas
      </Link>
    </div>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        {children}
      </main>
      <FooterPublico />
    </div>
  );
}
