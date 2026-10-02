"use client";

import Link from "next/link";
import { ShieldQuestion } from "lucide-react";

import { usePerfil, useEstablecimientoActivo } from "@/hooks/api/use-perfil";
import { hayBannerVerificacion } from "@/lib/panel/banner-verificacion";

/**
 * Banner ancho, NO descartable, debajo del `<header>` en todas las pantallas
 * del panel. Único estado con banner (los otros tres son informativos: el
 * dueño ya sabe que el trámite existe): PENDIENTE es el único donde el
 * silencio tiene consecuencias irreversibles — un dueño que no manda la
 * solicitud queda invisible para siempre, sin reservas y sin saber por qué.
 *
 * Se monta desde `HeaderPanel` (no desde `app/panel/layout.tsx`, que no
 * tiene chrome compartido) para que aparezca en todas las pantallas sin que
 * cada una se acuerde de montarlo, igual que la píldora de arriba — y sin
 * sumar altura por encima del `h-dvh` que arma cada pantalla (eso desbordaría
 * el shell: ver el comentario de layout.tsx).
 *
 * Sólo para OWNER: `solicitar-verificacion` es `hasRole('OWNER')` puro en el
 * backend (ni ADMIN), así que mostrarle esto a un ADMIN sería mandarlo a un
 * botón que le va a tirar 403.
 */
export function BannerVerificacionPendiente() {
  const { data: perfil } = usePerfil();
  const { establecimiento } = useEstablecimientoActivo();

  if (!hayBannerVerificacion(perfil?.rol, establecimiento?.estadoVerificacion)) return null;

  return (
    <div className="flex flex-col items-start gap-2 border-b border-pendiente/30 bg-pendiente-suave px-4 py-3 sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-tinta max-lg:text-xs sm:items-center">
        <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-pendiente sm:mt-0" aria-hidden />
        <span>
          <span className="font-semibold">Tu complejo todavía no aparece en el buscador ni puede recibir reservas.</span>{" "}
          Falta enviar la solicitud de verificación
          <span className="max-lg:hidden">
            {" "}
            — el mes de prueba gratis arranca recién cuando se aprueba, así que no perdés días esperando
          </span>
          .
        </span>
      </p>
      <Link
        href="/panel/configuracion#verificacion"
        className="shrink-0 rounded-full bg-pendiente px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-pendiente/90"
      >
        Solicitar verificación
      </Link>
    </div>
  );
}
