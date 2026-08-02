"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Building2, CalendarClock, ChevronRight, Clock, Images, Plus, Smartphone, Users, Wallet } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { FormDatosComplejo } from "@/components/panel/form-datos-complejo";
import { GaleriaConfig } from "@/components/panel/galeria-config";
import { FormHorariosAtencion } from "@/components/panel/form-horarios-atencion";
import { FormPoliticaCancelacion } from "@/components/panel/form-politica-cancelacion";
import { PanelMercadoPago } from "@/components/panel/panel-mercadopago";
import { TablaDispositivos } from "@/components/panel/tabla-dispositivos";
import { GenerarLinkCaja } from "@/components/panel/generar-link-caja";
import { SkeletonConfig } from "@/components/panel/skeleton-config";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { hoyISO } from "@/lib/fecha";
import {
  emparejarDispositivo,
  generarTokenEmparejamiento,
  renombrarDispositivo,
  revocarDispositivo,
  useEmparejado,
  useFechaEmparejamientoDispositivo,
  useFechaUltimoUsoDispositivo,
  useNombreDispositivo,
} from "@/lib/sesion-caja";
import { PANEL_COMPLEJO } from "@/mocks/agenda";
import { PANEL_EMPLEADOS } from "@/mocks/empleados";
import { PANEL_DISPOSITIVOS_MOCK, type Dispositivo } from "@/mocks/dispositivos";
import {
  PANEL_DATOS_COMPLEJO,
  PANEL_FOTOS,
  PANEL_HORARIOS_ATENCION,
  PANEL_MERCADOPAGO,
  PANEL_POLITICA_CANCELACION,
  type CuentaMercadoPago,
  type DatosComplejo,
  type FotoComplejo,
  type HorarioDia,
  type PoliticaCancelacion,
} from "@/mocks/config";

type EstadoCarga = "cargando" | "error" | "listo";

function Seccion({ icono: Icono, titulo, descripcion, children }: { icono: typeof Building2; titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-white p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <Icono className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
        <div>
          <h2 className="font-display text-base font-bold text-tinta">{titulo}</h2>
          <p className="text-sm text-grafito">{descripcion}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// Solo dueño — el sidebar ya le oculta el ítem al empleado, pero acá
// además se redirige si entra por URL directa. ?mockError=1 fuerza
// el estado de error, mismo patrón que el resto del panel. No hay
// estado "vacío": la configuración del establecimiento siempre existe,
// a diferencia de una lista que puede no tener elementos.
export default function PanelConfiguracion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const mockError = searchParams.get("mockError") === "1";
  const mockVacioDispositivos = searchParams.get("mockVacio") === "1";

  const [datos, setDatos] = useState<DatosComplejo | null>(null);
  const [fotos, setFotos] = useState<FotoComplejo[]>([]);
  const [horarios, setHorarios] = useState<HorarioDia[]>([]);
  const [politica, setPolitica] = useState<PoliticaCancelacion | null>(null);
  const [mercadoPago, setMercadoPago] = useState<CuentaMercadoPago | null>(null);
  const [dispositivosMock, setDispositivosMock] = useState<Dispositivo[]>([]);
  const [proximoFotoId, setProximoFotoId] = useState(1000);
  const [reintento, setReintento] = useState(0);

  // "Este dispositivo" (el navegador que está usando el dueño ahora)
  // sale en vivo de @/lib/sesion-caja, no del mock — si YA lo usó
  // para emparejar una caja alguna vez, tiene que aparecer en la
  // lista como cualquier otro. El resto de la lista (ej. "Bar") es
  // puramente de ejemplo.
  const emparejadoAqui = useEmparejado();
  const nombreDispositivoAqui = useNombreDispositivo();
  const fechaEmparejamientoAqui = useFechaEmparejamientoDispositivo();
  const fechaUltimoUsoAqui = useFechaUltimoUsoDispositivo();

  const [linkGenerado, setLinkGenerado] = useState<{ token: string; expiraEn: string } | null>(null);
  const [dispositivoARevocar, setDispositivoARevocar] = useState<Dispositivo | null>(null);
  const [confirmandoActivarCaja, setConfirmandoActivarCaja] = useState(false);

  // "!bloqueadoPorCaja &&" evita una carrera: "Activar esta
  // computadora como caja" (más abajo) cambia "rol" a "empleado" en
  // el mismo render en el que se dispara, y sin este chequeo este
  // efecto pisaba el router.replace("/caja") de useBloqueadoPorCaja
  // con uno a /panel/agenda — dejando al dueño viendo un panel que
  // ya no le correspondía en vez de la pantalla de nombres del kiosco.
  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  const clave = `${mockError}|${mockVacioDispositivos}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => {
      if (mockError) {
        setResuelto({ clave, error: true });
        return;
      }
      setDatos({ ...PANEL_DATOS_COMPLEJO });
      setFotos(PANEL_FOTOS.map((f) => ({ ...f })));
      setHorarios(PANEL_HORARIOS_ATENCION.map((h) => ({ ...h })));
      setPolitica({ ...PANEL_POLITICA_CANCELACION });
      setMercadoPago({ ...PANEL_MERCADOPAGO });
      setDispositivosMock(mockVacioDispositivos ? [] : PANEL_DISPOSITIVOS_MOCK.map((d) => ({ ...d })));
      setResuelto({ clave, error: false });
    }, 500);
    return () => clearTimeout(id);
  }, [clave, mockError, mockVacioDispositivos]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function agregarFoto(etiqueta: string) {
    setFotos((prev) => [...prev, { id: `foto-${proximoFotoId}`, etiqueta }]);
    setProximoFotoId((id) => id + 1);
  }

  function eliminarFoto(id: string) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
  }

  function moverFoto(id: string, direccion: -1 | 1) {
    setFotos((prev) => {
      const indice = prev.findIndex((f) => f.id === id);
      const destino = indice + direccion;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function conectarMercadoPago() {
    setMercadoPago((prev) => (prev ? { ...prev, estado: "pendiente", emailConectado: undefined, fechaConexion: undefined } : prev));
  }

  function renombrarFila(id: string, nombre: string) {
    if (id === "este-dispositivo") {
      renombrarDispositivo(nombre);
      return;
    }
    setDispositivosMock((prev) => prev.map((d) => (d.id === id ? { ...d, nombre } : d)));
  }

  function confirmarRevocar(dispositivo: Dispositivo) {
    if (dispositivo.id === "este-dispositivo") {
      revocarDispositivo();
    } else {
      setDispositivosMock((prev) => prev.filter((d) => d.id !== dispositivo.id));
    }
    setDispositivoARevocar(null);
  }

  function generarLink() {
    setLinkGenerado(generarTokenEmparejamiento());
  }

  // Emparejar ESTA computadora directamente (sin generar un link para
  // otra) es precisamente lo que cierra el acceso implícito de dueño
  // acá — no queda ninguna sesión de dueño que limpiar por separado,
  // porque nunca existió como token: era solo "no hay empleado
  // logueado" (useRolPanel). Emparejar hace que esa ausencia deje de
  // significar "entonces sos dueño" — por eso la redirección a /caja
  // inmediatamente después, mismo destino que deja "la pantalla de
  // nombres de la caja, esperando un PIN".
  function activarEstaComputadoraComoCaja() {
    emparejarDispositivo(PANEL_COMPLEJO.nombre);
    setConfirmandoActivarCaja(false);
    router.push("/caja");
  }

  const empleadosActivos = PANEL_EMPLEADOS.filter((e) => e.estado === "activo").length;

  const dispositivos: Dispositivo[] = [
    ...(emparejadoAqui
      ? [
          {
            id: "este-dispositivo",
            nombre: nombreDispositivoAqui,
            fechaEmparejamiento: fechaEmparejamientoAqui ?? hoyISO(),
            fechaUltimoUso: fechaUltimoUsoAqui ?? fechaEmparejamientoAqui ?? hoyISO(),
          },
        ]
      : []),
    ...dispositivosMock,
  ];

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
          <h1 className="mb-5 font-display text-xl font-bold text-tinta">Configuración</h1>

          {estadoCarga === "cargando" && <SkeletonConfig />}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la configuración.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && datos && politica && mercadoPago && (
            <div className="space-y-4">
              <Seccion icono={Building2} titulo="Datos del complejo" descripcion="Nombre, dirección y deportes que se ven en el marketplace.">
                <FormDatosComplejo datos={datos} onGuardar={setDatos} />
              </Seccion>

              <Seccion icono={Images} titulo="Fotos" descripcion="Las que ve el jugador al entrar a la ficha del complejo.">
                <GaleriaConfig fotos={fotos} onAgregar={agregarFoto} onEliminar={eliminarFoto} onMover={moverFoto} />
              </Seccion>

              <Seccion icono={Clock} titulo="Horarios de atención" descripcion="Alimentan la disponibilidad y el % de ocupación de Reportes.">
                <FormHorariosAtencion horarios={horarios} onGuardar={setHorarios} />
              </Seccion>

              <Seccion icono={CalendarClock} titulo="Política de cancelación" descripcion="Hasta cuándo se reembolsa la seña — el jugador la ve en el checkout.">
                <FormPoliticaCancelacion politica={politica} onGuardar={setPolitica} />
              </Seccion>

              <Seccion icono={Wallet} titulo="MercadoPago" descripcion="Define si el complejo puede cobrar señas online.">
                <PanelMercadoPago cuenta={mercadoPago} onConectar={conectarMercadoPago} />
              </Seccion>

              <Seccion
                icono={Smartphone}
                titulo="Dispositivos"
                descripcion="Las PCs de mostrador emparejadas con el kiosco de caja (zona /caja) — desde acá generás el link para vincular una nueva y revocás las que ya no usás."
              >
                {dispositivos.length === 0 ? (
                  <div className="rounded-input bg-humo p-5 text-center">
                    <p className="text-sm font-semibold text-tinta">Todavía no emparejaste ninguna caja</p>
                    <p className="mt-1 text-sm text-grafito">
                      El modo caja convierte cualquier PC de mostrador en una entrada rápida al panel: el empleado toca su nombre, pone su PIN y
                      opera con sus permisos, sin compartir tu login.
                    </p>
                  </div>
                ) : (
                  <TablaDispositivos dispositivos={dispositivos} onRenombrar={renombrarFila} onRevocar={setDispositivoARevocar} />
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={generarLink}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
                  >
                    <Plus className="size-4" aria-hidden />
                    Generar link para nueva caja
                  </button>
                  {!emparejadoAqui && (
                    <button
                      type="button"
                      onClick={() => setConfirmandoActivarCaja(true)}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
                    >
                      <Smartphone className="size-4" aria-hidden />
                      Activar esta computadora como caja
                    </button>
                  )}
                </div>
              </Seccion>

              <Link
                href="/panel/configuracion/empleados"
                className="flex items-center gap-3 rounded-card bg-white p-5 transition-colors hover:bg-celeste-suave/40"
              >
                <Users className="size-5 shrink-0 text-azul" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-tinta">Empleados</p>
                  <p className="text-sm text-grafito">
                    {empleadosActivos} {empleadosActivos === 1 ? "empleado activo" : "empleados activos"} — dales de alta con sus permisos o dá de baja accesos.
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-grafito" aria-hidden />
              </Link>
            </div>
          )}
        </main>
      </div>

      {linkGenerado && (
        <ModalPanel titulo="Nueva caja" subtitulo="Escaneá o compartí este link desde la PC del mostrador" onClose={() => setLinkGenerado(null)}>
          <GenerarLinkCaja token={linkGenerado.token} expiraEn={linkGenerado.expiraEn} />
        </ModalPanel>
      )}

      {dispositivoARevocar && (
        <ModalPanel titulo="Revocar dispositivo" subtitulo={dispositivoARevocar.nombre} onClose={() => setDispositivoARevocar(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              <span className="font-semibold">{dispositivoARevocar.nombre}</span> pierde el acceso de inmediato. En su próximo intento va a caer
              a la pantalla de &ldquo;no emparejado&rdquo; — para volver a usarla hace falta un link nuevo.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDispositivoARevocar(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmarRevocar(dispositivoARevocar)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90"
              >
                Revocar
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {confirmandoActivarCaja && (
        <ModalPanel titulo="Activar como caja" onClose={() => setConfirmandoActivarCaja(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Al activar esta caja vas a cerrar tu sesión en esta computadora. Para volver a entrar como dueño vas a tener que iniciar sesión de
              nuevo — desde otra computadora, o cuando exista el login real del panel.
            </p>
            <p className="text-sm text-grafito">Esta PC va a quedar en la pantalla de nombres del kiosco, lista para que un empleado entre con su PIN.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoActivarCaja(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={activarEstaComputadoraComoCaja}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Activar
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
