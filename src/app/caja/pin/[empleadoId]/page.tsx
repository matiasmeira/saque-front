"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { TecladoNumerico } from "@/components/caja/teclado-numerico";
import { auth, usuarios } from "@/lib/api/endpoints/auth";
import { mostrador } from "@/lib/api/endpoints/caja";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { borrarToken, guardarToken } from "@/lib/api/sesion";
import type { PermisoEmpleado } from "@/lib/api/tipos/comunes";
import { iniciarSesionEmpleado, leerEstablecimientoDispositivo } from "@/lib/sesion-caja";

/**
 * A qué pantalla del panel entra, según lo primero que pueda hacer. Se elige
 * una sola vez, al loguearse, con los permisos que devuelve /me.
 *
 * El orden es de mayor a menor frecuencia en el mostrador: la agenda es el día
 * a día, el buffet es intermitente y la caja se toca al abrir y al cerrar.
 *
 * Cada ruta de acá tiene que corresponderse con un listado que el backend le
 * deje leer a ese permiso; si no, se lo estaría mandando a un 403. Hoy se
 * corresponden (ver AutorizacionEmpleadoService).
 */
const RUTA_POR_PERMISO: { permiso: PermisoEmpleado; ruta: string }[] = [
  { permiso: "CREAR_RESERVA_MANUAL", ruta: "/panel/agenda" },
  { permiso: "FINALIZAR_RESERVA", ruta: "/panel/agenda" },
  { permiso: "CANCELAR_RESERVA", ruta: "/panel/agenda" },
  { permiso: "MARCAR_AUSENTE", ruta: "/panel/agenda" },
  { permiso: "REGISTRAR_VENTA_BUFFET", ruta: "/panel/buffet/vender" },
  { permiso: "OPERAR_CAJA", ruta: "/panel/caja" },
];

/**
 * Segundo factor del mostrador: la cookie del dispositivo ya dijo que esta PC
 * es de confianza; el PIN dice QUIÉN es.
 *
 * El PIN se valida en el SERVER (POST /auth/empleados/login). Antes esto
 * comparaba contra un array en texto plano en el bundle, y el rate limit era un
 * setTimeout de 20s: cualquiera con las devtools abiertas leía los cuatro
 * dígitos de todo el personal. Ahora el back impone 30 intentos/5min por IP y
 * 5/5min por (establecimiento, nombre), y responde 429 — no hay contador acá.
 *
 * El backend pide el NOMBRE, no el id. El id es lo que viaja en la URL (es lo
 * estable), y el nombre sale de la lista de /caja, que ya está en cache.
 */
export default function PinCaja({ params }: { params: Promise<{ empleadoId: string }> }) {
  const { empleadoId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const establecimientoId = leerEstablecimientoDispositivo();

  const empleados = useQuery({
    queryKey: keys.caja.mostrador(establecimientoId ?? 0),
    queryFn: () => mostrador.empleadosActivos(establecimientoId!),
    enabled: establecimientoId !== null,
    retry: false,
  });

  const empleado = empleados.data?.find((e) => String(e.id) === empleadoId) ?? null;

  const [pin, setPin] = useState("");
  const [sinAcceso, setSinAcceso] = useState(false);

  const login = useMutation({
    mutationFn: async (pinIngresado: string) => {
      const { token } = await auth.loginEmpleado({
        establecimientoId: establecimientoId!,
        nombre: empleado!.nombre,
        pin: pinIngresado,
      });
      guardarToken(token);
      // Se pide el perfil acá adentro para conocer los permisos antes de
      // navegar, y entrar directo a una pantalla que la persona pueda usar.
      return usuarios.me();
    },
    onSuccess: (perfil) => {
      const ruta = RUTA_POR_PERMISO.find((r) => perfil.permisos.includes(r.permiso))?.ruta;
      // Sin una sola pantalla que pueda abrir, entrar al panel sería mandarlo a
      // un 403. Se le dice acá, en el kiosco, y se suelta el token: dejarlo con
      // sesión abierta en una PC compartida y sin nada que hacer es peor.
      if (!ruta) {
        borrarToken();
        queryClient.clear();
        setSinAcceso(true);
        return;
      }
      queryClient.setQueryData(keys.perfil(), perfil);
      iniciarSesionEmpleado(empleadoId);
      router.push(ruta);
    },
    onError: (e) => {
      setPin("");
      // 403 no es un PIN mal tipeado: es "Dispositivo no autorizado", o sea que
      // el dueño revocó esta PC mientras alguien la estaba usando. Volver a la
      // entrada, que sabe explicar eso.
      if (e instanceof ApiError && e.status === 403) router.replace("/caja");
    },
  });

  // El id de la URL no corresponde a ningún empleado activo de este local: se
  // vuelve a la lista sin decir por qué. Sólo se decide cuando la lista YA
  // llegó — antes de eso `empleado` es null nada más que porque no hay datos.
  useEffect(() => {
    if (empleados.isSuccess && !empleado) router.replace("/caja");
  }, [empleados.isSuccess, empleado, router]);

  useEffect(() => {
    if (establecimientoId === null) router.replace("/caja");
  }, [establecimientoId, router]);

  function agregarDigito(digito: string) {
    if (login.isPending || pin.length >= 4 || !empleado) return;
    const nuevo = pin + digito;
    setPin(nuevo);
    if (nuevo.length === 4) login.mutate(nuevo);
  }

  function borrarDigito() {
    if (login.isPending) return;
    setPin((p) => p.slice(0, -1));
    login.reset();
  }

  if (!empleado) return <div className="min-h-dvh bg-tinta" />;

  const primerNombre = empleado.nombre.split(" ")[0];

  if (sinAcceso) {
    return (
      <PantallaKiosco>
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-14 text-pendiente" aria-hidden />
          <p className="font-display text-2xl font-bold text-white">Tu PIN es correcto, {primerNombre}</p>
          <p className="max-w-sm text-base text-[#9DB6D6]">
            Pero todavía no tenés habilitada ninguna pantalla. Pedile al dueño que te dé el permiso de
            <span className="font-semibold text-white"> gestionar caja</span>.
          </p>
          <button
            type="button"
            onClick={() => router.push("/caja")}
            className="mt-2 h-12 rounded-full bg-white px-7 font-display text-base font-bold text-tinta transition-transform hover:scale-95"
          >
            Volver
          </button>
        </div>
      </PantallaKiosco>
    );
  }
  const bloqueadoPorIntentos = login.error instanceof ApiError && login.error.status === 429;

  return (
    <PantallaKiosco>
      <button
        type="button"
        onClick={() => router.push("/caja")}
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-[#9DB6D6] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        No soy {primerNombre}
      </button>

      <h1 className="mb-1 text-center font-display text-2xl font-bold text-white">
        Hola, {primerNombre}
      </h1>
      <p className="mb-8 text-center text-sm text-[#9DB6D6]">Ingresá tu PIN</p>

      {bloqueadoPorIntentos ? (
        <div className="rounded-card bg-white/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-white">Demasiados intentos</p>
          <p className="mt-1 text-sm text-[#9DB6D6]">{mensajeVisible(login.error as ApiError)}</p>
        </div>
      ) : (
        <>
          {login.isError && (
            <p className="mb-4 text-center text-sm font-semibold text-cancelado" role="alert">
              {/* Mensaje neutro a propósito: nunca distingue "esta persona no
                  existe" de "existe pero el PIN está mal". */}
              PIN incorrecto. Probá de nuevo.
            </p>
          )}
          <TecladoNumerico valor={pin} onDigito={agregarDigito} onBorrar={borrarDigito} />
        </>
      )}
    </PantallaKiosco>
  );
}
