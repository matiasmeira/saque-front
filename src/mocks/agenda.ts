/**
 * Agenda del panel (C2). A diferencia de canchas.ts (que administra
 * la entidad Cancha en sí — alta, edición, pool), acá cada Turno es
 * una reserva concreta con cliente, plata y estado — lo que el dueño
 * o el empleado ven y tocan desde /panel/agenda.
 */
import { aHHMM, aMinutos } from "@/lib/disponibilidad";
import { crearRand, hashSeed } from "@/lib/prng";
import { PANEL_CANCHAS, type Cancha } from "@/mocks/canchas";
import { calcularPrecio, diaSemanaDeFecha, PANEL_TARIFAS } from "@/mocks/tarifas";

export type BloqueoDelDia = { horaInicio: string; horaFin: string; motivo?: string };

export type EstadoTurno = "ocupado" | "pendiente" | "cancelado" | "ausente";
export type EstadoComplejo = "borrador" | "publicado" | "despublicado" | "suspendido";
/** ver Parte 11: comisión ($450 fijos por reserva) o suscripción escalonada (sin comisión) */
export type PlanComplejo = "comision" | "suscripcion";

export type Turno = {
  id: string;
  canchaId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  cliente: { nombre: string; telefono: string };
  monto: number;
  senia: number;
  seniaPagada: boolean;
  repiteSemanal: boolean;
};

export const PANEL_COMPLEJO = {
  nombre: "Arena Sport Club",
  estado: "publicado" as EstadoComplejo,
  diasRestantesTrial: 9,
  plan: "comision" as PlanComplejo,
};

export const PANEL_HORARIO = { abre: "08:00", cierra: "23:00" };

// Exportado: son las mismas personas que después aparecen como
// Cliente en clientes.ts (C5/C6) — la libreta de contactos del
// complejo es literalmente "quién reservó", y acá es donde reservan.
export const CLIENTES_MOCK: { nombre: string; telefono: string }[] = [
  { nombre: "Martín Pérez", telefono: "11 5555-4444" },
  { nombre: "Grupo del Colo", telefono: "11 4444-3333" },
  { nombre: "Laura Gómez", telefono: "11 3333-2222" },
  { nombre: "Fede y los pibes", telefono: "11 2222-1111" },
  { nombre: "Sole Fernández", telefono: "11 6666-5555" },
  { nombre: "Diego Torres", telefono: "11 7777-6666" },
  { nombre: "Ana Ríos", telefono: "11 8888-7777" },
  { nombre: "Los de siempre", telefono: "11 9999-8888" },
  { nombre: "Ceci Ibáñez", telefono: "11 1234-5678" },
  { nombre: "Nico Suárez", telefono: "11 8765-4321" },
];

/**
 * Recorta los bloqueos de mantenimiento de una cancha (que pueden
 * durar varios días — "desde"/"hasta" son datetime completos) a la
 * porción que cae dentro del horario de atención de UN día puntual.
 * Es lo que la grilla de C2 pinta como bloque especial, y lo que el
 * generador de turnos usa para no ofrecer horarios que en realidad
 * están bloqueados.
 */
export function bloqueosDelDia(cancha: Cancha, fecha: string): BloqueoDelDia[] {
  const diaAbre = `${fecha}T${PANEL_HORARIO.abre}`;
  const diaCierra = `${fecha}T${PANEL_HORARIO.cierra}`;

  const resultado: BloqueoDelDia[] = [];
  for (const b of cancha.mantenimientos) {
    const desde = b.desde > diaAbre ? b.desde : diaAbre;
    const hasta = b.hasta < diaCierra ? b.hasta : diaCierra;
    if (desde >= hasta) continue;
    resultado.push({ horaInicio: desde.slice(11, 16), horaFin: hasta.slice(11, 16), motivo: b.motivo });
  }
  return resultado;
}

/**
 * Turnos no son bloques fijos: cada uno elige, determinísticamente,
 * una de las duraciones permitidas de la cancha, y arranca cada 30
 * minutos si la cancha admite inicio a la media hora, o cada hora si
 * no. Se colocan sin superponerse entre sí (mismo cancha = mismo
 * recurso, no puede haber dos turnos pisándose) ni con los bloqueos
 * de mantenimiento de ese día.
 */
function turnosDeCancha(cancha: Cancha, fecha: string): Turno[] {
  const rand = crearRand(hashSeed(`${fecha}-${cancha.id}`));
  const abreMin = aMinutos(PANEL_HORARIO.abre);
  const cierraMin = aMinutos(PANEL_HORARIO.cierra);
  const paso = cancha.permiteInicioMediaHora ? 30 : 60;

  const candidatos: number[] = [];
  for (let m = abreMin; m < cierraMin; m += paso) candidatos.push(m);
  for (let i = candidatos.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
  }

  const objetivo = 1 + Math.floor(rand() * 4);
  const ocupados: { desde: number; hasta: number }[] = bloqueosDelDia(cancha, fecha).map((b) => ({
    desde: aMinutos(b.horaInicio),
    hasta: aMinutos(b.horaFin),
  }));
  const turnos: Turno[] = [];

  for (const inicio of candidatos) {
    if (turnos.length >= objetivo) break;
    const duracion = cancha.duracionesPermitidas[Math.floor(rand() * cancha.duracionesPermitidas.length)];
    const fin = inicio + duracion;
    if (fin > cierraMin) continue;
    const choca = ocupados.some((o) => inicio < o.hasta && fin > o.desde);
    if (choca) continue;

    const r = rand();
    // Sin seña, no existe "pendiente de seña" — o está ocupado o se canceló.
    const estado: EstadoTurno =
      cancha.montoSena === 0 ? (r < 0.85 ? "ocupado" : "cancelado") : r < 0.65 ? "ocupado" : r < 0.85 ? "pendiente" : "cancelado";
    const cliente = CLIENTES_MOCK[Math.floor(rand() * CLIENTES_MOCK.length)];

    ocupados.push({ desde: inicio, hasta: fin });
    const { precio } = calcularPrecio(cancha, PANEL_TARIFAS, diaSemanaDeFecha(fecha), aHHMM(inicio), duracion);
    turnos.push({
      id: `${cancha.id}-${fecha}-${inicio}`,
      canchaId: cancha.id,
      fecha,
      horaInicio: aHHMM(inicio),
      horaFin: aHHMM(fin),
      estado,
      cliente,
      monto: precio,
      senia: cancha.montoSena,
      seniaPagada: estado === "ocupado" && cancha.montoSena > 0,
      repiteSemanal: rand() < 0.2,
    });
  }

  return turnos.sort((a, b) => aMinutos(a.horaInicio) - aMinutos(b.horaInicio));
}

// TODO backend: turnos y disponibilidad vienen de la API — y ahí sí
// hay que resolver contención de pool real (una reserva en una
// cancha física puede bloquear una compuesta que comparte el pool,
// aunque acá el mock no lo simula: cada turno vive en la columna de
// la cancha para la que se generó, sin cruzar canchas). Este
// generador determinístico (seed = fecha+cancha) solo existe para
// que el mock tenga variedad real al navegar entre días sin repetir
// siempre el mismo dibujo.
export function turnosDelDia(fecha: string): Turno[] {
  return PANEL_CANCHAS.flatMap((cancha) => turnosDeCancha(cancha, fecha));
}
