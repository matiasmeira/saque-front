import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PUNTOS_ARRIBA_IZQUIERDA: [number, number][] = [
  [24, 24],
  [52, 24],
  [80, 24],
  [108, 24],
  [24, 52],
  [52, 52],
  [80, 52],
  [24, 80],
  [52, 80],
  [24, 108],
];

const PUNTOS_ARRIBA_DERECHA: [number, number][] = [
  [1576, 24],
  [1548, 24],
  [1520, 24],
  [1576, 52],
  [1548, 52],
  [1576, 80],
];

const PUNTOS_ABAJO_DERECHA: [number, number][] = [
  [1576, 376],
  [1548, 376],
  [1520, 376],
  [1492, 376],
  [1576, 348],
  [1548, 348],
  [1520, 348],
  [1576, 320],
  [1548, 320],
  [1576, 292],
];

const PUNTOS_ABAJO_IZQUIERDA: [number, number][] = [
  [24, 376],
  [52, 376],
  [80, 376],
  [24, 348],
  [52, 348],
  [24, 320],
];

const PUNTOS_SUELTOS: [number, number][] = [
  [180, 220],
  [340, 300],
  [450, 340],
  [560, 200],
  [620, 60],
  [700, 250],
  [760, 320],
  [860, 130],
  [950, 70],
  [1040, 210],
  [1120, 330],
  [1200, 280],
  [1260, 50],
  [1360, 300],
  [1420, 90],
];

/**
 * Patrón decorativo de esta sección: racimos de puntos en las
 * esquinas, un par de trazos diagonales, círculos delineados sueltos
 * y el chevron de la marca como acento — mismo lenguaje que el
 * isotipo del logo (ver Chevron en logo.tsx), a baja opacidad para
 * que quede textura, no ilustración.
 */
function PatronDecorativo() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1600 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="#5CC5F2" opacity={0.3}>
        {PUNTOS_ARRIBA_IZQUIERDA.map(([cx, cy]) => (
          <circle key={`ai-${cx}-${cy}`} cx={cx} cy={cy} r={3} />
        ))}
        {PUNTOS_ARRIBA_DERECHA.map(([cx, cy]) => (
          <circle key={`ad2-${cx}-${cy}`} cx={cx} cy={cy} r={3} />
        ))}
        {PUNTOS_ABAJO_DERECHA.map(([cx, cy]) => (
          <circle key={`ad-${cx}-${cy}`} cx={cx} cy={cy} r={3} />
        ))}
        {PUNTOS_ABAJO_IZQUIERDA.map(([cx, cy]) => (
          <circle key={`ai2-${cx}-${cy}`} cx={cx} cy={cy} r={3} />
        ))}
        {PUNTOS_SUELTOS.map(([cx, cy]) => (
          <circle key={`s-${cx}-${cy}`} cx={cx} cy={cy} r={2.5} />
        ))}
      </g>

      <g fill="none" stroke="#5CC5F2" strokeWidth={2.5} opacity={0.25}>
        <circle cx={200} cy={70} r={28} />
        <circle cx={1220} cy={150} r={20} />
        <circle cx={800} cy={340} r={16} />
      </g>

      <g stroke="#5CC5F2" strokeWidth={9} strokeLinecap="round" opacity={0.2}>
        <line x1={258} y1={20} x2={306} y2={88} />
        <line x1={288} y1={20} x2={336} y2={88} />
        <line x1={1058} y1={262} x2={1096} y2={330} />
        <line x1={120} y1={300} x2={158} y2={358} />
      </g>

      <g transform="translate(1440,150) skewX(-9)" fill="none" stroke="#5CC5F2" opacity={0.28}>
        <path d="M0 0 L45 55 L0 110" strokeWidth={9} />
        <path d="M60 0 L105 55 L60 110" strokeWidth={12} />
      </g>
    </svg>
  );
}

/**
 * CTA de cierre de la home. Enlaza directo a /buscar sin query params:
 * la página de resultados ya soporta ese caso (ver su docstring) y
 * devuelve todos los complejos ordenados por calificación.
 */
export function CtaFinal() {
  return (
    <section className="relative flex min-h-[280px] items-center overflow-hidden bg-tinta px-5 py-16 sm:min-h-[320px] sm:px-8 lg:min-h-[360px]">
      <PatronDecorativo />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="text-3xl text-white sm:text-4xl">¿Ya tenés el grupo?</h2>
        <p className="mt-4 text-[#9DB6D6]">Encontrá una cancha disponible y reservá tu turno en minutos.</p>
        <div className="relative mt-8 inline-block">
          <div
            className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full bg-azul/40 blur-3xl"
            aria-hidden
          />
          <Link
            href="/buscar"
            className="inline-flex h-14 items-center gap-2 rounded-full bg-azul px-8 font-display text-base font-bold text-white transition-colors hover:bg-azul-oscuro"
          >
            Buscar canchas
            <ArrowRight className="size-[18px]" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
