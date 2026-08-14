"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { auth } from "@/lib/api/endpoints/auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";

/**
 * Solicitud de recuperación de contraseña. El mensaje de éxito es
 * SIEMPRE el mismo, exista o no la cuenta — no hay que revelar si un
 * email está registrado.
 *
 * El backend acompaña esa decisión: POST /auth/password/recuperar devuelve
 * 200 aunque el email no exista, justamente para no ser un oráculo de qué
 * cuentas hay (a diferencia de /registro/iniciar, que sí distingue). Por eso
 * acá no hay ninguna rama por "email no encontrado": no llega esa señal.
 */
export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recuperar = useMutation({
    mutationFn: (email: string) => auth.recuperarPassword({ email }),
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = email.trim().toLowerCase();
    if (!limpio) return;
    setError(null);
    try {
      await recuperar.mutateAsync(limpio);
      setEnviado(true);
    } catch (e) {
      // Un 429 del rate limit sí es una señal real que conviene mostrar.
      setError(
        e instanceof ApiError ? mensajeVisible(e) : "No pudimos enviar el mail. Intentá de nuevo.",
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/ingresar" />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center">
          {enviado ? (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">Revisá tu email</h1>
              <p className="mt-2 text-sm text-grafito">
                Si el email está registrado, te enviamos las instrucciones para recuperar tu contraseña.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">Recuperar contraseña</h1>
              <p className="mt-1 text-sm text-grafito">Te mandamos un link para elegir una nueva.</p>
              <form onSubmit={enviar} className="mt-6 text-left">
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
                  disabled={recuperar.isPending}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                >
                  {recuperar.isPending ? "Enviando..." : "Enviar instrucciones"}
                </button>
                {error && (
                  <p role="alert" className="mt-3 text-center text-sm text-cancelado">
                    {error}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
