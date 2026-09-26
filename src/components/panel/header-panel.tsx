"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ShieldAlert, ShieldQuestion } from "lucide-react";

import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { SelectorEstablecimiento } from "@/components/panel/selector-establecimiento";
import { ModalCrearEstablecimiento } from "@/components/panel/modal-crear-establecimiento";
import { BannerVerificacionPendiente } from "@/components/panel/banner-verificacion-pendiente";

/**
 * Header del panel: nombre del complejo + cartel de estado, sólo cuando
 * corresponde (Parte 9, C2). Publicado y sin trial activo no muestra nada —
 * un cartel permanente que no dice nada nuevo es ruido.
 *
 * Las props son OPCIONALES: sin ellas lee el establecimiento y el perfil
 * reales. Con ellas usa lo que le pasen, que es como siguen funcionando las
 * pantallas del panel que todavía no se migraron.
 *
 * Hay DOS ejes de estado independientes, y se muestran los dos a la vez si
 * corresponde: `isActive` (publicado/despublicado) y `estadoVerificacion`
 * (PENDIENTE/EN_REVISION/VERIFICADO/RECHAZADO). No son lo mismo — un
 * complejo puede estar activo y sin verificar, o verificado y despublicado a
 * mano. El cartel de PENDIENTE es sólo la píldora acá: el aviso fuerte (no
 * descartable) es `BannerVerificacionPendiente`, montado más abajo.
 *
 * `diasRestantesTrial` tampoco se puede calcular: Usuario.fechaFinPrueba está
 * en la entidad pero no se expone en ningún DTO. Con datos reales el cartel de
 * prueba no aparece; lo que sí se sabe es el plan (PerfilResponse.planSuscripcion).
 */
export function HeaderPanel({
  nombre,
  diasRestantesTrial,
}: {
  nombre?: string;
  diasRestantesTrial?: number;
} = {}) {
  const { establecimiento } = useEstablecimientoActivo();
  const { data: perfil } = usePerfil();
  const [creandoComplejo, setCreandoComplejo] = useState(false);

  const esDuenoOAdmin = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";
  // La solicitud de verificación es OWNER puro en el backend (ni ADMIN):
  // dejar pasar a un ADMIN acá sería autoverificarse por la ventana de atrás.
  const esDueno = perfil?.rol === "OWNER";
  // Para OWNER/ADMIN el nombre ya lo muestra el selector de al lado: repetirlo
  // acá sería el mismo texto dos veces. Sigue mostrándose para EMPLOYEE (no
  // tiene selector) y para las pantallas viejas que mandan `nombre` a mano.
  const nombreVisible = nombre ?? (esDuenoOAdmin ? "" : establecimiento?.nombre) ?? "";
  const estadoVisible = establecimiento ? (establecimiento.isActive ? "publicado" : "despublicado") : undefined;
  const estadoVerificacion = establecimiento?.estadoVerificacion;
  const enPrueba = perfil?.planSuscripcion === "TRIAL";
  // Un complejo sin ningún horario de atención cargado no tiene ningún día
  // en el que "esté abierto": ComplejoPublicoService lo excluye de /buscar
  // apenas alguien pide fecha/hora (que es siempre, desde el front público),
  // aunque tenga canchas activas y esté publicado. Sin este aviso el dueño no
  // tiene forma de enterarse de que su complejo es invisible.
  const sinHorarios = esDuenoOAdmin && !!establecimiento && establecimiento.horariosAtencion.length === 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-borde bg-white px-8">
        <div className="flex min-w-0 items-center gap-4">
          <h1 className="truncate font-display text-base font-bold text-tinta">{nombreVisible}</h1>
          <SelectorEstablecimiento onCrear={() => setCreandoComplejo(true)} />
        </div>

        <div className="flex items-center gap-2">
          {sinHorarios && (
            <Link
              href="/panel/configuracion"
              className="inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente hover:underline"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              Sin horarios cargados · no aparecés en las búsquedas
            </Link>
          )}
          {estadoVisible === "despublicado" && esDueno && (
            <Link
              href="/panel/configuracion#zona-de-riesgo"
              className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado hover:underline"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              Complejo despublicado · rehabilitar
            </Link>
          )}
          {estadoVisible === "despublicado" && !esDueno && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              Complejo despublicado
            </span>
          )}
          {esDueno && estadoVerificacion === "PENDIENTE" && (
            <Link
              href="/panel/configuracion#verificacion"
              className="inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente hover:underline"
            >
              <ShieldQuestion className="size-3.5 shrink-0" aria-hidden />
              Sin verificar · completá tus datos
            </Link>
          )}
          {estadoVerificacion === "EN_REVISION" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              Verificación en revisión
            </span>
          )}
          {esDueno && estadoVerificacion === "RECHAZADO" && (
            <Link
              href="/panel/configuracion#verificacion"
              className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado hover:underline"
            >
              <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
              Verificación rechazada · corregir
            </Link>
          )}
          {estadoVisible === "publicado" && typeof diasRestantesTrial === "number" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              Prueba gratis · quedan {diasRestantesTrial} días
            </span>
          )}
          {estadoVisible === "publicado" && diasRestantesTrial === undefined && enPrueba && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-celeste-suave px-3 py-1.5 text-xs font-semibold text-tinta">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              Prueba gratuita
            </span>
          )}
        </div>
      </header>

      <BannerVerificacionPendiente />

      {creandoComplejo && <ModalCrearEstablecimiento onClose={() => setCreandoComplejo(false)} />}
    </>
  );
}
