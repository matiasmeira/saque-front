"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { simularLlamada } from "@/lib/mock-api";

type Estado = "dando-baja" | "listo";

/** Baja de mails de marketing — se ejecuta sola al entrar, sin pedir confirmación. */
export default function BajaMails() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <BajaMailsContenido />
    </Suspense>
  );
}

function BajaMailsContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [estado, setEstado] = useState<Estado>("dando-baja");

  useEffect(() => {
    // TODO backend: POST /mails/baja { token }
    let cancelado = false;
    simularLlamada({ ok: true }, 500).then(() => {
      if (!cancelado) setEstado("listo");
    });
    return () => {
      cancelado = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center">
          {estado === "dando-baja" ? (
            <p className="text-sm text-grafito">Procesando...</p>
          ) : (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">Listo</h1>
              <p className="mt-2 text-sm text-grafito">No vas a recibir más correos de ofertas.</p>
              <p className="mt-4 text-sm text-grafito">Si te arrepentís, podés reactivarlos desde tu cuenta.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
