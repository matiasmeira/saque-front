"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { dispositivos } from "@/lib/api/endpoints/caja";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { guardarDispositivo } from "@/lib/sesion-caja";

/**
 * Zona E — canje del código de emparejamiento.
 *
 * La ruta cambió de /caja/emparejar/[token] a /caja/emparejar?codigo=: el
 * backend arma el link como `{frontendUrl}/caja/emparejar?codigo=...`
 * (DispositivoCajaService), o sea un QUERY param. Con el path param de antes,
 * el link del mail caía en un 404.
 *
 * POST /api/v1/caja/emparejar es público a propósito: es el único momento en
 * que esta PC todavía no tiene ninguna credencial. El backend responde con
 * Set-Cookie del token de dispositivo (HttpOnly, así que el JS nunca lo ve) y
 * devuelve a qué establecimiento quedó atada.
 *
 * Se usa useQuery y no useEffect para que el StrictMode de desarrollo no
 * consuma el código dos veces: los códigos son de un solo uso.
 */
export default function EmparejarCaja() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-tinta" />}>
      <Emparejar />
    </Suspense>
  );
}

function Emparejar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo") ?? "";

  const emparejamiento = useQuery({
    queryKey: ["caja", "emparejar", codigo],
    queryFn: async () => {
      const resultado = await dispositivos.emparejar(codigo);
      // El token vive en la cookie; acá sólo se guarda a qué local pertenece
      // esta PC, que es lo que necesita el kiosco para pedir los empleados.
      guardarDispositivo(resultado.establecimientoId, resultado.label);
      return resultado;
    },
    enabled: codigo !== "",
    retry: false,
    staleTime: Infinity,
  });

  if (codigo === "") {
    return (
      <PantallaKiosco>
      <h1 className="mb-3 text-center font-display text-2xl font-extrabold text-white">Link incompleto</h1>
      <div className="text-center">
        <p className="text-white/70">
          Este link no trae el código de emparejamiento. Pedile al dueño que genere uno nuevo.
        </p>
      </div>
    </PantallaKiosco>
    );
  }

  if (emparejamiento.isPending) {
    return (
      <PantallaKiosco>
      <h1 className="mb-3 text-center font-display text-2xl font-extrabold text-white">Vinculando esta computadora...</h1>
      <div className="text-center">
        <p className="text-white/70">Un segundo.</p>
      </div>
    </PantallaKiosco>
    );
  }

  if (emparejamiento.isError) {
    return (
      <PantallaKiosco>
      <h1 className="mb-3 text-center font-display text-2xl font-extrabold text-white">No pudimos vincular esta computadora</h1>
      <div className="text-center">
        <p className="text-white/70">
          {emparejamiento.error instanceof ApiError
            ? mensajeVisible(emparejamiento.error)
            : "El código puede haber vencido o ya haberse usado."}
        </p>
        <p className="mt-2 text-sm text-white/50">
          Los códigos duran unos minutos y sirven una sola vez.
        </p>
      </div>
    </PantallaKiosco>
    );
  }

  return (
    <PantallaKiosco>
      <h1 className="mb-3 text-center font-display text-2xl font-extrabold text-white">Listo</h1>
      <div className="text-center">
      <p className="text-white/70">
        Esta computadora quedó vinculada a{" "}
        <span className="font-semibold text-white">{emparejamiento.data.label}</span>.
      </p>
      <p className="mt-2 text-sm text-white/50">
        Desde ahora los empleados entran acá con su PIN, sin el dueño presente.
      </p>
      <button
        type="button"
        onClick={() => router.push("/caja")}
        className="mt-8 h-14 rounded-full bg-white px-8 font-display text-base font-bold text-tinta transition-transform hover:scale-95"
      >
        Empezar
      </button>
      <Link href="/panel/configuracion" className="mt-4 text-sm text-white/50 hover:text-white">
        Volver al panel
      </Link>
    </div>
    </PantallaKiosco>
  );
}
