"use client";

import { useState, type FormEvent } from "react";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { simularLlamada } from "@/lib/mock-api";

/**
 * Solicitud de recuperación de contraseña. El mensaje de éxito es
 * SIEMPRE el mismo, exista o no la cuenta — no hay que revelar si un
 * email está registrado.
 */
export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    // TODO backend: POST /auth/password/recuperar { email } → 200 siempre
    simularLlamada({ ok: true }, 500).then(() => {
      setEnviado(true);
      setEnviando(false);
    });
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
                  disabled={enviando}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                >
                  {enviando ? "Enviando..." : "Enviar instrucciones"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
