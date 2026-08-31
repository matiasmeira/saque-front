"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { HeaderMinimo } from "@/components/canche/header-minimo";
import { mails } from "@/lib/api/endpoints/mails";
import { ApiError, mensajeVisible } from "@/lib/api/errores";

/**
 * Baja de mails de marketing — se ejecuta sola al entrar, sin pedir confirmación.
 *
 * El backend arma el link como `{frontendUrl}/baja-mails?token=...`
 * (OfertaMarketingBatchSender) y el endpoint es público: identifica al usuario
 * por ese token opaco, no por una sesión. Por eso acá no hay ningún gate.
 *
 * Se usa useQuery y no useEffect para que el StrictMode de desarrollo no
 * dispare la baja dos veces, y para tener los estados de carga y error sin
 * escribirlos a mano.
 */
export default function BajaMails() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <BajaMailsContenido />
    </Suspense>
  );
}

function BajaMailsContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const baja = useQuery({
    queryKey: ["mails", "baja", token],
    queryFn: () => mails.darDeBaja({ token }),
    enabled: token !== "",
    retry: false,
    staleTime: Infinity,
  });

  const sinToken = token === "";

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center">
          {sinToken && (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">Link incompleto</h1>
              <p className="mt-2 text-sm text-grafito">
                Este link no trae el código de baja. Abrilo desde el mail que recibiste.
              </p>
            </>
          )}

          {!sinToken && baja.isPending && <p className="text-sm text-grafito">Procesando...</p>}

          {baja.isError && (
            <>
              <h1 className="font-display text-xl font-bold text-tinta">No pudimos darte de baja</h1>
              <p className="mt-2 text-sm text-grafito">
                {baja.error instanceof ApiError
                  ? mensajeVisible(baja.error)
                  : "El link puede haber vencido. Escribinos y lo resolvemos."}
              </p>
            </>
          )}

          {baja.isSuccess && (
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
