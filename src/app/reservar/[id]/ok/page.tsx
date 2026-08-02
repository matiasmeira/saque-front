import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Mail, MapPin, Navigation } from "lucide-react";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { DEPORTES } from "@/mocks/deportes";
import { COMPLEJOS } from "@/mocks/complejos";
import { fechaLarga, formatearPrecio } from "@/lib/formato";

/**
 * A8 — el momento en que el jugador sabe que su turno está
 * asegurado. Mismos query params que el checkout (A7): cancha, fecha
 * y hora identifican el turno dentro del complejo de la ruta. Server
 * Component entero — no hay nada interactivo acá, "Cómo llegar" y
 * "Ver mis reservas" son links comunes.
 */
export default async function ReservaConfirmada({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancha?: string; fecha?: string; hora?: string }>;
}) {
  const { id } = await params;
  const { cancha: canchaId, fecha, hora } = await searchParams;

  const complejo = COMPLEJOS.find((c) => c.id === id);
  const cancha = complejo?.canchas.find((c) => c.id === canchaId);

  if (!complejo || !cancha || !fecha || !hora) {
    return (
      <div className="flex min-h-dvh flex-col bg-humo">
        <HeaderMinimo />
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <h1 className="font-display text-xl font-bold text-tinta">No encontramos esa reserva</h1>
          <p className="mt-2 max-w-sm text-grafito">El enlace puede estar vencido o incompleto.</p>
          <Link
            href="/buscar"
            className="mt-6 flex h-12 items-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Buscar canchas
          </Link>
        </main>
      </div>
    );
  }

  const deporteLabel = DEPORTES.find((d) => d.valor === cancha.deporte)?.etiqueta ?? cancha.deporte;
  const tieneSenia = cancha.senia > 0;
  const resto = cancha.precio - cancha.senia;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />

      <main className="flex-1 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-card bg-white p-6 text-center sm:p-8">
            <CheckCircle2 className="mx-auto size-10 text-disponible" aria-hidden />
            <h1 className="mt-3 font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
              Reservado
            </h1>
            <p className="mt-1 text-grafito">
              Tu turno en {complejo.nombre} está confirmado.
            </p>

            <div className="mt-6 space-y-2 rounded-input bg-humo p-5 text-left">
              <p className="font-display text-lg font-bold text-tinta">{complejo.nombre}</p>
              <p className="text-sm text-grafito">
                {cancha.nombre} · {deporteLabel}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="size-5 shrink-0 text-azul" aria-hidden />
                  <p className="font-display text-sm font-semibold text-tinta">
                    {fechaLarga(fecha)}, {hora}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="size-5 shrink-0 text-azul" aria-hidden />
                  <p className="font-display text-sm font-semibold text-tinta">{cancha.duracionMin} minutos</p>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-borde pt-4 text-left">
              {tieneSenia ? (
                <>
                  <div className="flex items-center justify-between text-grafito">
                    <span>Seña pagada</span>
                    <span className="font-display font-bold text-disponible">{formatearPrecio(cancha.senia)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-grafito">
                    <span>Resto a pagar en el complejo</span>
                    <span className="font-display font-semibold text-tinta">{formatearPrecio(resto)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-grafito">
                  Pagás el total ({formatearPrecio(cancha.precio)}) en el complejo el día del turno.
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${complejo.lat},${complejo.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-borde font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
              >
                <Navigation className="size-4" aria-hidden />
                Cómo llegar
              </a>
              <Link
                href="/mis-reservas"
                className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Ver mis reservas
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-card bg-white p-4 text-sm text-grafito">
            <MapPin className="mt-0.5 size-4 shrink-0 text-grafito" aria-hidden />
            <p>{complejo.reglas}</p>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-grafito">
            <Mail className="size-4 shrink-0" aria-hidden />
            <p>Te mandamos la confirmación por email.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
