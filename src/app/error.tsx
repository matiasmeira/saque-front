"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { HeaderMinimo } from "@/components/saque/header-minimo";

/**
 * Error boundary de toda la app — Next exige "use client" y la firma
 * {error, reset} acá. Mensaje sin jerga técnica: nunca un stack trace
 * ni "Error: undefined is not a function" para el jugador.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // TODO backend/observabilidad: mandar error.digest a un servicio de logs real.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center">
          <AlertTriangle className="mx-auto size-8 text-azul" aria-hidden />
          <h1 className="mt-3 font-display text-xl font-bold text-tinta">Algo no anduvo</h1>
          <p className="mt-2 text-sm text-grafito">
            Tuvimos un problema técnico. No te preocupes, tus reservas están a salvo.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={reset}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reintentar
            </button>
            <Link
              href="/"
              className="flex h-12 w-full items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
