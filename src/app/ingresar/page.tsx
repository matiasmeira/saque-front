"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { COMPLEJOS } from "@/mocks/complejos";
import { actualizarIntencion, guardarBooking, urlCheckout, useIntencion } from "@/lib/reserva-intencion";

/**
 * A4, paso 1. Si llega con complejo/cancha/fecha/hora en la URL, es
 * el modal "para reservar necesitás una cuenta": guardamos la
 * intención con guardarBooking (SIN arrancar ningún reloj — eso
 * ahora es responsabilidad exclusiva del botón de pago en el
 * checkout, así un bot que le pegue a esta URL para todos los
 * horarios no bloquea nada). Si llega sin esos params — por ejemplo
 * desde "Ingresar" del header — es un login/registro común.
 */
export default function Ingresar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intencion = useIntencion();

  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  const complejo = searchParams.get("complejo");
  const cancha = searchParams.get("cancha");
  const fecha = searchParams.get("fecha");
  const hora = searchParams.get("hora");
  const tieneParamsDeReserva = Boolean(complejo && cancha && fecha && hora);

  useEffect(() => {
    if (complejo && cancha && fecha && hora) {
      guardarBooking({ complejo, cancha, fecha, hora });
    }
  }, [complejo, cancha, fecha, hora]);

  // Si venimos con params de reserva, esperamos a que la intención
  // sincronizada coincida con ESTA reserva antes de mostrar nada —
  // evita un parpadeo con una reserva vieja que haya quedado guardada.
  if (tieneParamsDeReserva && intencion?.complejo !== complejo) {
    return <div className="min-h-dvh bg-humo" />;
  }

  const modoReserva = Boolean(intencion?.complejo && intencion?.cancha && intencion?.fecha && intencion?.hora);
  const complejoNombre = intencion?.complejo ? COMPLEJOS.find((c) => c.id === intencion.complejo)?.nombre : null;
  const cerrarHacia =
    modoReserva && intencion?.complejo && intencion.cancha && intencion.fecha && intencion.hora
      ? urlCheckout({ complejo: intencion.complejo, cancha: intencion.cancha, fecha: intencion.fecha, hora: intencion.hora })
      : "/";

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    // TODO backend: alta/login real + envío del mail con link y
    // código de 6 dígitos. El mock guarda el email y avanza — el
    // código que vale en /verificar es fijo, ver ese archivo.
    actualizarIntencion({ email: email.trim() });
    setTimeout(() => router.push("/verificar"), 400);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="relative w-full max-w-sm rounded-card bg-white p-8">
          {modoReserva && (
            <Link
              href={cerrarHacia}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
            >
              <X className="size-5" aria-hidden />
            </Link>
          )}

          <h1 className="text-center font-display text-xl font-bold text-tinta">
            {modoReserva ? "Para reservar necesitás una cuenta" : "Ingresá o creá tu cuenta"}
          </h1>
          {complejoNombre && <p className="mt-1 text-center text-sm text-grafito">{complejoNombre}</p>}

          <form onSubmit={enviar} className="mt-6">
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-grafito">
              Tu email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none"
            />

            <button
              type="submit"
              disabled={enviando}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
            >
              {enviando ? "Enviando..." : "Continuar"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-grafito">
            Si ya tenés cuenta, entrás igual con este mismo email.
          </p>
        </div>
      </main>
    </div>
  );
}
