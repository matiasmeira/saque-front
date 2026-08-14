"use client";

import { useState } from "react";
import { DollarSign, Percent, UserX } from "lucide-react";
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
import type { ComplejoDetalleResponse } from "@/lib/api/tipos/publico";
import { CountdownBadge } from "@/components/saque/countdown-badge";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { MetricaComparada } from "@/components/panel/metrica-comparada";
import { COMPLEJOS } from "@/mocks/complejos";

/**
 * Guia de estilo viva — /estilo
 *
 * No es parte del producto, es una herramienta interna. Cada vez
 * que agreguemos un componente lo sumamos aca. Sirve para ver todo
 * junto y detectar inconsistencias antes de que se propaguen.
 *
 * Lenguaje de card (rediseño a fondo): sin borde, sombra difusa y
 * sutil (shadow-card, token propio — no la shadow-sm generica de
 * Tailwind), radio de 0.75rem y padding generoso. Los bordes finos
 * siguen existiendo solo como divisores internos (hr, border-t) y en
 * controles reales (botón outline), nunca como borde de una card.
 */

const CLIENTES_DEMO = [
  { nombre: "Diego Torres", reservas: 14, ultima: "hoy" },
  { nombre: "Ceci Ibáñez", reservas: 11, ultima: "ayer" },
  { nombre: "Los de siempre", reservas: 9, ultima: "hace 3 días" },
  { nombre: "Ana Ríos", reservas: 6, ultima: "hace 5 días" },
  { nombre: "Grupo del Colo", reservas: 4, ultima: "hace 1 semana" },
];

/**
 * Fixture con la forma de ComplejoDetalleResponse. El slug es real: la grilla
 * consulta la disponibilidad del backend, así que acá se ve con datos de verdad.
 */
const COMPLEJO_DEMO: ComplejoDetalleResponse = {
  slug: "arena-sport-club",
  nombre: "Arena Sport Club",
  direccion: "Av. Croacia 1250, José C. Paz",
  latitud: -34.5221,
  longitud: -58.7573,
  deportes: ["FUTBOL", "PADEL"],
  servicios: ["PARRILLA", "VESTUARIOS", "ESTACIONAMIENTO", "BUFFET", "WIFI"],
  fotos: [],
  horariosAtencion: [
    { diaSemana: "MONDAY", horaApertura: "09:00:00", horaCierre: "23:00:00" },
  ],
  canchas: [],
  precioDesde: 12000,
  requiereSena: true,
  senaDesde: 4000,
  promedioCalificacion: 4.6,
  cantidadCalificaciones: 23,
  comentarioDestacado: null,
};

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
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <div className="mb-6 border-b border-borde pb-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-tinta">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-grafito">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

export default function GuiaDeEstilo() {
  const [horaElegida, setHoraElegida] = useState<string | null>("20:30");
  const [deadlineDemo] = useState(() => Date.now() + 9 * 60 * 1000 + 47 * 1000);
  const [deadlineVencidoDemo] = useState(() => Date.now() - 1000);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 pb-32">
      <Logo className="h-11 w-auto" />
      <p className="mt-3 text-grafito">
        Guía de estilo. Todo lo que construyamos sale de acá.
      </p>

      {/* ---------- COLORES ---------- */}
      <Seccion titulo="Paleta" descripcion="La identidad de marca — no se toca en el rediseño de cards.">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {COLORES.map((c) => (
            <div key={c.nombre} className="overflow-hidden rounded-card bg-white shadow-card">
              <div className={`h-20 ${c.clase}`} />
              <div className="p-4">
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
      <Seccion titulo="Tipografía" descripcion="Archivo para titulares y números grandes, Public Sans para todo lo demás.">
        <div className="rounded-card bg-white p-10 shadow-card">
          <h1 className="text-5xl leading-[1.05]">
            Reservá tu cancha
            <br />
            en 30 segundos
          </h1>
          <p className="mt-2 text-xs text-grafito">Archivo 800 · titulares</p>

          <hr className="my-8 border-borde" />

          <p className="max-w-lg text-[17px] leading-relaxed text-grafito">
            Elegí el complejo, el día y el horario. Pagás la seña online y el
            turno queda confirmado al instante.
          </p>
          <p className="mt-2 text-xs text-grafito">Public Sans · cuerpo</p>

          <hr className="my-8 border-borde" />

          <p className="font-display text-2xl font-semibold">
            19:00 · 20:30 · 22:00 &nbsp;&nbsp; $18.500
          </p>
          <p className="mt-2 text-xs text-grafito">
            Números tabulares — se alinean en columna
          </p>

          <hr className="my-8 border-borde" />

          <p className="text-xs font-semibold uppercase tracking-wide text-grafito">Label / metadato</p>
          <p className="mt-1 text-xs text-grafito">
            Siempre chico y en gris (muted-foreground) — nunca compite con el titular.
          </p>
        </div>
      </Seccion>

      {/* ---------- BOTONES ---------- */}
      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-white p-10 shadow-card">
          <button className="rounded-full bg-azul px-7 py-3.5 font-display text-[15px] font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste">
            Reservar turno
          </button>
          <button className="rounded-full border border-borde bg-white px-7 py-3.5 font-display text-[15px] font-bold text-azul transition-colors hover:border-azul focus:outline-none focus:ring-2 focus:ring-celeste">
            Ver disponibilidad
          </button>
          <button
            disabled
            className="cursor-not-allowed rounded-full bg-ocupado-suave px-7 py-3.5 font-display text-[15px] font-bold text-ocupado"
          >
            Sin lugar
          </button>
        </div>
        <p className="mt-3 text-xs text-grafito">
          Píldora completa en el CTA principal: es el único gesto deportivo de la interfaz. Primario azul sólido,
          secundario con borde sutil — foco siempre con anillo celeste.
        </p>
      </Seccion>

      {/* ---------- INPUTS ---------- */}
      <Seccion titulo="Inputs" descripcion="Fondo apenas gris, sin borde marcado, foco con anillo celeste real.">
        <div className="grid grid-cols-1 gap-5 rounded-card bg-white p-10 shadow-card sm:grid-cols-2">
          <div>
            <label htmlFor="demo-texto" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-grafito">
              Nombre
            </label>
            <input
              id="demo-texto"
              defaultValue="Arena Sport Club"
              className="w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            />
          </div>
          <div>
            <label htmlFor="demo-select" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-grafito">
              Deporte
            </label>
            <select
              id="demo-select"
              defaultValue="futbol-5"
              className="w-full rounded-input bg-humo px-3.5 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
            >
              <option value="futbol-5">Fútbol 5</option>
              <option value="padel">Pádel</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-grafito">
          Mismo tratamiento para fecha, número y cualquier otro campo del panel y del checkout.
        </p>
      </Seccion>

      {/* ---------- ESTADOS ---------- */}
      <Seccion titulo="Estados de reserva">
        <div className="flex flex-wrap gap-2.5 rounded-card bg-white p-10 shadow-card">
          <StatusBadge estado="disponible" />
          <StatusBadge estado="ocupado" />
          <StatusBadge estado="pendiente" />
          <StatusBadge estado="cancelado" />
        </div>
      </Seccion>

      {/* ---------- SIDEBAR DEL PANEL ---------- */}
      <Seccion titulo="Sidebar del panel">
        <div className="h-[560px] overflow-hidden rounded-card shadow-card">
          <SidebarPanel />
        </div>
        <p className="mt-3 text-xs text-grafito">
          Agrupada en tres secciones fijas — Gestión, Buffet, Administración. Cada ítem se recorta por permiso
          (nunca aparece deshabilitado, directamente no está); si un grupo entero queda sin ítems visibles, ni su
          encabezado aparece. El ítem activo es un chip celeste-suave con esquinas redondeadas, no una barra lateral.
        </p>
      </Seccion>

      {/* ---------- CARD DE MÉTRICA ---------- */}
      <Seccion titulo="Card de métrica" descripcion="El patrón KPI real, en uso en Reportes (C8).">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <MetricaComparada etiqueta="Facturación total" valor="$482.300" variacionPct={12} icono={DollarSign} grande />
          <MetricaComparada
            etiqueta="Ocupación general"
            valor="78%"
            variacionPct={5}
            icono={Percent}
            colorBurbuja="bg-disponible-suave text-disponible"
          />
          <MetricaComparada
            etiqueta="Ausencias"
            valor="6"
            variacionPct={-8}
            icono={UserX}
            colorBurbuja="bg-pendiente-suave text-pendiente"
          />
        </div>
        <p className="mt-3 text-xs text-grafito">
          Ícono en burbuja de color arriba, número grande (Archivo 800) debajo, y la variación con flecha — verde
          sube, rojo baja. <code>MetricaComparada</code>, con <code>icono</code> obligatorio y{" "}
          <code>colorBurbuja</code> opcional para cambiar el tono de la burbuja.
        </p>
      </Seccion>

      {/* ---------- TABLA ---------- */}
      <Seccion titulo="Tabla" descripcion="Referencia para Agenda, Clientes y Pagos — todavía no propagada a esas pantallas.">
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito">Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito">Reservas</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-grafito">Última</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde/60">
              {CLIENTES_DEMO.map((c) => (
                <tr key={c.nombre} className="transition-colors hover:bg-humo/60">
                  <td className="px-6 py-4 font-semibold text-tinta">{c.nombre}</td>
                  <td className="px-6 py-4 tabular-nums text-grafito">{c.reservas}</td>
                  <td className="px-6 py-4 text-grafito">{c.ultima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-grafito">
          Filas con aire, hover sutil, separadores casi invisibles entre filas — nunca un borde grueso.
        </p>
      </Seccion>

      {/* ---------- CHIPS DE HORARIO ---------- */}
      <Seccion titulo="Chips de horario">
        <div className="rounded-card bg-white p-10 shadow-card">
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
        <article className="max-w-sm overflow-hidden rounded-card bg-white shadow-card">
          <div className="flex h-40 items-center justify-center bg-tinta">
            <span className="text-xs tracking-widest text-celeste">
              FOTO DEL COMPLEJO
            </span>
          </div>
          <div className="p-6">
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
        <div className="overflow-hidden rounded-card shadow-card">
          <div className="bg-tinta">
            <HeaderPublico variant="oscuro" />
          </div>
          <div className="border-t border-borde bg-white">
            <HeaderPublico variant="claro" />
          </div>
        </div>
        <p className="mt-3 text-xs text-grafito">
          Variante oscura para el hero de A1, clara para el resto de zona A y B.
        </p>
      </Seccion>

      {/* ---------- BUSCADOR ---------- */}
      <Seccion titulo="Buscador (A1)">
        <div className="overflow-hidden rounded-card bg-tinta pt-20 shadow-card">
          <Buscador />
        </div>
        <p className="mt-3 text-xs text-grafito">
          Arranca en &quot;Cerca mío&quot;, sin pedir geolocalización. El botón navega a
          /buscar con los filtros como query params.
        </p>
      </Seccion>

      {/* ---------- FILTROS DE RESULTADOS (A2) ---------- */}
      <Seccion titulo="Filtros de resultados (A2)">
        <FiltrosResultados
          deporte="FUTBOL"
          fecha="2026-07-25"
          franja="noche"
          ubicacion={{ lat: -34.5221, lng: -58.7573, etiqueta: "José C. Paz, Buenos Aires" }}
        />
        <p className="mt-3 text-xs text-grafito">
          Cada campo renavega /buscar con los params actualizados. &quot;Más filtros&quot; abre la
          hoja inferior — tocá el botón para probarla.
        </p>
      </Seccion>

      {/* ---------- TARJETAS DE RESULTADO (A2) ---------- */}
      <Seccion titulo="VenueCard (A2)">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <VenueCard
            complejo={{
              slug: "arena-sport-club",
              nombre: "Arena Sport Club",
              direccion: "Av. Croacia 1250, José C. Paz",
              fotoPrincipal: null,
              deportes: ["FUTBOL", "PADEL"],
              precioDesde: 12000,
              requiereSena: true,
              senaDesde: 4000,
              distanciaKm: 1.2,
              promedioCalificacion: 4.6,
              cantidadCalificaciones: 23,
            }}
          />
          <VenueCard
            complejo={{
              slug: "club-pinares",
              nombre: "Club Pinares",
              direccion: "Ruta 8 km 42, Pilar",
              fotoPrincipal: null,
              deportes: ["TENIS"],
              precioDesde: null,
              requiereSena: false,
              senaDesde: null,
              distanciaKm: null,
              promedioCalificacion: null,
              cantidadCalificaciones: 0,
            }}
          />
        </div>
        <p className="mt-3 text-xs text-grafito">
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
            { label: "Con fútbol 5, hay lugar en José C. Paz", href: "#salida-1" },
            { label: "Mañana probablemente haya más opciones", href: "#salida-2" },
            { label: "Probá con otra franja horaria", href: "#salida-3" },
          ]}
          ctaLabel="Avisame si se libera"
        />
      </Seccion>

      {/* ---------- FOOTER PUBLICO ---------- */}
      <Seccion titulo="Footer público">
        <div className="overflow-hidden rounded-card shadow-card">
          <FooterPublico />
        </div>
      </Seccion>

      {/* ---------- GALERIA DE FOTOS (A3) ---------- */}
      <Seccion titulo="Galería de fotos (A3)">
        <div className="overflow-hidden rounded-card shadow-card">
          <GaleriaFotos fotos={COMPLEJOS[0].fotos} nombreComplejo={COMPLEJOS[0].nombre} />
        </div>
        <p className="mt-3 text-xs text-grafito">
          Con el carrusel enfocado, las flechas del teclado navegan entre fotos. Sin auto-avance.
        </p>
      </Seccion>

      {/* ---------- GRILLA DE DISPONIBILIDAD (A3) ---------- */}
      <Seccion titulo="Grilla de disponibilidad (A3)">
        <GrillaDisponibilidad complejo={COMPLEJO_DEMO} />
        <p className="mt-3 text-xs text-grafito">
          Consulta la disponibilidad real del backend para el slug de demo: una fila por cancha y un
          chip por turno libre. Los chips son link directo al checkout, con el slot entero
          (inicio y fin) en la URL.
        </p>
      </Seccion>

      {/* ---------- BLOQUE DE RESERVA (A3) ---------- */}
      <Seccion titulo="ReservaBlock (A3)">
        <div className="relative rounded-card bg-humo p-6 shadow-card" style={{ minHeight: 420 }}>
          <div className="max-w-xs">
            <ReservaBlock complejo={COMPLEJO_DEMO} />
          </div>
        </div>
        <p className="mt-3 text-xs text-grafito">
          En desktop es aside sticky (lo que se ve acá adentro); en mobile pasa a ser una barra fija
          abajo de la pantalla — probalo achicando la ventana.
        </p>
      </Seccion>

      {/* ---------- COUNTDOWN BADGE (A4 / A7) ---------- */}
      <Seccion titulo="CountdownBadge (A4, A7)">
        <div className="space-y-3 overflow-hidden rounded-card shadow-card">
          <CountdownBadge deadline={deadlineDemo} etiquetaTurno="sábado 20:00" />
          <CountdownBadge deadline={deadlineVencidoDemo} etiquetaTurno="sábado 20:00" />
        </div>
        <p className="mt-3 text-xs text-grafito">
          Arriba, el cronómetro corriendo de verdad. Abajo, el estado vencido — nunca redirección
          silenciosa, siempre el mensaje más &quot;Buscar otro horario&quot;.
        </p>
      </Seccion>

      {/* ---------- SOBRE OSCURO ---------- */}
      <Seccion titulo="Sobre fondo oscuro">
        <div className="relative overflow-hidden rounded-card bg-tinta p-10 shadow-card">
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
        <p className="mt-3 text-xs text-grafito">
          Las líneas de cancha al 16% son el elemento gráfico de la marca.
        </p>
      </Seccion>
    </main>
  );
}
