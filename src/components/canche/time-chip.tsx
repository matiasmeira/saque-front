"use client";

import Link from "next/link";

/**
 * Chip de horario disponible.
 *
 * Este NO es un elemento decorativo: es el CTA principal del
 * marketplace. El jugador toca la hora y entra directo al checkout
 * con el turno preseleccionado. Por eso es un control real (link o
 * botón), con estado de foco y tamanio comodo para el dedo (44px de
 * alto es el minimo recomendado para tocar en mobile).
 *
 * Dos modos: "href" navega directo (así lo usan las tarjetas de
 * resultado — VenueCard queda como Server Component, sin necesitar
 * "use client" solo por esto) y "onClick" para uso local, como en
 * la guía de estilo.
 */

type TimeChipProps = {
  hora: string;
  seleccionado?: boolean;
  disponible?: boolean;
  href?: string;
  onClick?: () => void;
};

export function TimeChip({ hora, seleccionado = false, disponible = true, href, onClick }: TimeChipProps) {
  const base =
    "inline-flex h-11 min-w-[74px] items-center justify-center rounded-input px-3 text-sm font-semibold transition-colors";

  const estilo = !disponible
    ? "bg-ocupado-suave text-ocupado line-through cursor-not-allowed"
    : seleccionado
      ? "bg-azul text-white"
      : "bg-white text-tinta border border-borde hover:border-azul hover:text-azul";

  if (!disponible) {
    return (
      <span className={`${base} ${estilo}`} aria-disabled="true">
        {hora}
      </span>
    );
  }

  if (href) {
    return (
      <Link href={href} aria-pressed={seleccionado} className={`${base} ${estilo}`}>
        {hora}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={seleccionado} className={`${base} ${estilo}`}>
      {hora}
    </button>
  );
}
