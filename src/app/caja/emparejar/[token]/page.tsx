"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { emparejarDispositivo, estadoDeTokenGenerado, marcarTokenGeneradoComoUsado } from "@/lib/sesion-caja";
import { estadoDeToken } from "@/mocks/dispositivos";
import { PANEL_COMPLEJO } from "@/mocks/agenda";

type Estado = "cargando" | "exito" | "error";

/** Primero los 3 tokens fijos de prueba, si no, los generados desde C9 (con vencimiento real) — cualquier otro valor es un link que nunca existió, mismo resultado que "vencido". */
function resolverEstadoToken(token: string): "valido" | "vencido" | "usado" {
  const fijo = estadoDeToken(token);
  if (fijo !== "desconocido") return fijo;
  return estadoDeTokenGenerado(token) ?? "vencido";
}

// El link lo genera el dueño desde C9 (Configuración → Dispositivos)
// y apunta acá con un token. "Vencido" y "usado" comparten el mismo
// mensaje genérico a propósito: a quien lo toca no le sirve saber
// cuál de los dos pasó, solo que tiene que pedir uno nuevo.
// TODO backend: validar el token y marcarlo usado vienen de la API.
export default function EmparejarDispositivo({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    const id = setTimeout(() => {
      if (resolverEstadoToken(token) === "valido") {
        emparejarDispositivo(PANEL_COMPLEJO.nombre);
        marcarTokenGeneradoComoUsado(token);
        setEstado("exito");
      } else {
        setEstado("error");
      }
    }, 900);
    return () => clearTimeout(id);
  }, [token]);

  return (
    <PantallaKiosco>
      {estado === "cargando" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin text-celeste" aria-hidden />
          <p className="font-display text-xl font-bold text-white">Vinculando esta computadora...</p>
        </div>
      )}

      {estado === "exito" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="size-14 text-disponible" aria-hidden />
          <p className="font-display text-2xl font-bold text-white">Esta computadora quedó vinculada a {PANEL_COMPLEJO.nombre}</p>
          <button
            type="button"
            onClick={() => router.push("/caja")}
            className="mt-4 flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-azul font-display text-lg font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Continuar
          </button>
        </div>
      )}

      {estado === "error" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-14 text-cancelado" aria-hidden />
          <p className="font-display text-2xl font-bold text-white">Este link ya no es válido</p>
          <p className="text-base text-[#9DB6D6]">Pedile al dueño uno nuevo.</p>
        </div>
      )}
    </PantallaKiosco>
  );
}
