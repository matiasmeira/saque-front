"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, Menu, ShieldAlert, ShieldQuestion } from "lucide-react";

import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { SelectorEstablecimiento } from "@/components/panel/selector-establecimiento";
import { ModalPanel } from "@/components/panel/modal-panel";
import { MENSAJE_LIMITE_ESTABLECIMIENTOS, rutaCrearComplejo } from "@/lib/panel/nuevo-complejo";
import { BannerVerificacionPendiente } from "@/components/panel/banner-verificacion-pendiente";
import { hayBannerVerificacion } from "@/lib/panel/banner-verificacion";
import { ID_BOTON_ABRIR_MENU, ID_MENU_LATERAL, useMenuMovil } from "@/components/panel/menu-movil-panel";

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
  const router = useRouter();
  const { establecimiento, misEstablecimientos } = useEstablecimientoActivo();
  const { data: perfil } = usePerfil();
  const [avisoLimite, setAvisoLimite] = useState(false);
  const menu = useMenuMovil();

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
  // "+ Agregar complejo" abre el wizard (con 3 complejos, sólo avisa).
  function crearComplejo() {
    const ruta = rutaCrearComplejo(misEstablecimientos.length);
    if (ruta === null) setAvisoLimite(true);
    else router.push(ruta);
  }

  // En celular el banner ya dice lo mismo, a lo ancho: la píldora sobraría.
  const ocultarPildoraSinVerificar = hayBannerVerificacion(perfil?.rol, estadoVerificacion);
  const sinHorarios = esDuenoOAdmin && !!establecimiento && establecimiento.horariosAtencion.length === 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-borde bg-white px-4 sm:px-6 max-lg:h-auto max-lg:min-h-16 max-lg:flex-wrap max-lg:gap-y-2 max-lg:py-2 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 max-lg:w-full">
          {menu && (
            <button
              id={ID_BOTON_ABRIR_MENU}
              type="button"
              onClick={menu.abrir}
              aria-label="Abrir menú"
              aria-expanded={menu.abierto}
              aria-controls={ID_MENU_LATERAL}
              className="-ml-2 flex size-10 max-md:size-11 shrink-0 items-center justify-center rounded-full text-tinta transition-colors hover:bg-humo lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          )}
          <h1 className="truncate font-display text-base font-bold text-tinta">{nombreVisible}</h1>
          <div className="min-w-0 max-lg:flex-1">
            <SelectorEstablecimiento onCrear={crearComplejo} />
          </div>
        </div>

        <div className="flex items-center gap-2 max-lg:w-full max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:empty:hidden max-lg:[&>*]:shrink-0 max-lg:[&>*]:whitespace-nowrap">
          {sinHorarios && (
            <Link
              href="/panel/configuracion"
              className="inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente hover:underline"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              <span>Sin horarios cargados<span className="max-lg:hidden"> · no aparecés en las búsquedas</span></span>
            </Link>
          )}
          {estadoVisible === "despublicado" && esDueno && (
            <Link
              href="/panel/configuracion#zona-de-riesgo"
              className="inline-flex items-center gap-1.5 rounded-full bg-cancelado-suave px-3 py-1.5 text-xs font-semibold text-cancelado hover:underline"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              <span>Complejo despublicado<span className="max-lg:hidden"> · rehabilitar</span></span>
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
              className={`inline-flex items-center gap-1.5 rounded-full bg-pendiente-suave px-3 py-1.5 text-xs font-semibold text-pendiente hover:underline ${
                ocultarPildoraSinVerificar ? "max-lg:hidden" : ""
              }`}
            >
              <ShieldQuestion className="size-3.5 shrink-0" aria-hidden />
              <span>Sin verificar<span className="max-lg:hidden"> · completá tus datos</span></span>
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
              <span>Verificación rechazada<span className="max-lg:hidden"> · corregir</span></span>
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

      {avisoLimite && (
        <ModalPanel titulo="Nuevo complejo" onClose={() => setAvisoLimite(false)}>
          <div className="flex flex-col items-center gap-3 rounded-input bg-humo p-5 text-center">
            <AlertTriangle className="size-6 text-cancelado" aria-hidden />
            <p className="text-sm font-semibold text-tinta">{MENSAJE_LIMITE_ESTABLECIMIENTOS}</p>
            <p className="text-xs text-grafito">
              Para crear uno nuevo, eliminá alguno existente — deshabilitarlo no libera cupo. Se elimina desde la Zona
              de riesgo, en Configuración de ese complejo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAvisoLimite(false)}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            Entendido
          </button>
        </ModalPanel>
      )}
    </>
  );
}
