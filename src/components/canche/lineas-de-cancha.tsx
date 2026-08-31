/**
 * El elemento gráfico propio de la marca: el dibujo de una cancha
 * de fútbol (línea de mitad, círculo central, dos áreas) en celeste.
 * Es la escala "grande" de la línea (Parte 4) — la usan el hero de
 * A1, el placeholder de foto de VenueCard y el banner del mapa,
 * siempre sobre fondo tinta. Nunca decorativa sola: reemplaza a la
 * foto real cuando todavía no hay una.
 */
export function LineasDeCancha({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="#5CC5F2" strokeWidth={2.5}>
        <rect x={14} y={14} width={772} height={372} />
        <line x1={400} y1={14} x2={400} y2={386} />
        <circle cx={400} cy={200} r={70} />
        <rect x={14} y={110} width={130} height={180} />
        <rect x={656} y={110} width={130} height={180} />
      </g>
    </svg>
  );
}
