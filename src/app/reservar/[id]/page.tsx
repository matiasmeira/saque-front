"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  Landmark,
  Loader2,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { CountdownBadge } from "@/components/saque/countdown-badge";
import { DEPORTES } from "@/mocks/deportes";
import { COMPLEJOS } from "@/mocks/complejos";
import { fechaLarga, formatearPrecio } from "@/lib/formato";
import { asegurarReservaCongelada, etiquetaTurno, useIntencion } from "@/lib/reserva-intencion";
import { useUsuario } from "@/lib/usuario";

// TODO backend: acá va MercadoPago Split de Pagos. La comisión de
// saque ($450 fijos por reserva) se descuenta de la seña en la
// liquidación al complejo — no se le muestra al jugador, es entre
// saque y el complejo, no parte de lo que él paga.
//
// ?mockPago=rechazado o ?mockPago=pendiente en la URL fuerzan esos
// dos estados para poder probarlos sin backend real. Sin el param,
// el pago se aprueba — es el único mock que tiene sentido dejar
// como default, porque es el camino feliz que hay que poder ver
// sin acordarse de un query param.
//
// El contador de 10 minutos arranca ACÁ, y solo con el click de
// confirmar/pagar — nunca al cargar la página. Si arrancara con
// solo visitar la URL, un bot podría pegarle a todos los horarios
// de todas las canchas y bloquear la disponibilidad real sin
// registrarse ni pagar nunca. Si además no hay usuario logueado, el
// mismo click manda a /ingresar en vez de arrancar el reloj.
//
// Al aprobarse el pago (con o sin seña) no hay estado "aprobado"
// local: se navega directo a A8 (/reservar/[id]/ok), que es la
// pantalla de confirmación real — acá nunca llegó a mostrarse nada.
type EstadoPago = "idle" | "procesando" | "rechazado" | "pendiente";

export default function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const intencion = useIntencion();
  const usuario = useUsuario();

  const canchaId = searchParams.get("cancha");
  const fecha = searchParams.get("fecha");
  const hora = searchParams.get("hora");
  const mockPago = searchParams.get("mockPago");

  const [estado, setEstado] = useState<EstadoPago>("idle");
  const [vencido, setVencido] = useState(false);

  const complejo = COMPLEJOS.find((c) => c.id === id);
  const cancha = complejo?.canchas.find((c) => c.id === canchaId);
  const datosCompletos = Boolean(complejo && cancha && fecha && hora);

  if (!datosCompletos || !complejo || !cancha || !fecha || !hora || !canchaId) {
    return (
      <div className="flex min-h-dvh flex-col bg-humo">
        <HeaderPublico variant="claro" />
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
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
        </main>
        <FooterPublico />
      </div>
    );
  }

  // Ya se validó arriba que existen — bindings con tipo string
  // "sólido" para que el narrowing valga también adentro del closure
  // de confirmarOPagar (TS no propaga el narrowing del guard hacia
  // adentro de una función anidada).
  const canchaIdValida: string = canchaId;
  const fechaValida: string = fecha;
  const horaValida: string = hora;

  const tieneSenia = cancha.senia > 0;
  const deadline =
    intencion?.complejo === id &&
    intencion?.cancha === canchaIdValida &&
    intencion?.fecha === fechaValida &&
    intencion?.hora === horaValida
      ? intencion.deadline
      : undefined;

  const deporteLabel = DEPORTES.find((d) => d.valor === cancha.deporte)?.etiqueta ?? cancha.deporte;
  const resto = cancha.precio - cancha.senia;

  function confirmarOPagar() {
    if (estado === "procesando" || vencido) return;

    if (!usuario) {
      router.push(`/ingresar?complejo=${id}&cancha=${canchaIdValida}&fecha=${fechaValida}&hora=${horaValida}`);
      return;
    }

    if (tieneSenia) {
      asegurarReservaCongelada({ complejo: id, cancha: canchaIdValida, fecha: fechaValida, hora: horaValida });
    }

    setEstado("procesando");
    // TODO backend: acá va el alta de la preferencia de pago y el
    // redirect/embed real de MercadoPago (o, sin seña, la
    // confirmación directa de la reserva). El mock solo espera y
    // resuelve según ?mockPago.
    setTimeout(() => {
      const urlConfirmada = `/reservar/${id}/ok?cancha=${canchaIdValida}&fecha=${fechaValida}&hora=${horaValida}`;
      if (!tieneSenia) {
        router.push(urlConfirmada);
      } else if (mockPago === "rechazado") {
        setEstado("rechazado");
      } else if (mockPago === "pendiente") {
        setEstado("pendiente");
      } else {
        router.push(urlConfirmada);
      }
    }, 1600);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />
      {deadline && (
        <CountdownBadge
          deadline={deadline}
          etiquetaTurno={etiquetaTurno(fecha, hora)}
          onVencido={() => setVencido(true)}
        />
      )}

      <main className="flex-1 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Link
            href={`/complejo/${complejo.slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-grafito transition-colors hover:text-azul"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver
          </Link>

          <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
            Confirmá tu reserva
          </h1>
          <p className="mt-1 text-grafito">Revisá los detalles antes de confirmar.</p>

          <div className="mt-6 rounded-card bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-tinta">{complejo.nombre}</h2>
            <p className="mt-1 text-sm text-grafito">
              {cancha.nombre} · {deporteLabel}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-input bg-humo p-4">
                <CalendarDays className="size-5 shrink-0 text-azul" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-grafito">Fecha y hora</p>
                  <p className="font-display font-semibold text-tinta">
                    {fechaLarga(fecha)}, {hora}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-input bg-humo p-4">
                <Clock className="size-5 shrink-0 text-azul" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-grafito">Duración</p>
                  <p className="font-display font-semibold text-tinta">{cancha.duracionMin} minutos</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-borde pt-6">
              {tieneSenia ? (
                <>
                  <div className="flex items-center justify-between text-grafito">
                    <span>Total de la cancha</span>
                    <span className="font-display font-semibold text-tinta">{formatearPrecio(cancha.precio)}</span>
                  </div>

                  <div className="my-4 flex items-center justify-between border-y border-dashed border-borde py-5">
                    <div>
                      <p className="font-display font-bold text-azul">Seña a pagar ahora</p>
                      <p className="text-xs text-grafito">Asegurá tu lugar mediante pago online</p>
                    </div>
                    <span className="font-display text-4xl font-extrabold tracking-tight text-azul">
                      {formatearPrecio(cancha.senia)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-grafito">
                    <span>Resto en el complejo</span>
                    <span className="font-display font-semibold text-tinta">{formatearPrecio(resto)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-grafito">
                    <span>Total de la cancha</span>
                    <span className="font-display font-semibold text-tinta">{formatearPrecio(cancha.precio)}</span>
                  </div>
                  <p className="mt-3 text-sm text-grafito">
                    Se paga en el complejo el día del turno — no requiere seña online.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6">
              {estado === "idle" && (
                <button
                  type="button"
                  onClick={confirmarOPagar}
                  disabled={vencido}
                  className="flex h-16 w-full items-center justify-center rounded-full bg-azul font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                >
                  {!usuario ? "Continuar" : tieneSenia ? `Pagar seña ${formatearPrecio(cancha.senia)}` : "Confirmar reserva"}
                </button>
              )}

              {estado === "procesando" && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex h-16 w-full items-center justify-center gap-2 rounded-full bg-borde font-display text-base font-bold text-grafito"
                >
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  {tieneSenia ? "Procesando el pago..." : "Confirmando tu reserva..."}
                </div>
              )}

              {estado === "rechazado" && (
                <div className="rounded-input bg-cancelado-suave p-5 text-center">
                  <XCircle className="mx-auto size-8 text-cancelado" aria-hidden />
                  <p className="mt-2 font-display font-bold text-tinta">No pudimos confirmar el pago</p>
                  <p className="mt-1 text-sm text-grafito">
                    Tu tarjeta fue rechazada por el banco emisor. Probá con otra tarjeta o con otro medio de pago.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEstado("idle")}
                    disabled={vencido}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {estado === "pendiente" && (
                <div className="rounded-input bg-pendiente-suave p-5 text-center">
                  <Landmark className="mx-auto size-8 text-pendiente" aria-hidden />
                  <p className="mt-2 font-display font-bold text-tinta">Tu pago quedó pendiente</p>
                  <p className="mt-1 text-sm text-grafito">
                    Elegiste un medio de pago que tarda en acreditarse (transferencia o pago en efectivo). Te
                    avisamos por mail apenas se confirme — mientras tanto, el turno sigue reservado a tu nombre.
                  </p>
                </div>
              )}
            </div>

            {(estado === "idle" || estado === "procesando") && (
              <p className="mt-3 text-center text-sm italic text-grafito">Cancelación gratis hasta 24hs antes</p>
            )}
          </div>

          {(estado === "idle" || estado === "procesando") && (
            <div className="mt-6 grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
              {tieneSenia && (
                <>
                  <div className="flex flex-col items-center gap-1.5">
                    <ShieldCheck className="size-5 text-grafito" aria-hidden />
                    <p className="text-xs text-grafito">Pago 100% seguro</p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <CreditCard className="size-5 text-grafito" aria-hidden />
                    <p className="text-xs text-grafito">Aceptamos todas las tarjetas</p>
                  </div>
                </>
              )}
              <div className="flex flex-col items-center gap-1.5">
                <MessageCircle className="size-5 text-grafito" aria-hidden />
                <p className="text-xs text-grafito">Soporte por WhatsApp</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterPublico />
    </div>
  );
}
