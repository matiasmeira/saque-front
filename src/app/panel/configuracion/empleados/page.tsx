"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, Plus, UserX, Users } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaEmpleados } from "@/components/panel/tabla-empleados";
import { FormFichaEmpleado, type DatosEmpleado } from "@/components/panel/form-ficha-empleado";
import { SkeletonEmpleados } from "@/components/panel/skeleton-empleados";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { empleados as endpointEmpleados } from "@/lib/api/endpoints/empleados";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { EmpleadoResponse } from "@/lib/api/tipos/empleados";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto =
  | { tipo: "ficha"; empleado: EmpleadoResponse | null }
  | { tipo: "pin"; empleado: EmpleadoResponse }
  | { tipo: "baja"; empleado: EmpleadoResponse }
  | null;

const PIN_VALIDO = /^\d{4}$/;

/**
 * Empleados del complejo. Solo dueño — ni el empleado con más permisos
 * administra a otros.
 *
 * Un empleado acá NO es una cuenta: es un `Usuario` con rol EMPLOYEE, email
 * sintético que genera el backend, plan FREE (la suscripción es del dueño) y
 * una sola credencial de 4 dígitos. Entra únicamente por el kiosco, tocando su
 * nombre en la PC del mostrador; nunca por /ingresar.
 */
export default function PanelEmpleados() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const queryClient = useQueryClient();
  const { establecimientoId } = useEstablecimientoActivo();

  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [pinNuevo, setPinNuevo] = useState("");
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // "!bloqueadoPorCaja &&" evita pisar el router.replace("/caja") de
  // useBloqueadoPorCaja con un redirect a /panel/agenda.
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/caja");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  const consulta = useQuery({
    queryKey: keys.empleados(establecimientoId ?? 0),
    queryFn: () => endpointEmpleados.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  function cerrarYRefrescar() {
    queryClient.invalidateQueries({ queryKey: keys.empleados(establecimientoId ?? 0) });
    setPanelAbierto(null);
    setPinNuevo("");
    setErrorAccion(null);
  }

  function alFallar(e: unknown, porDefecto: string) {
    setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  const crear = useMutation({
    mutationFn: (datos: DatosEmpleado) =>
      endpointEmpleados.crear(establecimientoId!, {
        nombre: datos.nombre,
        pin: datos.pin,
        permisos: datos.permisos,
      }),
    onSuccess: cerrarYRefrescar,
    // El backend rechaza nombres repetidos entre los activos y PINes triviales;
    // los dos mensajes son útiles tal cual y se muestran dentro del formulario.
    onError: (e) => alFallar(e, "No pudimos dar de alta al empleado."),
  });

  const actualizarPermisos = useMutation({
    mutationFn: ({ id, permisos }: { id: number; permisos: DatosEmpleado["permisos"] }) =>
      endpointEmpleados.actualizarPermisos(establecimientoId!, id, { permisos }),
    onSuccess: cerrarYRefrescar,
    onError: (e) => alFallar(e, "No pudimos guardar los permisos."),
  });

  const cambiarPin = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin: string }) =>
      endpointEmpleados.cambiarPin(establecimientoId!, id, { pin }),
    onSuccess: cerrarYRefrescar,
    onError: (e) => alFallar(e, "No pudimos cambiar el PIN."),
  });

  const darDeBaja = useMutation({
    mutationFn: (id: number) => endpointEmpleados.desactivar(establecimientoId!, id),
    onSuccess: cerrarYRefrescar,
    onError: (e) => alFallar(e, "No pudimos dar de baja al empleado."),
  });

  const estadoCarga: EstadoCarga = consulta.isPending ? "cargando" : consulta.isError ? "error" : "listo";

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function guardarFicha(datos: DatosEmpleado) {
    const empleado = panelAbierto?.tipo === "ficha" ? panelAbierto.empleado : null;
    if (empleado) actualizarPermisos.mutate({ id: empleado.id, permisos: datos.permisos });
    else crear.mutate(datos);
  }

  const empleados = consulta.data ?? [];
  const activos = empleados.filter((e) => e.activo);
  const inactivos = empleados.filter((e) => !e.activo);

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <Link href="/panel/configuracion" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-grafito hover:text-tinta">
            <ChevronLeft className="size-4" aria-hidden />
            Configuración
          </Link>

          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Empleados</h1>
              <p className="text-sm text-grafito">
                Entran por la PC del mostrador tocando su nombre y su PIN de 4 dígitos — sin compartir tu login.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanelAbierto({ tipo: "ficha", empleado: null })}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo empleado
            </button>
          </div>

          {errorAccion && panelAbierto === null && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {estadoCarga === "cargando" && <SkeletonEmpleados />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los empleados.</p>
              <button
                type="button"
                onClick={() => consulta.refetch()}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && empleados.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <Users className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no diste de alta a nadie</p>
              <p className="max-w-sm text-sm text-grafito">
                Cargá a alguien de tu equipo con su nombre y un PIN. Para que pueda entrar además necesitás una PC
                emparejada como caja, desde Configuración.
              </p>
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "ficha", empleado: null })}
                className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Nuevo empleado
              </button>
            </div>
          )}

          {estadoCarga === "listo" && empleados.length > 0 && (
            <div className="space-y-6">
              <TablaEmpleados
                empleados={activos}
                onEditarPermisos={(empleado) => setPanelAbierto({ tipo: "ficha", empleado })}
                onCambiarPin={(empleado) => setPanelAbierto({ tipo: "pin", empleado })}
                onDarDeBaja={(empleado) => setPanelAbierto({ tipo: "baja", empleado })}
              />

              {/* Separados a propósito: dar de baja no tiene vuelta atrás —
                  no hay endpoint para reactivar— así que conviene que no
                  parezcan una fila más de la misma tabla. */}
              {inactivos.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grafito">Dados de baja</p>
                  <TablaEmpleados
                    empleados={inactivos}
                    onEditarPermisos={() => {}}
                    onCambiarPin={() => {}}
                    onDarDeBaja={() => {}}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "ficha" && (
        <DrawerPanel
          titulo={panelAbierto.empleado ? "Editar permisos" : "Nuevo empleado"}
          subtitulo={panelAbierto.empleado?.nombre}
          onClose={() => setPanelAbierto(null)}
        >
          <FormFichaEmpleado
            empleado={panelAbierto.empleado}
            guardando={crear.isPending || actualizarPermisos.isPending}
            error={errorAccion}
            onGuardar={guardarFicha}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "pin" && (
        <ModalPanel titulo="Cambiar PIN" subtitulo={panelAbierto.empleado.nombre} onClose={() => setPanelAbierto(null)}>
          <div className="space-y-4">
            {/* Cambiar el PIN incrementa el tokenVersion del empleado: si está
                trabajando en el mostrador en este momento, su sesión se corta. */}
            <p className="text-sm text-tinta">
              Si <span className="font-semibold">{panelAbierto.empleado.nombre}</span> está operando una caja ahora
              mismo, su sesión se cierra y va a tener que volver a entrar con el PIN nuevo.
            </p>
            <div>
              <label htmlFor="pin-nuevo" className="mb-1 block text-xs font-semibold text-grafito">
                PIN nuevo (4 dígitos)
              </label>
              <input
                id="pin-nuevo"
                autoFocus
                inputMode="numeric"
                maxLength={4}
                value={pinNuevo}
                onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
              <p className="mt-1 text-xs text-grafito">Nada de secuencias ni repeticiones: el sistema las rechaza.</p>
            </div>
            {errorAccion && (
              <p role="alert" className="text-sm text-cancelado">
                {errorAccion}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPanelAbierto(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => cambiarPin.mutate({ id: panelAbierto.empleado.id, pin: pinNuevo })}
                disabled={!PIN_VALIDO.test(pinNuevo) || cambiarPin.isPending}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
              >
                {cambiarPin.isPending ? "Guardando..." : "Cambiar PIN"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {panelAbierto?.tipo === "baja" && (
        <ModalPanel titulo="Dar de baja" subtitulo={panelAbierto.empleado.nombre} onClose={() => setPanelAbierto(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              <span className="font-semibold">{panelAbierto.empleado.nombre}</span> pierde el acceso al mostrador. No se
              borra: conservás el historial de lo que cobró.
            </p>
            {/* No existe endpoint para reactivar, y el chequeo de nombre
                duplicado sólo mira a los activos: por eso "volver a darlo de
                alta" funciona, pero crea un empleado nuevo con el mismo nombre. */}
            <p className="text-sm text-grafito">
              No se puede reactivar: si vuelve, hay que darlo de alta de nuevo, con un PIN nuevo.
            </p>
            {errorAccion && (
              <p role="alert" className="text-sm text-cancelado">
                {errorAccion}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPanelAbierto(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => darDeBaja.mutate(panelAbierto.empleado.id)}
                disabled={darDeBaja.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                <UserX className="size-4" aria-hidden />
                {darDeBaja.isPending ? "Dando de baja..." : "Dar de baja"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
