"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, MonitorSmartphone } from "lucide-react";
import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { ListaNombres } from "@/components/caja/lista-nombres";
import { revocarDispositivo, useEmparejado, useEmpleadoIdSesion, useFueRevocado, useNombreLocalDispositivo } from "@/lib/sesion-caja";
import { PANEL_EMPLEADOS } from "@/mocks/empleados";

// Puerta de entrada de la zona E — nunca una pantalla de trabajo. De
// acá en más todo pasa por /panel/* recortado por permisos (ver C2,
// C5, C11, C12): esta pantalla solo resuelve "emparejar → nombre →
// PIN" y entrega.
//
// ?revocar=1 dispara la MISMA revocación real que el botón de C9
// (Configuración → Dispositivos) — es solo un atajo para probar el
// caso "dispositivo revocado a mitad de uso" sin tener que abrir dos
// pestañas. Sin el param, el estado sale tal cual de @/lib/sesion-caja.
export default function Caja() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simularRevocado = searchParams.get("revocar") === "1";

  const emparejado = useEmparejado();
  const nombreLocal = useNombreLocalDispositivo();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const fueRevocado = useFueRevocado();

  // Efecto puro sobre el sistema externo (localStorage), sin setState
  // propio: revocarDispositivo() avisa por su cuenta (ver
  // sesion-caja.ts) y useEmparejado()/useFueRevocado() se enteran
  // solos, sin que este componente guarde nada en su propio estado.
  useEffect(() => {
    if (simularRevocado && emparejado) revocarDispositivo();
  }, [simularRevocado, emparejado]);

  // Ya hay alguien trabajando en esta caja — no tiene sentido
  // mostrarle la pantalla de nombres de nuevo.
  useEffect(() => {
    if (emparejado && empleadoIdSesion) router.replace("/panel/agenda");
  }, [emparejado, empleadoIdSesion, router]);

  if (!emparejado) {
    return (
      <PantallaKiosco>
        <div className="flex flex-col items-center gap-4 text-center">
          {fueRevocado ? (
            <>
              <AlertTriangle className="size-14 text-pendiente" aria-hidden />
              <p className="font-display text-2xl font-bold text-white">Este dispositivo fue desvinculado</p>
              <p className="max-w-sm text-base text-[#9DB6D6]">
                El dueño cerró el acceso de esta computadora. Pedile un link nuevo para volver a emparejarla.
              </p>
            </>
          ) : (
            <>
              <MonitorSmartphone className="size-14 text-celeste" aria-hidden />
              <p className="font-display text-2xl font-bold text-white">Esta computadora todavía no está lista</p>
              <p className="max-w-sm text-base text-[#9DB6D6]">
                Pedile al dueño el link para emparejarla con tu local, o que la active desde su panel.
              </p>
            </>
          )}
        </div>
      </PantallaKiosco>
    );
  }

  if (empleadoIdSesion) return <div className="min-h-dvh bg-tinta" />;

  return (
    <PantallaKiosco>
      <p className="mb-1 text-center text-sm text-[#9DB6D6]">{nombreLocal}</p>
      <h1 className="mb-8 text-center font-display text-2xl font-bold text-white">¿Quién sos?</h1>
      <ListaNombres
        empleados={PANEL_EMPLEADOS.filter((e) => e.estado === "activo")}
        onElegir={(empleado) => router.push(`/caja/pin/${empleado.id}`)}
      />
    </PantallaKiosco>
  );
}
