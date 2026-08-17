"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MonitorSmartphone } from "lucide-react";

import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { ListaNombres } from "@/components/caja/lista-nombres";
import { mostrador } from "@/lib/api/endpoints/caja";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import {
  leerEstablecimientoDispositivo,
  useEmpleadoIdSesion,
  useNombreLocalDispositivo,
} from "@/lib/sesion-caja";

/**
 * Puerta de entrada de la zona E — nunca una pantalla de trabajo. De acá en más
 * todo pasa por /panel/* recortado por permisos: esta pantalla solo resuelve
 * "emparejado → nombre → PIN" y entrega.
 *
 * Quién autoriza qué (son dos cosas separadas):
 * - La COOKIE saque_caja_device dice que esta PC es de confianza. Es lo único
 *   que habilita pedir la lista de nombres sin ninguna sesión abierta — no hace
 *   falta que el dueño esté delante.
 * - El PIN dice QUÉ empleado es. Se valida en el server (/auth/empleados/login).
 *
 * La cookie es HttpOnly: el JS no puede leerla, así que el estado real de
 * emparejamiento no se consulta en localStorage sino PREGUNTANDO. Si
 * GET /empleados/activos responde 200, esta PC está emparejada; si responde
 * 401/403, la cookie no está o fue revocada. localStorage solo guarda el
 * establecimientoId (a quién preguntarle) y el nombre del local, que son datos
 * de presentación.
 */
export default function Caja() {
  const router = useRouter();
  const nombreLocal = useNombreLocalDispositivo();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const establecimientoId = leerEstablecimientoDispositivo();

  const empleados = useQuery({
    queryKey: keys.caja.mostrador(establecimientoId ?? 0),
    queryFn: () => mostrador.empleadosActivos(establecimientoId!),
    enabled: establecimientoId !== null,
    retry: false,
    // El mostrador queda abierto todo el día en la misma pestaña: si el dueño
    // da de alta un empleado, tiene que aparecer sin que nadie recargue.
    refetchInterval: 60_000,
  });

  // Ya hay alguien trabajando en esta caja — no tiene sentido mostrarle la
  // pantalla de nombres de nuevo.
  useEffect(() => {
    if (empleadoIdSesion) router.replace("/panel/agenda");
  }, [empleadoIdSesion, router]);

  if (empleadoIdSesion) return <div className="min-h-dvh bg-tinta" />;

  const sinCookie =
    empleados.error instanceof ApiError &&
    (empleados.error.status === 401 || empleados.error.status === 403);

  if (establecimientoId === null || sinCookie) {
    return (
      <PantallaKiosco>
        <div className="flex flex-col items-center gap-4 text-center">
          {sinCookie ? (
            <>
              <AlertTriangle className="size-14 text-pendiente" aria-hidden />
              <p className="font-display text-2xl font-bold text-white">
                Este dispositivo fue desvinculado
              </p>
              <p className="max-w-sm text-base text-[#9DB6D6]">
                El dueño cerró el acceso de esta computadora. Pedile un link nuevo para volver
                a emparejarla.
              </p>
            </>
          ) : (
            <>
              <MonitorSmartphone className="size-14 text-celeste" aria-hidden />
              <p className="font-display text-2xl font-bold text-white">
                Esta computadora todavía no está lista
              </p>
              <p className="max-w-sm text-base text-[#9DB6D6]">
                Pedile al dueño el link para emparejarla con tu local, o que la active desde su
                panel.
              </p>
            </>
          )}
        </div>
      </PantallaKiosco>
    );
  }

  if (empleados.isPending) {
    return (
      <PantallaKiosco>
        <p className="text-center text-base text-[#9DB6D6]">Cargando...</p>
      </PantallaKiosco>
    );
  }

  if (empleados.isError) {
    return (
      <PantallaKiosco>
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-14 text-pendiente" aria-hidden />
          <p className="font-display text-2xl font-bold text-white">No pudimos abrir la caja</p>
          <p className="max-w-sm text-base text-[#9DB6D6]">
            Revisá la conexión y volvé a intentar.
          </p>
          <button
            type="button"
            onClick={() => empleados.refetch()}
            className="mt-2 h-12 rounded-full bg-white px-7 font-display text-base font-bold text-tinta transition-transform hover:scale-95"
          >
            Reintentar
          </button>
        </div>
      </PantallaKiosco>
    );
  }

  if (empleados.data.length === 0) {
    return (
      <PantallaKiosco>
        <div className="flex flex-col items-center gap-4 text-center">
          <MonitorSmartphone className="size-14 text-celeste" aria-hidden />
          <p className="font-display text-2xl font-bold text-white">Todavía no hay empleados</p>
          <p className="max-w-sm text-base text-[#9DB6D6]">
            El dueño tiene que darlos de alta desde Configuración → Empleados antes de que
            puedan entrar acá.
          </p>
        </div>
      </PantallaKiosco>
    );
  }

  return (
    <PantallaKiosco>
      {nombreLocal ? (
        <p className="mb-1 text-center text-sm text-[#9DB6D6]">{nombreLocal}</p>
      ) : null}
      <h1 className="mb-8 text-center font-display text-2xl font-bold text-white">¿Quién sos?</h1>
      <ListaNombres
        empleados={empleados.data}
        onElegir={(empleado) => router.push(`/caja/pin/${empleado.id}`)}
      />
    </PantallaKiosco>
  );
}
