"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { urlCheckout, useIntencion } from "@/lib/reserva-intencion";
import { guardarUsuario } from "@/lib/usuario";

/**
 * A4, paso 3 (último). Solo email, nombre y teléfono — nada más
 * (Parte 9, A4). El teléfono es obligatorio: es el único canal por
 * el que el complejo avisa si se suspende el turno por lluvia.
 * Al terminar, guarda el usuario mock (así A7 lo reconoce como
 * logueado al volver) y vuelve exactamente al checkout que había
 * empezado — el contador todavía no arrancó, arranca recién cuando
 * confirme el pago allá.
 */
export default function CompletarPerfil() {
  const router = useRouter();
  const intencion = useIntencion();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!intencion?.verificado) {
      router.replace("/ingresar");
    }
  }, [intencion, router]);

  if (!intencion?.verificado) return <div className="min-h-dvh bg-humo" />;

  const modoReserva = Boolean(intencion.complejo && intencion.cancha && intencion.fecha && intencion.hora);

  function terminar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) return;
    setEnviando(true);
    // TODO backend: alta de jugador (nombre + teléfono) y creación
    // de la sesión real. El mock solo guarda el usuario localmente y
    // redirige de vuelta al checkout.
    setTimeout(() => {
      if (intencion!.email) {
        guardarUsuario({ email: intencion!.email, nombre: nombre.trim(), telefono: telefono.trim() });
      }
      const destino =
        modoReserva && intencion!.complejo && intencion!.cancha && intencion!.fecha && intencion!.hora
          ? urlCheckout({
              complejo: intencion!.complejo,
              cancha: intencion!.cancha,
              fecha: intencion!.fecha,
              hora: intencion!.hora,
            })
          : "/";
      // No borramos la intención acá: hacerlo dispara el evento de
      // cambio, y el efecto que manda de vuelta a /ingresar cuando
      // no hay "verificado" se pisa con esta navegación. Queda en
      // sessionStorage hasta que la pestaña se cierra o la próxima
      // reserva la pisa — no hace daño.
      router.push(destino);
    }, 400);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/verificar" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8">
          <h1 className="text-center font-display text-xl font-bold text-tinta">Ya casi está</h1>
          <p className="mt-1 text-center text-sm text-grafito">
            {modoReserva ? "Completá tus datos para confirmar la reserva" : "Completá tus datos para crear tu cuenta"}
          </p>

          <form onSubmit={terminar} className="mt-6 space-y-4">
            <div>
              <label htmlFor="nombre" className="mb-1 block text-xs font-semibold text-grafito">
                Nombre
              </label>
              <input
                id="nombre"
                required
                autoFocus
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="mb-1 block text-xs font-semibold text-grafito">
                Teléfono
              </label>
              <div className="flex items-center gap-2 rounded-input border border-borde bg-humo px-3 py-2.5 focus-within:border-azul">
                <span className="text-grafito">+54</span>
                <input
                  id="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="11 2345 6789"
                  className="w-full bg-transparent text-tinta focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
            >
              <CheckCircle2 className="size-[18px]" aria-hidden />
              {enviando ? "Guardando..." : modoReserva ? "Terminar y reservar" : "Terminar registro"}
            </button>

            {modoReserva && (
              <p className="text-center text-xs text-grafito">
                Al confirmar, aceptás los términos de cancelación del complejo.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
