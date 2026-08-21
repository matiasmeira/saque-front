"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Building2, CalendarClock, Check, ChevronRight, Clock, Images, Plus, Smartphone, Sparkles, Users, Wallet } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { FormDatosComplejo, type DatosEstablecimiento } from "@/components/panel/form-datos-complejo";
import { FormHorariosAtencion } from "@/components/panel/form-horarios-atencion";
import { FormServicios } from "@/components/panel/form-servicios";
import { TablaDispositivos } from "@/components/panel/tabla-dispositivos";
import { GenerarLinkCaja } from "@/components/panel/generar-link-caja";
import { SkeletonConfig } from "@/components/panel/skeleton-config";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dispositivos as endpointDispositivos } from "@/lib/api/endpoints/caja";
import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { borrarToken } from "@/lib/api/sesion";
import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";
import type { EstablecimientoRequest } from "@/lib/api/tipos/establecimientos";
import type { HorarioAtencionDto, Servicio } from "@/lib/api/tipos/comunes";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { guardarDispositivo, useEmparejado } from "@/lib/sesion-caja";

type SeccionGuardable = "datos" | "horarios" | "servicios";

function Seccion({ icono: Icono, titulo, descripcion, children }: { icono: typeof Building2; titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-white p-6 shadow-card">
      <div className="mb-4 flex items-start gap-2.5">
        <Icono className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
        <div>
          <h2 className="font-display text-lg font-bold text-tinta">{titulo}</h2>
          <p className="text-sm text-grafito">{descripcion}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** Sección cuyo dato existe en la entidad pero que ningún endpoint expone todavía. */
function SeccionSinEndpoint({ icono, titulo, descripcion, falta }: { icono: typeof Building2; titulo: string; descripcion: string; falta: string }) {
  return (
    <Seccion icono={icono} titulo={titulo} descripcion={descripcion}>
      <div className="rounded-input bg-humo p-5">
        <p className="text-sm font-semibold text-tinta">Todavía no se puede editar desde acá</p>
        <p className="mt-1 text-sm text-grafito">{falta}</p>
      </div>
    </Seccion>
  );
}

/**
 * Configuración del establecimiento.
 *
 * El PUT es del OBJETO ENTERO: `EstablecimientoRequest` exige nombre,
 * dirección, latitud, longitud y requiereSena siempre. Además —y esto es lo
 * que muerde— `horariosAtencion` NO tiene semántica de "no modificar": el
 * service hace `getHorariosAtencion().clear()` y vuelve a cargar lo que venga
 * en el request, así que un PUT sin horarios los BORRA. Por eso cada sección
 * manda el establecimiento completo con su parte cambiada, y no sólo su parte.
 *
 * `servicios` sí distingue: null = no modificar, [] = borrar todos. Sólo la
 * sección de servicios manda ese campo.
 */
export default function PanelConfiguracion() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const perfilPendiente = usePerfilPendiente();
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const { establecimientoId, establecimiento, cargando } = useEstablecimientoActivo();

  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<SeccionGuardable | null>(null);
  const [dispositivoARevocar, setDispositivoARevocar] = useState<DispositivoCajaResponse | null>(null);
  const [confirmandoActivarCaja, setConfirmandoActivarCaja] = useState(false);

  // "Emparejado acá" es una marca local: la cookie saque_caja_device es HttpOnly
  // y el JS no puede leerla, así que este navegador no puede saber por sí mismo
  // si ES uno de los dispositivos de la lista.
  const emparejadoAqui = useEmparejado();

  const listaDispositivos = useQuery({
    queryKey: keys.caja.dispositivos(establecimientoId ?? 0),
    queryFn: () => endpointDispositivos.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  const invalidarDispositivos = () =>
    queryClient.invalidateQueries({ queryKey: keys.caja.dispositivos(establecimientoId ?? 0) });

  const generarCodigo = useMutation({
    mutationFn: () => endpointDispositivos.generarCodigo(establecimientoId!, "Caja mostrador"),
    onSuccess: invalidarDispositivos,
  });

  const revocarDispositivo = useMutation({
    mutationFn: (dispositivoId: number) => endpointDispositivos.revocar(establecimientoId!, dispositivoId),
    onSuccess: () => {
      invalidarDispositivos();
      setDispositivoARevocar(null);
    },
  });

  /**
   * Emparejar ESTA computadora (sin generar un link para otra) es entregarla al
   * mostrador: queda la cookie de dispositivo, y la sesión de dueño se corta acá
   * mismo para que nadie siga operando con ella.
   *
   * Se borra el token LOCAL a mano en vez de llamar a POST /auth/logout: ese
   * endpoint incrementa tokenVersion e invalida los JWT del dueño en TODOS sus
   * dispositivos — entregar la PC del mostrador no tiene por qué desloguearlo
   * del teléfono.
   */
  const activarLocal = useMutation({
    mutationFn: () => endpointDispositivos.activarLocal(establecimientoId!, "Caja mostrador"),
    onSuccess: (activado) => {
      guardarDispositivo(establecimientoId!, activado.label);
      borrarToken();
      queryClient.clear();
      setConfirmandoActivarCaja(false);
      router.push("/caja");
    },
  });

  const guardar = useMutation({
    mutationFn: ({ cambios }: { seccion: SeccionGuardable; cambios: Partial<EstablecimientoRequest> }) => {
      const actual = establecimiento!;
      return endpointEstablecimientos.actualizar(actual.id, {
        nombre: actual.nombre,
        direccion: actual.direccion,
        latitud: actual.latitud,
        longitud: actual.longitud,
        requiereSena: actual.requiereSena,
        // Va SIEMPRE: omitirlo borra los horarios del establecimiento.
        horariosAtencion: actual.horariosAtencion,
        ...cambios,
      });
    },
    onSuccess: (_, { seccion }) => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
      setErrorAccion(null);
      setGuardado(seccion);
    },
    onError: (e) => {
      setGuardado(null);
      setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar los cambios.");
    },
  });

  const guardandoSeccion = guardar.isPending ? guardar.variables.seccion : null;

  // "!bloqueadoPorCaja &&" evita una carrera: "Activar esta computadora como
  // caja" cambia "rol" a "empleado" en el mismo render en el que se dispara, y
  // sin este chequeo este efecto pisaba el router.replace("/caja") de
  // useBloqueadoPorCaja con uno a /panel/agenda — dejando al dueño viendo un
  // panel que ya no le correspondía en vez de la pantalla de nombres del kiosco.
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function guardarDatos(datos: DatosEstablecimiento) {
    guardar.mutate({ seccion: "datos", cambios: datos });
  }

  function guardarHorarios(horariosAtencion: HorarioAtencionDto[]) {
    guardar.mutate({ seccion: "horarios", cambios: { horariosAtencion } });
  }

  function guardarServicios(servicios: Servicio[]) {
    guardar.mutate({ seccion: "servicios", cambios: { servicios } });
  }

  const dispositivos = listaDispositivos.data ?? [];

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Configuración</h1>

          {errorAccion && (
            <p role="alert" className="mb-4 rounded-card bg-white p-4 text-sm text-cancelado shadow-card">
              {errorAccion}
            </p>
          )}

          {cargando && <SkeletonConfig />}

          {!cargando && !establecimiento && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center shadow-card">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar la configuración.</p>
              <p className="max-w-sm text-sm text-grafito">
                No encontramos ningún complejo asociado a tu cuenta.
              </p>
            </div>
          )}

          {establecimiento && (
            <div className="space-y-6">
              <Seccion icono={Building2} titulo="Datos del complejo" descripcion="Nombre, dirección y ubicación con la que aparecés en el marketplace.">
                <FormDatosComplejo
                  establecimiento={establecimiento}
                  plan={perfil?.planSuscripcion}
                  guardando={guardandoSeccion === "datos"}
                  onGuardar={guardarDatos}
                />
                {guardado === "datos" && <Guardado />}
              </Seccion>

              <Seccion icono={Clock} titulo="Horarios de atención" descripcion="Alimentan la disponibilidad y el % de ocupación de Reportes.">
                <FormHorariosAtencion
                  horarios={establecimiento.horariosAtencion}
                  guardando={guardandoSeccion === "horarios"}
                  onGuardar={guardarHorarios}
                />
                {guardado === "horarios" && <Guardado />}
              </Seccion>

              <Seccion icono={Sparkles} titulo="Servicios" descripcion="Lo que el jugador ve en la ficha del complejo: parrilla, duchas, estacionamiento.">
                <FormServicios
                  servicios={establecimiento.servicios}
                  guardando={guardandoSeccion === "servicios"}
                  onGuardar={guardarServicios}
                />
                {guardado === "servicios" && <Guardado />}
              </Seccion>

              <SeccionSinEndpoint
                icono={Images}
                titulo="Fotos"
                descripcion="Las que ve el jugador al entrar a la ficha del complejo."
                falta="El complejo guarda sus fotos y la zona pública las muestra, pero no hay endpoint para subirlas ni para cambiarlas: EstablecimientoRequest no acepta el campo."
              />

              <SeccionSinEndpoint
                icono={CalendarClock}
                titulo="Política de cancelación"
                descripcion="Hasta cuándo se puede cancelar sin perder la seña."
                falta="Rige el valor por defecto: 24 horas de anticipación, con 30 minutos de gracia desde que se creó la reserva. Está en la entidad pero no se expone ni para leerlo ni para cambiarlo."
              />

              <SeccionSinEndpoint
                icono={Wallet}
                titulo="MercadoPago"
                descripcion="Define si el complejo puede cobrar señas online."
                falta="Todavía no hay integración de pagos en el backend, así que no hay cuenta que conectar."
              />

              <Seccion
                icono={Smartphone}
                titulo="Dispositivos"
                descripcion="Las PCs de mostrador emparejadas con el kiosco de caja (zona /caja) — desde acá generás el link para vincular una nueva y revocás las que ya no usás."
              >
                {listaDispositivos.isPending ? (
                  <div className="h-24 animate-pulse rounded-card bg-humo" />
                ) : listaDispositivos.isError ? (
                  <div className="rounded-input bg-cancelado-suave p-5 text-center">
                    <p className="text-sm font-semibold text-tinta">No pudimos cargar los dispositivos.</p>
                    <button
                      type="button"
                      onClick={() => listaDispositivos.refetch()}
                      className="mt-2 text-sm font-semibold text-azul hover:underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : dispositivos.length === 0 ? (
                  <div className="rounded-input bg-humo p-5 text-center">
                    <p className="text-sm font-semibold text-tinta">Todavía no emparejaste ninguna caja</p>
                    <p className="mt-1 text-sm text-grafito">
                      El modo caja convierte cualquier PC de mostrador en una entrada rápida al panel: el empleado toca su nombre, pone su PIN y
                      opera con sus permisos, sin compartir tu login.
                    </p>
                  </div>
                ) : (
                  <TablaDispositivos dispositivos={dispositivos} onRevocar={setDispositivoARevocar} />
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generarCodigo.mutate()}
                    disabled={establecimientoId === null || generarCodigo.isPending}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="size-4" aria-hidden />
                    {generarCodigo.isPending ? "Generando..." : "Generar link para nueva caja"}
                  </button>
                  {!emparejadoAqui && (
                    <button
                      type="button"
                      onClick={() => setConfirmandoActivarCaja(true)}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-borde px-4 font-display text-sm font-bold text-tinta transition-colors hover:border-azul focus:outline-none focus:ring-2 focus:ring-celeste"
                    >
                      <Smartphone className="size-4" aria-hidden />
                      Activar esta computadora como caja
                    </button>
                  )}
                </div>
              </Seccion>

              <Link
                href="/panel/configuracion/empleados"
                className="flex items-center gap-3 rounded-card bg-white p-6 shadow-card transition-colors hover:bg-celeste-suave/40"
              >
                <Users className="size-5 shrink-0 text-azul" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-tinta">Empleados</p>
                  <p className="text-sm text-grafito">Dales de alta con sus permisos o dá de baja accesos.</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-grafito" aria-hidden />
              </Link>
            </div>
          )}
        </main>
      </div>

      {generarCodigo.data && (
        <ModalPanel
          titulo="Nueva caja"
          subtitulo="Escaneá o compartí este link desde la PC del mostrador"
          onClose={() => generarCodigo.reset()}
        >
          <GenerarLinkCaja codigo={generarCodigo.data.codigo} expiraEn={generarCodigo.data.expiraEn} />
        </ModalPanel>
      )}

      {dispositivoARevocar && (
        <ModalPanel titulo="Revocar dispositivo" subtitulo={dispositivoARevocar.label} onClose={() => setDispositivoARevocar(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              <span className="font-semibold">{dispositivoARevocar.label}</span> pierde el acceso de inmediato. En su próximo intento va a caer
              a la pantalla de &ldquo;no emparejado&rdquo; — para volver a usarla hace falta un link nuevo.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDispositivoARevocar(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => revocarDispositivo.mutate(dispositivoARevocar.id)}
                disabled={revocarDispositivo.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                {revocarDispositivo.isPending ? "Revocando..." : "Revocar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {confirmandoActivarCaja && (
        <ModalPanel titulo="Activar como caja" onClose={() => setConfirmandoActivarCaja(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Al activar esta caja se cierra tu sesión en esta computadora. Para volver a entrar como dueño vas a tener que iniciar sesión de
              nuevo. Tus otras sesiones (teléfono, otra PC) no se tocan.
            </p>
            <p className="text-sm text-grafito">Esta PC va a quedar en la pantalla de nombres del kiosco, lista para que un empleado entre con su PIN.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoActivarCaja(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => activarLocal.mutate()}
                disabled={establecimientoId === null || activarLocal.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                {activarLocal.isPending ? "Activando..." : "Activar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}

function Guardado() {
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-disponible">
      <Check className="size-4 shrink-0" aria-hidden />
      Guardado.
    </p>
  );
}
