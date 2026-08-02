"use client";

import { useState } from "react";
import { Logo, Isotipo } from "@/components/saque/logo";
import { StatusBadge } from "@/components/saque/status-badge";
import { TimeChip } from "@/components/saque/time-chip";
import { HeaderPublico } from "@/components/saque/header-publico";
import { Buscador } from "@/components/saque/buscador";
import { FooterPublico } from "@/components/saque/footer-publico";
import { LineasDeCancha } from "@/components/saque/lineas-de-cancha";
import { VenueCard } from "@/components/saque/venue-card";
import { VenueCardSkeleton } from "@/components/saque/venue-card-skeleton";
import { EmptyState } from "@/components/saque/empty-state";
import { FiltrosResultados } from "@/components/saque/filtros-resultados";
import { GaleriaFotos } from "@/components/saque/galeria-fotos";
import { GrillaDisponibilidad } from "@/components/saque/grilla-disponibilidad";
import { ReservaBlock } from "@/components/saque/reserva-block";
import { CountdownBadge } from "@/components/saque/countdown-badge";
import { COMPLEJOS } from "@/mocks/complejos";

/**
 * Guia de estilo viva — /estilo
 *
 * No es parte del producto, es una herramienta interna. Cada vez
 * que agreguemos un componente lo sumamos aca. Sirve para ver todo
 * junto y detectar inconsistencias antes de que se propaguen.
 */

const COLORES = [
  { nombre: "Tinta", clase: "bg-tinta", hex: "#0A1F3D", uso: "Texto, sidebar" },
  { nombre: "Azul", clase: "bg-azul", hex: "#0E56C9", uso: "Botones, links" },
  { nombre: "Celeste", clase: "bg-celeste", hex: "#5CC5F2", uso: "Acentos" },
  { nombre: "Grafito", clase: "bg-grafito", hex: "#46586E", uso: "Secundario" },
  { nombre: "Humo", clase: "bg-humo", hex: "#F6F9FC", uso: "Fondo" },
  { nombre: "Borde", clase: "bg-borde", hex: "#E2E8F0", uso: "Bordes 1px" },
];

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="mb-4 border-b border-borde pb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-grafito">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function GuiaDeEstilo() {
  const [horaElegida, setHoraElegida] = useState<string | null>("20:30");
  const [deadlineDemo] = useState(() => Date.now() + 9 * 60 * 1000 + 47 * 1000);
  const [deadlineVencidoDemo] = useState(() => Date.now() - 1000);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14 pb-28">
      <Logo className="h-11 w-auto" />
      <p className="mt-3 text-grafito">
        Guía de estilo. Todo lo que construyamos sale de acá.
      </p>

      {/* ---------- COLORES ---------- */}
      <Seccion titulo="Paleta">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {COLORES.map((c) => (
            <div
              key={c.nombre}
              className="overflow-hidden rounded-card border border-borde bg-white"
            >
              <div className={`h-20 ${c.clase}`} />
              <div className="p-3">
                <p className="text-sm font-semibold">{c.nombre}</p>
                <p className="text-xs text-grafito">
                  {c.hex} · {c.uso}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ---------- TIPOGRAFIA ---------- */}
      <Seccion titulo="Tipografía">
        <div className="rounded-card border border-borde bg-white p-8">
          <h1 className="text-5xl leading-[1.05]">
            Reservá tu cancha
            <br />
            en 30 segundos
          </h1>
          <p className="mt-2 text-xs text-grafito">Archivo 800 · titulares</p>

          <hr className="my-7 border-borde" />

          <p className="max-w-lg text-[17px] leading-relaxed text-grafito">
            Elegí el complejo, el día y el horario. Pagás la seña online y el
            turno queda confirmado al instante.
          </p>
          <p className="mt-2 text-xs text-grafito">Public Sans · cuerpo</p>

          <hr className="my-7 border-borde" />

          <p className="font-display text-2xl font-semibold">
            19:00 · 20:30 · 22:00 &nbsp;&nbsp; $18.500
          </p>
          <p className="mt-2 text-xs text-grafito">
            Números tabulares — se alinean en columna
          </p>
        </div>
      </Seccion>

      {/* ---------- BOTONES ---------- */}
      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-borde bg-white p-8">
          <button className="rounded-full bg-azul px-7 py-3.5 font-display text-[15px] font-bold text-white transition-colors hover:bg-azul-oscuro">
            Reservar turno
          </button>
          <button className="rounded-full border border-borde bg-white px-7 py-3.5 font-display text-[15px] font-bold text-azul transition-colors hover:border-azul">
            Ver disponibilidad
          </button>
          <button
            disabled
            className="cursor-not-allowed rounded-full bg-ocupado-suave px-7 py-3.5 font-display text-[15px] font-bold text-ocupado"
          >
            Sin lugar
          </button>
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Píldora completa en el CTA principal: es el único gesto deportivo de
          la interfaz.
        </p>
      </Seccion>

      {/* ---------- ESTADOS ---------- */}
      <Seccion titulo="Estados de reserva">
        <div className="flex flex-wrap gap-2.5 rounded-card border border-borde bg-white p-8">
          <StatusBadge estado="disponible" />
          <StatusBadge estado="ocupado" />
          <StatusBadge estado="pendiente" />
          <StatusBadge estado="cancelado" />
        </div>
      </Seccion>

      {/* ---------- CHIPS DE HORARIO ---------- */}
      <Seccion titulo="Chips de horario">
        <div className="rounded-card border border-borde bg-white p-8">
          <div className="flex flex-wrap gap-2.5">
            {["19:00", "20:30", "22:00"].map((h) => (
              <TimeChip
                key={h}
                hora={h}
                seleccionado={horaElegida === h}
                onClick={() => setHoraElegida(h)}
              />
            ))}
            <TimeChip hora="23:30" disponible={false} />
          </div>
          <p className="mt-4 text-xs text-grafito">
            Elegido: {horaElegida ?? "ninguno"} — probá tocando otro.
          </p>
        </div>
      </Seccion>

      {/* ---------- TARJETA DE COMPLEJO ---------- */}
      <Seccion titulo="Tarjeta de resultado">
        <article className="max-w-sm overflow-hidden rounded-card border border-borde bg-white">
          <div className="flex h-40 items-center justify-center bg-tinta">
            <span className="text-xs tracking-widest text-celeste">
              FOTO DEL COMPLEJO
            </span>
          </div>
          <div className="p-5">
            <h3 className="text-lg">Complejo Los Pinos</h3>
            <p className="mt-0.5 text-sm text-grafito">
              1,2 km · Av. Croacia 2140
            </p>

            <div className="mt-3 flex gap-1.5">
              {["Fútbol 5", "Fútbol 7", "Pádel"].map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-celeste-suave px-2.5 py-1 text-xs font-medium text-tinta"
                >
                  {d}
                </span>
              ))}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-grafito">
              Hoy a la noche
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <TimeChip hora="19:00" />
              <TimeChip hora="20:30" />
              <TimeChip hora="22:00" />
            </div>

            <p className="mt-5 border-t border-borde pt-4 text-sm">
              Desde <strong>$18.500</strong>
              <span className="text-grafito"> · seña $5.000</span>
            </p>
          </div>
        </article>
      </Seccion>

      {/* ---------- HEADER PUBLICO ---------- */}
      <Seccion titulo="Header público">
        <div className="overflow-hidden rounded-card border border-borde">
          <div className="bg-tinta">
            <HeaderPublico variant="oscuro" />
          </div>
          <div className="border-t border-borde bg-white">
            <HeaderPublico variant="claro" />
          </div>
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Variante oscura para el hero de A1, clara para el resto de zona A y B.
        </p>
      </Seccion>

      {/* ---------- BUSCADOR ---------- */}
      <Seccion titulo="Buscador (A1)">
        <div className="overflow-hidden rounded-card bg-tinta pt-20">
          <Buscador />
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Arranca en &quot;Cerca mío&quot;, sin pedir geolocalización. El botón navega a
          /buscar con los filtros como query params.
        </p>
      </Seccion>

      {/* ---------- FILTROS DE RESULTADOS (A2) ---------- */}
      <Seccion titulo="Filtros de resultados (A2)">
        <FiltrosResultados deporte="futbol-5" zona="jose-c-paz" fecha="2026-07-25" franja="noche" />
        <p className="mt-2.5 text-xs text-grafito">
          Cada campo renavega /buscar con los params actualizados. &quot;Más filtros&quot; abre la
          hoja inferior — tocá el botón para probarla.
        </p>
      </Seccion>

      {/* ---------- TARJETAS DE RESULTADO (A2) ---------- */}
      <Seccion titulo="VenueCard (A2)">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <VenueCard complejo={COMPLEJOS[0]} momentoLabel="Hoy a la noche" fecha="2026-07-25" />
          <VenueCard
            complejo={COMPLEJOS.find((c) => c.id === "club-pinares")!}
            momentoLabel="Hoy a la noche"
            fecha="2026-07-25"
          />
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Los horarios son el CTA: navegan directo al checkout. La segunda tarjeta es el caso
          &quot;sin disponibilidad&quot; — no se oculta, se apaga.
        </p>
      </Seccion>

      {/* ---------- SKELETON ---------- */}
      <Seccion titulo="VenueCardSkeleton">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <VenueCardSkeleton />
          <VenueCardSkeleton />
        </div>
      </Seccion>

      {/* ---------- ESTADO VACIO ---------- */}
      <Seccion titulo="EmptyState">
        <EmptyState
          titulo="No hay tenis en José C. Paz para hoy."
          descripcion="Pero seguro hay lugar si corrés alguno de estos tres criterios:"
          salidas={[
            { label: "Con fútbol 5, hay lugar en José C. Paz", href: "#" },
            { label: "Mañana probablemente haya más opciones", href: "#" },
            { label: "Probá con otra franja horaria", href: "#" },
          ]}
          ctaLabel="Avisame si se libera"
        />
      </Seccion>

      {/* ---------- FOOTER PUBLICO ---------- */}
      <Seccion titulo="Footer público">
        <div className="overflow-hidden rounded-card">
          <FooterPublico />
        </div>
      </Seccion>

      {/* ---------- GALERIA DE FOTOS (A3) ---------- */}
      <Seccion titulo="Galería de fotos (A3)">
        <div className="overflow-hidden rounded-card">
          <GaleriaFotos fotos={COMPLEJOS[0].fotos} nombreComplejo={COMPLEJOS[0].nombre} />
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Con el carrusel enfocado, las flechas del teclado navegan entre fotos. Sin auto-avance.
        </p>
      </Seccion>

      {/* ---------- GRILLA DE DISPONIBILIDAD (A3) ---------- */}
      <Seccion titulo="Grilla de disponibilidad (A3)">
        <GrillaDisponibilidad complejo={COMPLEJOS[0]} />
        <p className="mt-2.5 text-xs text-grafito">
          Una cancha por fila, una hora por columna — mismo lenguaje que la agenda de C2, pero de
          solo lectura. Las celdas libres son link directo al checkout.
        </p>
      </Seccion>

      {/* ---------- BLOQUE DE RESERVA (A3) ---------- */}
      <Seccion titulo="ReservaBlock (A3)">
        <div className="relative rounded-card bg-humo p-6" style={{ minHeight: 420 }}>
          <div className="max-w-xs">
            <ReservaBlock complejo={COMPLEJOS[0]} />
          </div>
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          En desktop es aside sticky (lo que se ve acá adentro); en mobile pasa a ser una barra fija
          abajo de la pantalla — probalo achicando la ventana.
        </p>
      </Seccion>

      {/* ---------- COUNTDOWN BADGE (A4 / A7) ---------- */}
      <Seccion titulo="CountdownBadge (A4, A7)">
        <div className="space-y-3 overflow-hidden rounded-card">
          <CountdownBadge deadline={deadlineDemo} etiquetaTurno="sábado 20:00" />
          <CountdownBadge deadline={deadlineVencidoDemo} etiquetaTurno="sábado 20:00" />
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Arriba, el cronómetro corriendo de verdad. Abajo, el estado vencido — nunca redirección
          silenciosa, siempre el mensaje más &quot;Buscar otro horario&quot;.
        </p>
      </Seccion>

      {/* ---------- SOBRE OSCURO ---------- */}
      <Seccion titulo="Sobre fondo oscuro">
        <div className="relative overflow-hidden rounded-card bg-tinta p-10">
          <LineasDeCancha className="opacity-[0.16]" />
          <div className="relative">
            <Isotipo variant="blanco" className="h-10 w-auto" />
            <h3 className="mt-5 text-3xl text-white">
              El software que ordena tu complejo
            </h3>
            <p className="mt-2 max-w-md text-[#9DB6D6]">
              Agenda, cobros y clientes en un solo lugar. Empezá gratis y pagá
              solo por reserva concretada.
            </p>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-grafito">
          Las líneas de cancha al 16% son el elemento gráfico de la marca.
        </p>
      </Seccion>
    </main>
  );
}
