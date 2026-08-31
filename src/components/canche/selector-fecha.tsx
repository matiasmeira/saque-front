import { Selector } from "@/components/canche/selector";

/**
 * Selector de fecha, consistente con el resto de los campos.
 *
 * Nada de <input type="date"> nativo: se ve distinto en cada
 * navegador y rompe con Deporte y Dónde. Ofrece los próximos 14
 * días con etiquetas legibles ("Hoy", "Mañana", "Sáb 25"). Los
 * chips rápidos del buscador reusan la misma lista — una sola
 * fuente de fechas, sin cálculos duplicados.
 */
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function aISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function proximosDias(cantidad = 14) {
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, indice) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + indice);
    const etiqueta =
      indice === 0
        ? "Hoy"
        : indice === 1
          ? "Mañana"
          : `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}`;
    return { valor: aISO(fecha), etiqueta, fecha };
  });
}

/** "hoy" / "mañana" / "el sáb 25" — para meter una fecha en una oración. */
export function etiquetaDeFecha(fechaISO: string): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const diffDias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);

  if (diffDias === 0) return "hoy";
  if (diffDias === 1) return "mañana";
  return `el ${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}`;
}

export function SelectorFecha({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return <Selector id={id} value={value} onChange={onChange} opciones={proximosDias()} />;
}
