"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Plus, UserX, Users } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { TablaEmpleados } from "@/components/panel/tabla-empleados";
import { FormFichaEmpleado, type DatosEmpleado } from "@/components/panel/form-ficha-empleado";
import { SkeletonEmpleados } from "@/components/panel/skeleton-empleados";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { hoyISO } from "@/lib/fecha";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_EMPLEADOS, type Empleado } from "@/mocks/empleados";

type EstadoCarga = "cargando" | "error" | "listo";
type PanelAbierto = { tipo: "ficha"; empleado: Empleado | null } | { tipo: "baja"; empleado: Empleado } | null;

// Solo dueño — ni el empleado con más permisos administra a otros
// empleados. ?mockError=1 y ?mockVacio=1 fuerzan esos estados, mismo
// patrón que el resto del panel.
export default function PanelEmpleados() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacio = searchParams.get("mockVacio") === "1";

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [reintento, setReintento] = useState(0);
  const [proximoId, setProximoId] = useState(1000);

  // "!bloqueadoPorCaja &&" evita pisar el router.replace("/caja") de
  // useBloqueadoPorCaja con un redirect a /panel/agenda.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  const clave = `${mockError}|${mockVacio}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setEmpleados(mockVacio ? [] : PANEL_EMPLEADOS.map((e) => ({ ...e })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacio]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function crearEmpleado(datos: DatosEmpleado) {
    setEmpleados((prev) => [
      ...prev,
      { id: `emp-${proximoId}`, nombre: datos.nombre, contrasena: datos.contrasena ?? "", pin: datos.pin ?? "", estado: "activo", permisos: datos.permisos, fechaAlta: hoyISO() },
    ]);
    setProximoId((id) => id + 1);
    setPanelAbierto(null);
  }

  function editarPermisos(id: string, datos: DatosEmpleado) {
    setEmpleados((prev) => prev.map((e) => (e.id === id ? { ...e, nombre: datos.nombre, permisos: datos.permisos } : e)));
    setPanelAbierto(null);
  }

  // Dar de baja revoca el acceso de inmediato — nunca borra al
  // empleado, para conservar el historial de quién cobró qué en la
  // agenda (C2/C5). TODO backend: esto tiene que invalidar la
  // sesión/token de esa persona al instante, no solo cambiar un flag.
  function confirmarBaja(empleado: Empleado) {
    setEmpleados((prev) => prev.map((e) => (e.id === empleado.id ? { ...e, estado: "inactivo" } : e)));
    setPanelAbierto(null);
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
          <Link href="/panel/configuracion" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-grafito hover:text-tinta">
            <ChevronLeft className="size-4" aria-hidden />
            Configuración
          </Link>

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold text-tinta">Empleados</h1>
              <p className="text-sm text-grafito">Cada uno entra con nombre y contraseña, y solo puede hacer lo que le tildaste en sus permisos.</p>
            </div>
            <button
              type="button"
              onClick={() => setPanelAbierto({ tipo: "ficha", empleado: null })}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo empleado
            </button>
          </div>

          {estadoCarga === "cargando" && <SkeletonEmpleados />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar los empleados.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && empleados.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <Users className="size-8 text-grafito" aria-hidden />
              <p className="font-display font-bold text-tinta">Todavía no invitaste a nadie</p>
              <p className="max-w-xs text-sm text-grafito">Cargá a alguien de tu equipo con nombre, contraseña y los permisos que necesite.</p>
              <button
                type="button"
                onClick={() => setPanelAbierto({ tipo: "ficha", empleado: null })}
                className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                <Plus className="size-4" aria-hidden />
                Nuevo empleado
              </button>
            </div>
          )}

          {estadoCarga === "listo" && empleados.length > 0 && (
            <TablaEmpleados
              empleados={empleados}
              onEditar={(empleado) => setPanelAbierto({ tipo: "ficha", empleado })}
              onDarDeBaja={(empleado) => setPanelAbierto({ tipo: "baja", empleado })}
            />
          )}
        </main>
      </div>

      {panelAbierto?.tipo === "ficha" && (
        <DrawerPanel
          titulo={panelAbierto.empleado ? "Editar empleado" : "Nuevo empleado"}
          subtitulo={panelAbierto.empleado?.nombre}
          onClose={() => setPanelAbierto(null)}
        >
          <FormFichaEmpleado
            empleado={panelAbierto.empleado}
            onGuardar={(datos) => (panelAbierto.empleado ? editarPermisos(panelAbierto.empleado.id, datos) : crearEmpleado(datos))}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {panelAbierto?.tipo === "baja" && (
        <ModalPanel titulo="Dar de baja" subtitulo={panelAbierto.empleado.nombre} onClose={() => setPanelAbierto(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              <span className="font-semibold">{panelAbierto.empleado.nombre}</span> pierde el acceso al panel de inmediato. No se borra —
              conservás su historial, pero no va a poder volver a entrar hasta que lo des de alta de nuevo.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPanelAbierto(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmarBaja(panelAbierto.empleado)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90"
              >
                <UserX className="size-4" aria-hidden />
                Dar de baja
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
