"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { HeaderMinimo } from "@/components/canche/header-minimo";
import {
  CompletarRegistro,
  TITULOS_REGISTRO,
  type PasoRegistro,
} from "@/components/canche/completar-registro";
import { auth } from "@/lib/api/endpoints/auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { urlCheckout, useIntencion } from "@/lib/reserva-intencion";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/**
 * A4 — entrada por el link del mail.
 *
 * El backend arma el link como `{frontendUrl}/verificar?token=...`
 * (RegistroVerificacionService.iniciarRegistro). Acá se valida ese token con
 * GET /auth/registro/verificar y, si sigue vigente, se sigue con los mismos
 * dos pasos finales que el camino del código tipeado en /ingresar.
 *
 * El token del link NO se consume al validarlo: sólo lo consume
 * /registro/completar. Por eso el mismo valor crudo que vino en la URL es el
 * que después se manda para completar el alta.
 *
 * Quien prefiera tipear el código de 6 dígitos no pasa por acá: ese camino
 * vive entero en /ingresar.
 */
export default function VerificarPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <Verificar />
    </Suspense>
  );
}

function Verificar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intencion = useIntencion();
  const token = searchParams.get("token") ?? "";

  const [paso, setPaso] = useState<PasoRegistro>("password");

  const verificacion = useQuery({
    queryKey: ["registro", "verificar", token],
    queryFn: () => auth.verificarTokenRegistro(token),
    enabled: token !== "",
    retry: false,
  });

  const modoReserva = Boolean(
    intencion?.complejo && intencion?.cancha && intencion?.fecha && intencion?.hora,
  );

  function entrar(perfil: PerfilResponse) {
    if (
      modoReserva &&
      intencion?.complejo &&
      intencion.cancha &&
      intencion.fecha &&
      intencion.hora
    ) {
      router.push(
        urlCheckout({
          complejo: intencion.complejo,
          cancha: intencion.cancha,
          fecha: intencion.fecha,
          hora: intencion.hora,
        }),
      );
      return;
    }
    router.push(perfil.rol === "OWNER" || perfil.rol === "ADMIN" ? "/panel/agenda" : "/");
  }

  const sinToken = token === "";
  const invalido = verificacion.isError;

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/ingresar" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8">
          {sinToken && (
            <>
              <h1 className="text-center font-display text-xl font-bold text-tinta">
                Link incompleto
              </h1>
              <p className="mt-2 text-center text-sm text-grafito">
                Este link no trae el código de verificación. Volvé a empezar desde tu email.
              </p>
              <Link
                href="/ingresar"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Ir a ingresar
              </Link>
            </>
          )}

          {!sinToken && verificacion.isPending && (
            <p className="text-center text-sm text-grafito">Verificando tu link...</p>
          )}

          {invalido && (
            <>
              <h1 className="text-center font-display text-xl font-bold text-tinta">
                El link no es válido
              </h1>
              <p className="mt-2 text-center text-sm text-grafito">
                {verificacion.error instanceof ApiError
                  ? mensajeVisible(verificacion.error)
                  : "Puede haber vencido o ya haberse usado."}
              </p>
              <Link
                href="/ingresar"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Pedir uno nuevo
              </Link>
            </>
          )}

          {verificacion.data && (
            <>
              <h1 className="text-center font-display text-xl font-bold text-tinta">
                {TITULOS_REGISTRO[paso]}
              </h1>
              <p className="mt-1 text-center text-sm text-grafito">
                {verificacion.data.email}
              </p>
              <CompletarRegistro
                tokenRegistro={token}
                paso={paso}
                onPasoChange={setPaso}
                onListo={entrar}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
