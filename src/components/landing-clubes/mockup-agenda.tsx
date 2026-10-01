/**
 * Mockup de la agenda del hero. Es una ilustración con datos de ejemplo, no
 * datos reales. Pensado para 390px: 3 canchas x 4 horarios, sin cabecera de
 * días, ancho fluido (grid con columnas 1fr) y etiquetas cortas que pueden
 * partirse en dos líneas. Los colores de estado son los de la grilla del panel.
 */
type Estado = "confirmada" | "libre" | "pendiente" | "bloqueada";

const ESTILO: Record<Estado, { etiqueta: string; clase: string }> = {
  confirmada: { etiqueta: "Confirmada", clase: "border-l-2 border-ocupado bg-ocupado-suave text-tinta" },
  libre: { etiqueta: "Libre", clase: "bg-disponible-suave text-disponible" },
  pendiente: { etiqueta: "Pendiente de seña", clase: "border-l-2 border-pendiente bg-pendiente-suave text-tinta" },
  bloqueada: { etiqueta: "Bloqueada", clase: "bg-grafito text-white" },
};

const FILAS: { hora: string; celdas: [Estado, Estado, Estado] }[] = [
  { hora: "18:00", celdas: ["confirmada", "libre", "confirmada"] },
  { hora: "19:00", celdas: ["pendiente", "confirmada", "libre"] },
  { hora: "20:00", celdas: ["bloqueada", "pendiente", "confirmada"] },
  { hora: "21:00", celdas: ["confirmada", "confirmada", "confirmada"] },
];

export function MockupAgenda() {
  return (
    <div className="rounded-card bg-white p-4 shadow-card sm:p-6" role="img" aria-label="Ejemplo de la agenda del panel con tres canchas y cuatro horarios">
      <div className="flex items-center justify-between border-b border-borde pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-disponible" aria-hidden />
          <span className="font-display text-lg font-extrabold text-tinta">Agenda</span>
        </div>
        <span className="rounded-full bg-humo px-2.5 py-0.5 text-xs font-semibold text-grafito">Hoy</span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_13rem]">
        <div className="grid grid-cols-[2.5rem_repeat(3,minmax(0,1fr))] gap-1.5 text-[11px] leading-tight sm:text-xs" aria-hidden>
          <span />
          {["Cancha 1", "Cancha 2", "Cancha 3"].map((c) => (
            <span key={c} className="truncate text-center font-semibold text-grafito">
              {c.replace("Cancha ", "C")}
            </span>
          ))}
          {FILAS.map((fila) => (
            <FilaMockup key={fila.hora} {...fila} />
          ))}
        </div>

        <div className="hidden flex-col justify-between rounded-card bg-humo p-4 md:flex" aria-hidden>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-grafito">Detalle del turno</span>
              <span className="font-semibold text-tinta">Confirmada</span>
            </div>
            <p className="mt-3 font-display text-lg font-extrabold leading-none text-tinta">Cancha 2</p>
            <p className="mt-1 text-xs text-grafito">Fútbol 5</p>
            <dl className="mt-3 space-y-2 border-y border-borde py-3 text-xs">
              <div className="flex justify-between">
                <dt className="text-grafito">Horario</dt>
                <dd className="text-tinta">19:00 a 20:00</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-grafito">Cliente</dt>
                <dd className="text-tinta">Martín S.</dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 rounded bg-white p-2 text-[11px] text-grafito">Cobrado en el mostrador</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-grafito/80">Vista de ejemplo con datos ilustrativos.</p>
    </div>
  );
}

function FilaMockup({ hora, celdas }: { hora: string; celdas: [Estado, Estado, Estado] }) {
  return (
    <>
      <span className="self-center font-semibold text-grafito">{hora}</span>
      {celdas.map((estado, i) => (
        <span
          key={i}
          className={`flex min-h-12 items-center justify-center rounded px-1 text-center font-semibold ${ESTILO[estado].clase}`}
        >
          {ESTILO[estado].etiqueta}
        </span>
      ))}
    </>
  );
}
