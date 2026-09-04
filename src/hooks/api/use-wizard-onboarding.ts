"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { canchas as endpointCanchas, bloqueos as endpointBloqueos } from "@/lib/api/endpoints/canchas";
import { mercadopago as endpointMercadoPago } from "@/lib/api/endpoints/mercadopago";
import { aBloqueoPanel, aCanchaPanel, aCanchaRequest, aFechaHoraBloqueo, type DatosCancha } from "@/lib/api/adaptadores/canchas";
import { aTarifasDto, aTarifasPanel } from "@/lib/api/tarifas";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { guardarEstablecimientoSeleccionado } from "@/lib/establecimiento-seleccionado";
import { usePerfil } from "@/hooks/api/use-perfil";
import type { DatosPasoIdentidad, DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";
import type { BloqueoCanchaResponse, CanchaResponse } from "@/lib/api/tipos/canchas";
import type { EstadoMercadoPagoResponse } from "@/lib/api/tipos/mercadopago";
import type { Bloqueo } from "@/lib/panel/canchas";
import type { DiaSemana, Tarifa } from "@/lib/panel/tarifas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";
import type { PrecioPorDuracion } from "@/lib/panel/canchas";

type DatosTarifaForm = { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] };
type PasoActual = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Estado y orquestación del wizard de onboarding completo (6 pasos). El
 * establecimiento se crea al confirmar el paso 2 (Fase 1) y de ahí en
 * adelante `establecimientoParcial` es la fuente de verdad: horarios lo
 * actualiza con un PUT completo, canchas/tarifas son sub-recursos aparte.
 * "Publicar complejo" (paso 6) no dispara ningún request — todo ya se guardó
 * en cuanto se confirmó cada paso (ver Ruling 6 del plan de Fase 2).
 */
export function useWizardOnboarding() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();

  const [pasoActual, setPasoActual] = useState<PasoActual>(1);
  const [datosIdentidad, setDatosIdentidad] = useState<DatosPasoIdentidad | null>(null);
  const [montoSenaDefault, setMontoSenaDefault] = useState(0);
  const [establecimientoParcial, setEstablecimientoParcial] = useState<EstablecimientoResponse | null>(null);
  const [erroresFotos, setErroresFotos] = useState<string[]>([]);
  const establecimientoRef = useRef<EstablecimientoResponse | null>(null);

  // ---------------------------------------------------------------------
  // Paso 1 — Identidad
  // ---------------------------------------------------------------------

  function confirmarIdentidad(datos: DatosPasoIdentidad) {
    setDatosIdentidad(datos);
    setPasoActual(2);
  }

  function volverAIdentidad() {
    setPasoActual(1);
  }

  // ---------------------------------------------------------------------
  // Paso 2 — Políticas (crea el establecimiento)
  // ---------------------------------------------------------------------

  const crear = useMutation<EstablecimientoResponse, ApiError, DatosPasoPoliticas>({
    mutationFn: async (politicas) => {
      if (!datosIdentidad) {
        throw new ApiError({ status: 0, mensaje: "Falta completar el paso 1." });
      }

      let establecimiento = establecimientoRef.current;
      if (!establecimiento) {
        establecimiento = await endpointEstablecimientos.crear({
          nombre: datosIdentidad.nombre,
          direccion: datosIdentidad.direccion,
          latitud: datosIdentidad.latitud,
          longitud: datosIdentidad.longitud,
          requiereSena: politicas.requiereSena,
          requiereTelefonoVerificado: politicas.requiereTelefonoVerificado,
          horariosAtencion: [],
          servicios: datosIdentidad.servicios,
        });
        establecimientoRef.current = establecimiento;
        setEstablecimientoParcial(establecimiento);
        // Refleja el alta en la cache al instante: invalidateQueries no
        // refetchea queries sin observadores activos (TanStack Query v5,
        // refetchType "active" por defecto), y nada en /panel/bienvenida
        // observa esta query. Sin esto, "Ir al panel" — o un reintento
        // tras un fallo parcial — vuelve a leer [] cacheado en
        // /panel/agenda y rebota de nuevo al wizard, arriesgando un
        // establecimiento duplicado. Mismo patrón que
        // ModalCrearEstablecimiento (modal-crear-establecimiento.tsx).
        const nuevo = establecimiento;
        queryClient.setQueryData<EstablecimientoResponse[]>(
          keys.establecimientos.mios(),
          (previos) => [...(previos ?? []), nuevo],
        );
        guardarEstablecimientoSeleccionado(establecimiento.id);
      }

      const fotosFallidas: string[] = [];
      for (const archivo of datosIdentidad.fotos) {
        try {
          await endpointEstablecimientos.subirFoto(establecimiento.id, archivo);
        } catch {
          fotosFallidas.push(archivo.name);
        }
      }
      setErroresFotos(fotosFallidas);

      await endpointEstablecimientos.actualizarPoliticaCancelacion(establecimiento.id, {
        horasCancelacionAntesPartido: politicas.horasCancelacionAntesPartido,
        minutosGraciaCancelacion: politicas.minutosGraciaCancelacion,
      });

      return establecimiento;
    },
    onSuccess: (establecimiento) => {
      setEstablecimientoParcial(establecimiento);
      setPasoActual(3);
    },
  });

  function confirmarPoliticas(politicas: DatosPasoPoliticas) {
    setMontoSenaDefault(politicas.montoSenaDefault);
    crear.mutate(politicas);
  }

  // ---------------------------------------------------------------------
  // Paso 3 — Horarios
  // ---------------------------------------------------------------------

  const guardarHorarios = useMutation<EstablecimientoResponse, ApiError, HorarioAtencionDto[]>({
    mutationFn: (horarios) => {
      const actual = establecimientoParcial!;
      return endpointEstablecimientos.actualizar(actual.id, {
        nombre: actual.nombre,
        direccion: actual.direccion,
        latitud: actual.latitud,
        longitud: actual.longitud,
        requiereSena: actual.requiereSena,
        requiereTelefonoVerificado: actual.requiereTelefonoVerificado,
        // Va SIEMPRE: omitirlo borra los horarios (ver Global Constraints del plan).
        horariosAtencion: horarios,
        // `servicios` se omite a propósito: ausente = no modificar.
      });
    },
    onSuccess: (actualizado) => {
      setEstablecimientoParcial(actualizado);
      setPasoActual(4);
    },
  });

  function confirmarHorarios(horarios: HorarioAtencionDto[]) {
    guardarHorarios.mutate(horarios);
  }

  // ---------------------------------------------------------------------
  // Paso 4 — Canchas
  // ---------------------------------------------------------------------

  const [canchas, setCanchas] = useState<CanchaResponse[]>([]);
  const [errorCanchas, setErrorCanchas] = useState<string | null>(null);
  const [desactivandoCanchaId, setDesactivandoCanchaId] = useState<number | null>(null);
  const [canchaEnEdicionId, setCanchaEnEdicionId] = useState<number | null>(null);
  // Cruda, no adaptada: quitarBloqueo necesita el `id` real que el backend
  // asigna, y `Bloqueo` (la forma del panel) no lo trae — se adapta recién
  // en el objeto de retorno, para el prop que consume PasoCanchas.
  const [bloqueosCrudosDeCanchaEnEdicion, setBloqueosCrudosDeCanchaEnEdicion] = useState<BloqueoCanchaResponse[]>([]);

  function refrescarBloqueos(canchaId: number) {
    endpointBloqueos
      .deCancha(establecimientoParcial!.id, canchaId)
      .then(setBloqueosCrudosDeCanchaEnEdicion)
      .catch(() => setBloqueosCrudosDeCanchaEnEdicion([]));
  }

  function abrirEdicionCancha(canchaId: number) {
    setCanchaEnEdicionId(canchaId);
    refrescarBloqueos(canchaId);
  }

  const guardarCancha = useMutation<CanchaResponse, ApiError, { id: number | null; datos: DatosCancha }>({
    mutationFn: ({ id, datos }) => {
      const estId = establecimientoParcial!.id;
      return id === null
        ? endpointCanchas.crear(estId, aCanchaRequest(datos))
        : endpointCanchas.actualizar(estId, id, aCanchaRequest(datos));
    },
    onSuccess: (cancha, { id }) => {
      setCanchas((prev) => (id === null ? [...prev, cancha] : prev.map((c) => (c.id === cancha.id ? cancha : c))));
      setErrorCanchas(null);
    },
    onError: (e) => setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar la cancha."),
  });

  const desactivarCanchaMut = useMutation<void, ApiError, number>({
    mutationFn: (canchaId) => {
      setDesactivandoCanchaId(canchaId);
      return endpointCanchas.desactivar(establecimientoParcial!.id, canchaId);
    },
    onSuccess: (_vacio, canchaId) => {
      setCanchas((prev) => prev.filter((c) => c.id !== canchaId));
      setDesactivandoCanchaId(null);
      setErrorCanchas(null);
    },
    onError: (e) => {
      setDesactivandoCanchaId(null);
      setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos desactivar la cancha.");
    },
  });

  const agregarBloqueoMut = useMutation({
    mutationFn: ({ canchaId, bloqueo }: { canchaId: number; bloqueo: Bloqueo }) =>
      endpointBloqueos.crear(establecimientoParcial!.id, canchaId, {
        fechaInicio: aFechaHoraBloqueo(bloqueo.desde),
        fechaFin: aFechaHoraBloqueo(bloqueo.hasta),
        motivo: bloqueo.motivo?.trim() || "Mantenimiento",
      }),
    onSuccess: (_nuevo, { canchaId }) => refrescarBloqueos(canchaId),
    onError: (e) => setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar el bloqueo."),
  });

  const quitarBloqueoMut = useMutation({
    mutationFn: ({ canchaId, bloqueoId }: { canchaId: number; bloqueoId: number }) =>
      endpointBloqueos.eliminar(establecimientoParcial!.id, canchaId, bloqueoId),
    onSuccess: (_vacio, { canchaId }) => refrescarBloqueos(canchaId),
    onError: (e) => setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos quitar el bloqueo."),
  });

  function agregarBloqueo(bloqueo: Bloqueo) {
    if (canchaEnEdicionId === null) return;
    agregarBloqueoMut.mutate({ canchaId: canchaEnEdicionId, bloqueo });
  }

  function quitarBloqueo(indice: number) {
    if (canchaEnEdicionId === null) return;
    // El formulario trabaja por índice; se resuelve contra la lista CRUDA
    // (no la adaptada) porque es la única que trae el `id` que pide el DELETE.
    const bloqueo = bloqueosCrudosDeCanchaEnEdicion[indice];
    if (bloqueo) quitarBloqueoMut.mutate({ canchaId: canchaEnEdicionId, bloqueoId: bloqueo.id });
  }

  function volverAHorarios() {
    setPasoActual(3);
  }

  function confirmarCanchas() {
    setPasoActual(5);
  }

  // ---------------------------------------------------------------------
  // Paso 5 — Tarifas
  // ---------------------------------------------------------------------

  const [errorTarifas, setErrorTarifas] = useState<string | null>(null);

  function tarifasDeCanchaId(canchaId: number): Tarifa[] {
    const cancha = canchas.find((c) => c.id === canchaId);
    return cancha ? aTarifasPanel(cancha.tarifas, cancha.id) : [];
  }

  const guardarTarifas = useMutation<
    CanchaResponse,
    ApiError,
    { canchaId: number; preciosBase?: PrecioPorDuracion[]; tarifas: Tarifa[] }
  >({
    mutationFn: ({ canchaId, preciosBase, tarifas }) => {
      const canchaCruda = canchas.find((c) => c.id === canchaId)!;
      const canchaPanel = aCanchaPanel(canchaCruda);
      return endpointCanchas.actualizar(establecimientoParcial!.id, canchaId, {
        ...aCanchaRequest({ ...canchaPanel, preciosBase: preciosBase ?? canchaPanel.preciosBase }),
        tarifas: aTarifasDto(tarifas),
      });
    },
    onSuccess: (actualizada) => {
      setCanchas((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      setErrorTarifas(null);
    },
    onError: (e) => setErrorTarifas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar los precios."),
  });

  function crearTarifa(canchaId: number, datos: DatosTarifaForm) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: [...actuales, { ...datos, id: actuales.length, canchaId }] });
  }

  function editarTarifa(canchaId: number, tarifaId: number, datos: DatosTarifaForm) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: actuales.map((t) => (t.id === tarifaId ? { ...t, ...datos } : t)) });
  }

  function quitarTarifa(canchaId: number, tarifa: Tarifa) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: actuales.filter((t) => t.id !== tarifa.id) });
  }

  function volverACanchas() {
    setPasoActual(4);
  }

  function confirmarTarifas() {
    setPasoActual(6);
  }

  // ---------------------------------------------------------------------
  // Paso 6 — Cobros (MercadoPago)
  // ---------------------------------------------------------------------

  const [estadoMercadoPago, setEstadoMercadoPago] = useState<EstadoMercadoPagoResponse | null>(null);
  const [cargandoEstadoMercadoPago, setCargandoEstadoMercadoPago] = useState(false);
  const [conectandoMercadoPago, setConectandoMercadoPago] = useState(false);
  const [errorMercadoPago, setErrorMercadoPago] = useState<string | null>(null);
  const [publicado, setPublicado] = useState(false);

  function consultarEstadoMercadoPago() {
    if (!establecimientoParcial) return;
    setCargandoEstadoMercadoPago(true);
    endpointMercadoPago
      .obtenerEstado(establecimientoParcial.id)
      .then(setEstadoMercadoPago)
      .catch(() => setEstadoMercadoPago({ conectado: false, cuenta: null }))
      .finally(() => setCargandoEstadoMercadoPago(false));
  }

  // Vuelve a chequear el estado al entrar al paso 6 y cada vez que la
  // pestaña recupera el foco — es como se entera de una conexión hecha en
  // la pestaña de Mercado Pago que abrió el redirect (ver comentario en
  // src/lib/api/endpoints/mercadopago.ts: el front nunca parsea el "code").
  useEffect(() => {
    if (pasoActual !== 6 || !establecimientoParcial) return;
    consultarEstadoMercadoPago();
    function alVolverElFoco() {
      if (document.visibilityState === "visible") consultarEstadoMercadoPago();
    }
    document.addEventListener("visibilitychange", alVolverElFoco);
    return () => document.removeEventListener("visibilitychange", alVolverElFoco);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual, establecimientoParcial?.id]);

  function iniciarConexionMercadoPago() {
    if (!establecimientoParcial) return;
    setConectandoMercadoPago(true);
    setErrorMercadoPago(null);
    endpointMercadoPago
      .iniciarOAuth(establecimientoParcial.id)
      .then(({ urlAutorizacion }) => {
        window.location.href = urlAutorizacion;
      })
      .catch(() => {
        setConectandoMercadoPago(false);
        // No usamos mensajeVisible(e) acá a propósito: este endpoint es una
        // convención sin backend real todavía (ver comentario más arriba),
        // así que su forma de error es desconocida y no debe mostrarse cruda
        // (p. ej. el "Not Found" en inglés que devuelve Spring en un 404).
        setErrorMercadoPago("No pudimos conectar con Mercado Pago. Intentá de nuevo más tarde.");
      });
  }

  function volverATarifas() {
    setPasoActual(5);
  }

  function publicarComplejo() {
    setPublicado(true);
  }

  // ---------------------------------------------------------------------

  const errorCreacion = crear.isError ? crear.error : null;
  const errorHorarios = guardarHorarios.isError
    ? guardarHorarios.error instanceof ApiError
      ? mensajeVisible(guardarHorarios.error)
      : "No pudimos guardar los horarios."
    : null;

  return {
    pasoActual,
    plan: perfil?.planSuscripcion,

    // Paso 1
    datosIdentidad,
    confirmarIdentidad,

    // Paso 2
    establecimientoParcial,
    creando: crear.isPending,
    errorCreacion,
    erroresFotos,
    volverAIdentidad,
    confirmarPoliticas,

    // Paso 3
    guardandoHorarios: guardarHorarios.isPending,
    errorHorarios,
    confirmarHorarios,

    // Paso 4
    canchas,
    canchasPanel: canchas.map(aCanchaPanel),
    montoSenaDefault,
    bloqueosDeCanchaEnEdicion: bloqueosCrudosDeCanchaEnEdicion.map(aBloqueoPanel),
    guardandoCancha: guardarCancha.isPending,
    desactivandoCanchaId,
    errorCanchas,
    abrirEdicionCancha,
    crearCancha: (datos: DatosCancha) => guardarCancha.mutate({ id: null, datos }),
    actualizarCancha: (id: number, datos: DatosCancha) => guardarCancha.mutate({ id, datos }),
    desactivarCancha: (id: number) => desactivarCanchaMut.mutate(id),
    agregarBloqueo,
    quitarBloqueo,
    volverAHorarios,
    confirmarCanchas,

    // Paso 5
    tarifasPorCancha: Object.fromEntries(canchas.map((c) => [c.id, aTarifasPanel(c.tarifas, c.id)])),
    guardandoTarifas: guardarTarifas.isPending,
    errorTarifas,
    crearTarifa,
    editarTarifa,
    quitarTarifa,
    volverACanchas,
    confirmarTarifas,

    // Paso 6
    estadoMercadoPago,
    cargandoEstadoMercadoPago,
    conectandoMercadoPago,
    errorMercadoPago,
    iniciarConexionMercadoPago,
    volverATarifas,
    publicarComplejo,

    // Pantalla de éxito
    publicado,
  };
}
