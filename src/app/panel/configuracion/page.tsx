"use client";

import { requiereTelefonoEfectivo } from "@/lib/verificacion-telefono";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Ban, Building2, CalendarClock, CalendarOff, Check, ChevronRight, Clock, Images, Plus, RotateCcw, Shield, ShieldAlert, ShieldCheck, Smartphone, Sparkles, Trash2, Users, Wallet } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { FormDatosComplejo, type DatosEstablecimiento } from "@/components/panel/form-datos-complejo";
import { FormFotos } from "@/components/panel/form-fotos";
import { FormHorariosAtencion } from "@/components/panel/form-horarios-atencion";
import { FormServicios } from "@/components/panel/form-servicios";
import { FormSolicitudVerificacion } from "@/components/panel/form-solicitud-verificacion";
import { SeccionDiasNoLaborables } from "@/components/panel/seccion-dias-no-laborables";
import { SeccionPoliticaCancelacion } from "@/components/panel/seccion-politica-cancelacion";
import { TablaDispositivos } from "@/components/panel/tabla-dispositivos";
import { GenerarLinkCaja } from "@/components/panel/generar-link-caja";
import { RUTA_WIZARD } from "@/lib/panel/nuevo-complejo";
import { SkeletonConfig } from "@/components/panel/skeleton-config";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dispositivos as endpointDispositivos } from "@/lib/api/endpoints/caja";
import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { invalidarDisponibilidad } from "@/lib/api/invalidaciones";
import { borrarToken } from "@/lib/api/sesion";
import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { useSolicitarVerificacion } from "@/hooks/api/use-verificacion-establecimiento";
import { useCambiarEstadoEstablecimiento, useEliminarEstablecimiento } from "@/hooks/api/use-establecimiento-riesgo";
import type { DispositivoCajaResponse } from "@/lib/api/tipos/caja";
import type { EstablecimientoRequest, EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";
import type { HorarioAtencionDto, Servicio } from "@/lib/api/tipos/comunes";
import { hayNombreRepetido, sugerirNombreDispositivo, validarNombreDispositivo } from "@/lib/panel/dispositivo-caja";
import type { DatosSolicitudVerificacion } from "@/lib/panel/verificacion";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja, usePerfilPendiente } from "@/lib/permisos";
import { borrarDispositivo, guardarDispositivo, useDispositivoIdActual, useEmparejado } from "@/lib/sesion-caja";
import { esEstaComputadora } from "@/lib/dispositivo-actual";

type SeccionGuardable = "datos" | "horarios" | "servicios";

function Seccion({
  id,
  icono: Icono,
  titulo,
  descripcion,
  children,
}: {
  id?: string;
  icono: typeof Building2;
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-card bg-white p-6 shadow-card">
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
 * dirección, latitud, longitud, requiereSena y requiereTelefonoVerificado
 * siempre. Además —y esto es lo que muerde— `horariosAtencion` NO tiene
 * semántica de "no modificar": el service hace `getHorariosAtencion().clear()`
 * y vuelve a cargar lo que venga en el request, así que un PUT sin horarios
 * los BORRA. Por eso cada sección manda el establecimiento completo con su
 * parte cambiada, y no sólo su parte.
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
  const [establecimientoIdVisto, setEstablecimientoIdVisto] = useState(establecimientoId);
  const [dispositivoARevocar, setDispositivoARevocar] = useState<DispositivoCajaResponse | null>(null);
  const [confirmandoActivarCaja, setConfirmandoActivarCaja] = useState(false);
  const [nombreActivarLocal, setNombreActivarLocal] = useState("");
  const [pidiendoNombreCajaNueva, setPidiendoNombreCajaNueva] = useState(false);
  const [nombreCajaNueva, setNombreCajaNueva] = useState("");

  // "Emparejado acá" es una marca local: la cookie saque_caja_device es HttpOnly
  // y el JS no puede leerla, así que este navegador no puede saber por sí mismo
  // si ES uno de los dispositivos de la lista.
  const emparejadoAqui = useEmparejado();
  // Id guardado al emparejar esta PC (ver sesion-caja.ts): null si nunca se
  // guardó, y entonces ninguna fila de la tabla se marca como "esta compu".
  const idDispositivoActual = useDispositivoIdActual();

  const listaDispositivos = useQuery({
    queryKey: keys.caja.dispositivos(establecimientoId ?? 0),
    queryFn: () => endpointDispositivos.listar(establecimientoId!),
    enabled: establecimientoId !== null,
  });

  const invalidarDispositivos = () =>
    queryClient.invalidateQueries({ queryKey: keys.caja.dispositivos(establecimientoId ?? 0) });

  const generarCodigo = useMutation({
    mutationFn: (label: string) => endpointDispositivos.generarCodigo(establecimientoId!, label),
    onSuccess: () => {
      invalidarDispositivos();
      setPidiendoNombreCajaNueva(false);
    },
  });

  const revocarDispositivo = useMutation({
    mutationFn: (dispositivoId: number) => endpointDispositivos.revocar(establecimientoId!, dispositivoId),
    onSuccess: (_, dispositivoId) => {
      invalidarDispositivos();
      // Si la fila revocada era esta PC, no hace falta esperar a que /caja
      // note la revocación sola: se limpia el localStorage ya mismo para que
      // "Activar esta computadora como caja" vuelva a aparecer al toque.
      if (dispositivoId === idDispositivoActual) borrarDispositivo();
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
    mutationFn: (label: string) => endpointDispositivos.activarLocal(establecimientoId!, label),
    onSuccess: (activado) => {
      guardarDispositivo(establecimientoId!, activado.label, activado.dispositivoId);
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
        requiereTelefonoVerificado: requiereTelefonoEfectivo(actual.requiereTelefonoVerificado),
        // Va SIEMPRE: omitirlo borra los horarios del establecimiento.
        horariosAtencion: actual.horariosAtencion,
        ...cambios,
      });
    },
    onSuccess: (_, { seccion }) => {
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
      // Sólo horarios redefine los slots; datos y servicios no tocan la grilla.
      if (seccion === "horarios") invalidarDisponibilidad(queryClient);
      setErrorAccion(null);
      setGuardado(seccion);
    },
    onError: (e) => {
      setGuardado(null);
      setErrorAccion(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar los cambios.");
    },
  });

  const guardandoSeccion = guardar.isPending ? guardar.variables.seccion : null;

  const solicitarVerificacion = useSolicitarVerificacion();
  const errorVerificacion =
    solicitarVerificacion.error instanceof ApiError
      ? mensajeVisible(solicitarVerificacion.error)
      : solicitarVerificacion.isError
        ? "No pudimos enviar la solicitud."
        : null;
  const camposInvalidosVerificacion =
    solicitarVerificacion.error instanceof ApiError ? solicitarVerificacion.error.camposInvalidos : undefined;

  function enviarVerificacion(datos: DatosSolicitudVerificacion) {
    if (!establecimiento) return;
    solicitarVerificacion.mutate({ estId: establecimiento.id, datos });
  }

  // "!bloqueadoPorCaja &&" evita una carrera: "Activar esta computadora como
  // caja" cambia "rol" a "empleado" en el mismo render en el que se dispara, y
  // sin este chequeo este efecto pisaba el router.replace("/caja") de
  // useBloqueadoPorCaja con uno a /panel/agenda — dejando al dueño viendo un
  // panel que ya no le correspondía en vez de la pantalla de nombres del kiosco.
  useEffect(() => {
    if (!bloqueadoPorCaja && !perfilPendiente && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, perfilPendiente, rol, router]);

  // Sin esto, el tilde de "Guardado.", el banner de error de un complejo o el
  // error de la solicitud de verificación quedan pegados al cambiar de
  // establecimiento con el selector (sin navegar): son estado de esta página
  // (o, en el caso de la verificación, de una mutación única para toda la
  // página) y no de los formularios, y nada más los limpiaba.
  //
  // guardado/errorAccion son estado local: se ajustan durante el render
  // comparando contra el último establecimientoId visto (evita el
  // antipatrón que marca react-hooks/set-state-in-effect). La mutación de
  // verificación es un store externo (TanStack Query) y sí se resetea en un
  // efecto aparte, para no mutar ese store durante el render.
  if (establecimientoId !== establecimientoIdVisto) {
    setEstablecimientoIdVisto(establecimientoId);
    setGuardado(null);
    setErrorAccion(null);
  }

  useEffect(() => {
    solicitarVerificacion.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establecimientoId]);

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
  const labelsDispositivos = dispositivos.map((d) => d.label);

  const errorNombreCajaNueva = validarNombreDispositivo(nombreCajaNueva);
  const repetidoNombreCajaNueva = hayNombreRepetido(nombreCajaNueva, labelsDispositivos);

  const errorNombreActivarLocal = validarNombreDispositivo(nombreActivarLocal);
  const repetidoNombreActivarLocal = hayNombreRepetido(nombreActivarLocal, labelsDispositivos);

  function abrirPedidoNombreCajaNueva() {
    setNombreCajaNueva(sugerirNombreDispositivo(labelsDispositivos));
    setPidiendoNombreCajaNueva(true);
  }

  function cerrarPedidoNombreCajaNueva() {
    setPidiendoNombreCajaNueva(false);
    generarCodigo.reset();
  }

  function abrirConfirmarActivarCaja() {
    setNombreActivarLocal(sugerirNombreDispositivo(labelsDispositivos));
    setConfirmandoActivarCaja(true);
  }

  function cerrarConfirmarActivarCaja() {
    setConfirmandoActivarCaja(false);
    activarLocal.reset();
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
              <button
                type="button"
                onClick={() => router.push(RUTA_WIZARD)}
                className="mt-2 flex h-11 items-center gap-2 rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Plus className="size-4" aria-hidden />
                Crear tu primer complejo
              </button>
            </div>
          )}

          {establecimiento && (
            <div className="space-y-6">
              {/*
                key={establecimiento.id} en Datos/Horarios/Servicios: los tres
                siembran su estado con useState(prop) UNA sola vez, al montar.
                Sin key, cambiar de complejo con el selector (sin salir de esta
                pantalla) no los desmonta, y quedan mostrando el complejo
                anterior mientras el resto de la pantalla ya cambió. El key
                fuerza el remount y por lo tanto el reseed.
                Fotos, Días no laborables y Política de cancelación NO lo
                necesitan: reciben sólo establecimientoId y hacen su propio
                useQuery con ese id en la key, así que un cambio de complejo ya
                les dispara un refetch solo, sin ayuda.
              */}
              <Seccion icono={Building2} titulo="Datos del complejo" descripcion="Nombre, dirección y ubicación con la que aparecés en el marketplace.">
                <FormDatosComplejo
                  key={establecimiento.id}
                  establecimiento={establecimiento}
                  plan={perfil?.planSuscripcion}
                  guardando={guardandoSeccion === "datos"}
                  onGuardar={guardarDatos}
                />
                {guardado === "datos" && <Guardado />}
              </Seccion>

              {perfil?.rol === "OWNER" && (
                <Seccion
                  id="verificacion"
                  icono={Shield}
                  titulo="Verificación"
                  descripcion="Confirma que sos un dueño real. Sin esto tu complejo no aparece en el buscador ni puede recibir reservas."
                >
                  {establecimiento.estadoVerificacion === "PENDIENTE" && (
                    <FormSolicitudVerificacion
                      guardando={solicitarVerificacion.isPending}
                      error={errorVerificacion}
                      camposInvalidos={camposInvalidosVerificacion}
                      onGuardar={enviarVerificacion}
                      onBloqueoLocal={() => solicitarVerificacion.reset()}
                    />
                  )}

                  {establecimiento.estadoVerificacion === "EN_REVISION" && (
                    <div className="rounded-input bg-celeste-suave p-4 text-sm text-tinta">
                      Tu solicitud está en revisión. Te avisamos por mail apenas la resolvamos — no hace falta que
                      hagas nada más por ahora.
                    </div>
                  )}

                  {establecimiento.estadoVerificacion === "RECHAZADO" && (
                    <div className="space-y-4">
                      <div className="rounded-input bg-cancelado-suave p-4 text-sm">
                        <p className="font-semibold text-cancelado">Rechazamos tu solicitud</p>
                        <p className="mt-1 text-tinta">{establecimiento.motivoRechazo}</p>
                      </div>
                      <FormSolicitudVerificacion
                        datosIniciales={{
                          cuit: establecimiento.cuit ?? "",
                          razonSocial: establecimiento.razonSocial ?? "",
                          telefonoContacto: establecimiento.telefonoContacto ?? "",
                          urlRedSocial: establecimiento.urlRedSocial ?? "",
                        }}
                        textoBoton="Corregir y reenviar"
                        guardando={solicitarVerificacion.isPending}
                        error={errorVerificacion}
                        camposInvalidos={camposInvalidosVerificacion}
                        onGuardar={enviarVerificacion}
                        onBloqueoLocal={() => solicitarVerificacion.reset()}
                      />
                    </div>
                  )}

                  {establecimiento.estadoVerificacion === "VERIFICADO" && (
                    <div className="flex items-center gap-2.5 rounded-input bg-disponible-suave p-4 text-sm text-tinta">
                      <ShieldCheck className="size-5 shrink-0 text-disponible" aria-hidden />
                      Tu complejo está verificado. No hay nada más que hacer acá.
                    </div>
                  )}
                </Seccion>
              )}

              <Seccion icono={Clock} titulo="Horarios de atención" descripcion="Alimentan la disponibilidad y el % de ocupación de Reportes.">
                <FormHorariosAtencion
                  key={establecimiento.id}
                  horarios={establecimiento.horariosAtencion}
                  guardando={guardandoSeccion === "horarios"}
                  onGuardar={guardarHorarios}
                />
                {guardado === "horarios" && <Guardado />}
              </Seccion>

              <Seccion
                icono={CalendarOff}
                titulo="Días no laborables"
                descripcion="Feriados o cierres puntuales: esos días quedan cerrados enteros, sin turnos disponibles en la agenda ni en el buscador."
              >
                <SeccionDiasNoLaborables establecimientoId={establecimiento.id} />
              </Seccion>

              <Seccion icono={Sparkles} titulo="Servicios" descripcion="Lo que el jugador ve en la ficha del complejo: parrilla, duchas, estacionamiento.">
                <FormServicios
                  key={establecimiento.id}
                  servicios={establecimiento.servicios}
                  guardando={guardandoSeccion === "servicios"}
                  onGuardar={guardarServicios}
                />
                {guardado === "servicios" && <Guardado />}
              </Seccion>

              <Seccion icono={Images} titulo="Fotos" descripcion="Las que ve el jugador al entrar a la ficha del complejo. La primera es la que aparece en las búsquedas.">
                <FormFotos establecimientoId={establecimiento.id} />
              </Seccion>

              <Seccion icono={CalendarClock} titulo="Política de cancelación" descripcion="Hasta cuándo se puede cancelar sin perder la seña.">
                <SeccionPoliticaCancelacion establecimientoId={establecimiento.id} />
              </Seccion>

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
                  <TablaDispositivos
                    dispositivos={dispositivos}
                    idDispositivoActual={idDispositivoActual}
                    onRevocar={setDispositivoARevocar}
                  />
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={abrirPedidoNombreCajaNueva}
                    disabled={establecimientoId === null}
                    className="flex h-10 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="size-4" aria-hidden />
                    Generar link para nueva caja
                  </button>
                  {!emparejadoAqui && (
                    <button
                      type="button"
                      onClick={abrirConfirmarActivarCaja}
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

              <ZonaDeRiesgo key={establecimiento.id} establecimiento={establecimiento} />
            </div>
          )}
        </main>
      </div>

      {pidiendoNombreCajaNueva && (
        <ModalPanel titulo="Nueva caja" subtitulo="Poné un nombre para identificarla" onClose={cerrarPedidoNombreCajaNueva}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre-caja-nueva" className="mb-1 block text-xs font-semibold text-grafito">
                Nombre de la caja
              </label>
              <input
                id="nombre-caja-nueva"
                autoFocus
                autoComplete="off"
                value={nombreCajaNueva}
                onChange={(e) => setNombreCajaNueva(e.target.value)}
                className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
              {errorNombreCajaNueva ? (
                <p role="alert" className="mt-1.5 text-sm text-cancelado">
                  {errorNombreCajaNueva}
                </p>
              ) : (
                repetidoNombreCajaNueva && (
                  <p className="mt-1.5 text-sm text-grafito">Ya tenés una caja con este nombre. Podés seguir igual.</p>
                )
              )}
            </div>
            {generarCodigo.isError && (
              <p role="alert" className="text-sm text-cancelado">
                {generarCodigo.error instanceof ApiError ? mensajeVisible(generarCodigo.error) : "No pudimos generar el link."}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cerrarPedidoNombreCajaNueva}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => generarCodigo.mutate(nombreCajaNueva.trim())}
                disabled={establecimientoId === null || generarCodigo.isPending || errorNombreCajaNueva !== null}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generarCodigo.isPending ? "Generando..." : "Generar link"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {generarCodigo.data && (
        <ModalPanel
          titulo="Nueva caja"
          subtitulo="Escaneá o compartí este link desde la PC del mostrador"
          onClose={() => generarCodigo.reset()}
        >
          <GenerarLinkCaja codigo={generarCodigo.data.codigo} expiraEn={generarCodigo.data.expiraEn} />
        </ModalPanel>
      )}

      {dispositivoARevocar && (() => {
        const esEsta = esEstaComputadora(dispositivoARevocar, idDispositivoActual);
        return (
        <ModalPanel
          titulo={esEsta ? "Desvincular esta computadora" : "Revocar dispositivo"}
          subtitulo={dispositivoARevocar.label}
          onClose={() => setDispositivoARevocar(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              {esEsta ? (
                <>Esta computadora deja de funcionar como caja de inmediato. Para volver a usarla vas a tener que activarla de nuevo desde Configuración.</>
              ) : (
                <>
                  <span className="font-semibold">{dispositivoARevocar.label}</span> pierde el acceso de inmediato. En su próximo intento va a caer
                  a la pantalla de &ldquo;no emparejado&rdquo; — para volver a usarla hace falta un link nuevo.
                </>
              )}
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
                {esEsta
                  ? revocarDispositivo.isPending
                    ? "Desvinculando..."
                    : "Desvincular"
                  : revocarDispositivo.isPending
                    ? "Revocando..."
                    : "Revocar"}
              </button>
            </div>
          </div>
        </ModalPanel>
        );
      })()}

      {confirmandoActivarCaja && (
        <ModalPanel titulo="Activar como caja" onClose={cerrarConfirmarActivarCaja}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Al activar esta caja se cierra tu sesión en esta computadora. Para volver a entrar como dueño vas a tener que iniciar sesión de
              nuevo. Tus otras sesiones (teléfono, otra PC) no se tocan.
            </p>
            <p className="text-sm text-grafito">Esta PC va a quedar en la pantalla de nombres del kiosco, lista para que un empleado entre con su PIN.</p>
            <div>
              <label htmlFor="nombre-activar-local" className="mb-1 block text-xs font-semibold text-grafito">
                Nombre de la caja
              </label>
              <input
                id="nombre-activar-local"
                autoFocus
                autoComplete="off"
                value={nombreActivarLocal}
                onChange={(e) => setNombreActivarLocal(e.target.value)}
                className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
              {errorNombreActivarLocal ? (
                <p role="alert" className="mt-1.5 text-sm text-cancelado">
                  {errorNombreActivarLocal}
                </p>
              ) : (
                repetidoNombreActivarLocal && (
                  <p className="mt-1.5 text-sm text-grafito">Ya tenés una caja con este nombre. Podés seguir igual.</p>
                )
              )}
            </div>
            {activarLocal.isError && (
              <p role="alert" className="text-sm text-cancelado">
                {activarLocal.error instanceof ApiError ? mensajeVisible(activarLocal.error) : "No pudimos activar esta computadora."}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cerrarConfirmarActivarCaja}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => activarLocal.mutate(nombreActivarLocal.trim())}
                disabled={establecimientoId === null || activarLocal.isPending || errorNombreActivarLocal !== null}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-50"
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

/**
 * Deshabilitar, rehabilitar y eliminar el complejo. Separada del resto de
 * Configuración a propósito, con deshabilitar arriba y eliminar abajo: el
 * orden importa porque eliminar exige que ya esté deshabilitado.
 *
 * `key={establecimiento.id}` en el lugar donde se monta (más arriba en este
 * archivo) reinicia todo el estado local de acá -- confirmaciones abiertas,
 * el aviso de reservas tras deshabilitar -- al cambiar de complejo con el
 * selector, mismo patrón que usan Datos/Horarios/Servicios.
 */
function ZonaDeRiesgo({ establecimiento }: { establecimiento: EstablecimientoResponse }) {
  const [confirmandoDeshabilitar, setConfirmandoDeshabilitar] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [nombreTipeado, setNombreTipeado] = useState("");
  const [reservasTrasDeshabilitar, setReservasTrasDeshabilitar] = useState<number | null>(null);

  const cambiarEstado = useCambiarEstadoEstablecimiento();
  const eliminar = useEliminarEstablecimiento();

  const errorEstado =
    cambiarEstado.error instanceof ApiError
      ? mensajeVisible(cambiarEstado.error)
      : cambiarEstado.isError
        ? "No pudimos actualizar el estado."
        : null;
  const errorEliminar =
    eliminar.error instanceof ApiError ? mensajeVisible(eliminar.error) : eliminar.isError ? "No pudimos eliminar el complejo." : null;
  // Heurístico: el botón de eliminar ya queda disabled mientras el complejo
  // está habilitado, así que el único 400 que puede llegar acá de verdad es
  // el de reservas futuras. Si el texto del backend cambia, esto deja de
  // detectarlo y sólo se pierde el link directo a la agenda -- el mensaje
  // del backend se sigue mostrando igual.
  const errorPorReservasFuturas = eliminar.error instanceof ApiError && /reserva/i.test(eliminar.error.mensaje);

  function cerrarModalEliminar() {
    setConfirmandoEliminar(false);
    setNombreTipeado("");
    eliminar.reset();
  }

  return (
    <section id="zona-de-riesgo" className="rounded-card border-2 border-cancelado/25 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-cancelado" aria-hidden />
        <div>
          <h2 className="font-display text-lg font-bold text-cancelado">Zona de riesgo</h2>
          <p className="text-sm text-grafito">Dejá de aparecer en el buscador, o eliminá el complejo para siempre.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-input bg-humo p-4">
          <div className="min-w-0">
            <p className="font-semibold text-tinta">{establecimiento.isActive ? "Deshabilitar" : "Complejo deshabilitado"}</p>
            <p className="mt-0.5 text-sm text-grafito">
              {establecimiento.isActive
                ? "Dejás de aparecer en el buscador y de recibir reservas nuevas. Las reservas que ya tenés se respetan: las seguís administrando en la agenda. No libera cupo del límite de 3 complejos."
                : "No aparece en el buscador ni recibe reservas nuevas. Rehabilitalo cuando quieras, es inmediato."}
            </p>
            {reservasTrasDeshabilitar !== null && (
              <p className="mt-2 text-sm font-semibold text-tinta">
                {reservasTrasDeshabilitar > 0
                  ? `Quedan ${reservasTrasDeshabilitar} reserva(s) futura(s) confirmada(s) vigentes: son compromisos que ya asumiste, seguí cumpliéndolos desde la agenda.`
                  : "No te quedan reservas futuras confirmadas pendientes."}
              </p>
            )}
          </div>
          {establecimiento.isActive ? (
            <button
              type="button"
              onClick={() => setConfirmandoDeshabilitar(true)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-cancelado px-4 font-display text-sm font-bold text-cancelado transition-colors hover:bg-cancelado hover:text-white focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <Ban className="size-4" aria-hidden />
              Deshabilitar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => cambiarEstado.mutate({ estId: establecimiento.id, activo: true })}
              disabled={cambiarEstado.isPending}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
            >
              <RotateCcw className="size-4" aria-hidden />
              {cambiarEstado.isPending ? "Rehabilitando..." : "Rehabilitar"}
            </button>
          )}
        </div>

        {errorEstado && !confirmandoDeshabilitar && (
          <p role="alert" className="text-sm text-cancelado">
            {errorEstado}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-input bg-cancelado-suave/50 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-tinta">Eliminar complejo</p>
            <p className="mt-0.5 text-sm text-grafito">
              Definitivo: el complejo desaparece de tu panel y el slug queda libre para otro. Se conservan las reservas históricas y los registros
              asociados.
            </p>
            {establecimiento.isActive && <p className="mt-1.5 text-sm font-semibold text-cancelado">Primero tenés que deshabilitarlo.</p>}
          </div>
          <button
            type="button"
            onClick={() => setConfirmandoEliminar(true)}
            disabled={establecimiento.isActive}
            title={establecimiento.isActive ? "Deshabilitalo primero para poder eliminarlo" : undefined}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-cancelado px-4 font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar
          </button>
        </div>
      </div>

      {confirmandoDeshabilitar && (
        <ModalPanel titulo="Deshabilitar complejo" subtitulo={establecimiento.nombre} onClose={() => setConfirmandoDeshabilitar(false)}>
          <div className="space-y-4">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-tinta">
              <li>Dejás de aparecer en el buscador de jugadores.</li>
              <li>No podés recibir reservas nuevas.</li>
              <li>Las reservas que ya existen se respetan: las seguís viendo y administrando en la agenda.</li>
              <li>NO libera cupo del límite de 3 complejos — para eso hay que eliminarlo.</li>
            </ul>
            {errorEstado && (
              <p role="alert" className="text-sm text-cancelado">
                {errorEstado}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoDeshabilitar(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  cambiarEstado.mutate(
                    { estId: establecimiento.id, activo: false },
                    {
                      onSuccess: (respuesta) => {
                        setReservasTrasDeshabilitar(respuesta.reservasFuturasConfirmadas);
                        setConfirmandoDeshabilitar(false);
                      },
                    },
                  )
                }
                disabled={cambiarEstado.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                <Ban className="size-4" aria-hidden />
                {cambiarEstado.isPending ? "Deshabilitando..." : "Deshabilitar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}

      {confirmandoEliminar && (
        <ModalPanel titulo="Eliminar complejo" subtitulo="Esta acción no se puede deshacer" onClose={cerrarModalEliminar}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Vas a eliminar <span className="font-semibold">{establecimiento.nombre}</span> para siempre. Desaparece de tu panel y el slug queda
              libre para otro complejo. Se conservan las reservas históricas y los registros asociados.
            </p>
            <div>
              <label htmlFor="confirmar-nombre-eliminar" className="mb-1 block text-xs font-semibold text-grafito">
                Escribí <span className="font-semibold text-tinta">{establecimiento.nombre}</span> para confirmar
              </label>
              <input
                id="confirmar-nombre-eliminar"
                autoFocus
                autoComplete="off"
                value={nombreTipeado}
                onChange={(e) => setNombreTipeado(e.target.value)}
                className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
              />
            </div>
            {errorEliminar && (
              <div role="alert" className="space-y-1.5 text-sm text-cancelado">
                <p>{errorEliminar}</p>
                {errorPorReservasFuturas && (
                  <Link href="/panel/agenda" className="inline-flex items-center gap-1 font-semibold hover:underline">
                    Ir a la agenda
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cerrarModalEliminar}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminar.mutate(establecimiento.id)}
                disabled={nombreTipeado.trim() !== establecimiento.nombre || eliminar.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                <Trash2 className="size-4" aria-hidden />
                {eliminar.isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </section>
  );
}
