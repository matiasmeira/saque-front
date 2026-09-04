import type { ComponentType } from "react";
import {
  IconBallBasketball,
  IconBallFootball,
  IconBallTennis,
  IconBallVolleyball,
  IconGolf,
  IconPingPong,
  IconPlayHandball,
  IconRollerSkating,
  IconSwimming,
} from "@tabler/icons-react";
import type { Deporte } from "@/lib/api/tipos/comunes";
import { IconoHockey, IconoSurf } from "@/components/canche/iconos-deporte";

type IconoDeporte = ComponentType<{ className?: string }>;

/**
 * Catálogo de presentación de los 29 valores del enum `Deporte` del backend.
 *
 * La modalidad/cantidad de jugadores ya viene incluida en el propio valor del
 * enum (ej. `FUTBOL_5` vs `FUTBOL_7`), no se deriva de ningún otro campo:
 * la cancha ya no tiene `capacidad`, el deporte granular es la única fuente
 * de verdad para la etiqueta que se muestra ("Fútbol 5").
 *
 * `icono` es un componente, no un string: varios deportes (todos los
 * Fútbol N, los de raqueta, los de vóley) comparten el mismo dibujo a
 * propósito — no hay forma de distinguir visualmente "Fútbol 7" de
 * "Fútbol 8" con un ícono, así que comparten la pelota y la etiqueta
 * hace el resto.
 */
export const DEPORTES: { valor: Deporte; etiqueta: string; abreviatura: string; icono: IconoDeporte }[] = [
  { valor: "PADEL", etiqueta: "Pádel", abreviatura: "PAD", icono: IconBallTennis },
  { valor: "FUTBOL_4", etiqueta: "Fútbol 4", abreviatura: "FU4", icono: IconBallFootball },
  { valor: "FUTBOL_5", etiqueta: "Fútbol 5", abreviatura: "FU5", icono: IconBallFootball },
  { valor: "FUTBOL_6", etiqueta: "Fútbol 6", abreviatura: "FU6", icono: IconBallFootball },
  { valor: "FUTBOL_7", etiqueta: "Fútbol 7", abreviatura: "FU7", icono: IconBallFootball },
  { valor: "FUTBOL_8", etiqueta: "Fútbol 8", abreviatura: "FU8", icono: IconBallFootball },
  { valor: "FUTBOL_9", etiqueta: "Fútbol 9", abreviatura: "FU9", icono: IconBallFootball },
  { valor: "FUTBOL_10", etiqueta: "Fútbol 10", abreviatura: "F10", icono: IconBallFootball },
  { valor: "FUTBOL_11", etiqueta: "Fútbol 11", abreviatura: "F11", icono: IconBallFootball },
  { valor: "TENIS", etiqueta: "Tenis", abreviatura: "TEN", icono: IconBallTennis },
  { valor: "BASQUET_3VS3", etiqueta: "Básquet 3vs3", abreviatura: "BQ3", icono: IconBallBasketball },
  { valor: "BASQUET_5VS5", etiqueta: "Básquet 5vs5", abreviatura: "BQ5", icono: IconBallBasketball },
  { valor: "HOCKEY", etiqueta: "Hockey", abreviatura: "HOC", icono: IconoHockey },
  { valor: "FUTGOLF", etiqueta: "Futgolf", abreviatura: "FGO", icono: IconGolf },
  { valor: "GOLF_VIRTUAL", etiqueta: "Golf Virtual", abreviatura: "GVI", icono: IconGolf },
  { valor: "PING_PONG", etiqueta: "Ping Pong", abreviatura: "PPO", icono: IconPingPong },
  { valor: "VOLEY", etiqueta: "Vóley", abreviatura: "VOL", icono: IconBallVolleyball },
  { valor: "FRONTON", etiqueta: "Frontón", abreviatura: "FRO", icono: IconBallTennis },
  { valor: "SQUASH", etiqueta: "Squash", abreviatura: "SQU", icono: IconBallTennis },
  { valor: "PADBOL", etiqueta: "Padbol", abreviatura: "PDB", icono: IconPlayHandball },
  { valor: "BEACH_TENIS", etiqueta: "Beach Tenis", abreviatura: "BTE", icono: IconBallTennis },
  { valor: "FUTVOLEY", etiqueta: "Futvóley", abreviatura: "FVO", icono: IconBallVolleyball },
  { valor: "HANDBALL", etiqueta: "Handball", abreviatura: "HAN", icono: IconPlayHandball },
  { valor: "NATACION", etiqueta: "Natación", abreviatura: "NAT", icono: IconSwimming },
  { valor: "SURF", etiqueta: "Surf", abreviatura: "SUR", icono: IconoSurf },
  { valor: "PICKLEBALL", etiqueta: "Pickleball", abreviatura: "PIC", icono: IconPingPong },
  { valor: "PADEL_SINGLE", etiqueta: "Pádel Individual", abreviatura: "PSI", icono: IconBallTennis },
  { valor: "BEACH_VOLLEY", etiqueta: "Beach Vóley", abreviatura: "BVO", icono: IconBallVolleyball },
  { valor: "PATINAJE", etiqueta: "Patinaje", abreviatura: "PAT", icono: IconRollerSkating },
];

export function etiquetaDeporte(valor: string): string {
  return DEPORTES.find((d) => d.valor === valor)?.etiqueta ?? valor;
}

export function abreviaturaDeporte(valor: string): string {
  return DEPORTES.find((d) => d.valor === valor)?.abreviatura ?? valor;
}

/** `true` si el string es uno de los valores del enum del backend. */
export function esDeporte(valor: string | undefined): valor is Deporte {
  return DEPORTES.some((d) => d.valor === valor);
}

export type FamiliaDeporte = {
  /** No es un `Deporte`: es la clave del grupo ("FUTBOL") o, para deportes sin
   *  variantes, el propio valor del enum. Nombrado `valor` (no `clave`) para
   *  calzar estructuralmente con `OpcionSelector` y pasarse directo a
   *  `<Selector opciones={...}>`, igual que ya hace `buscador.tsx` con `DEPORTES`. */
  valor: string;
  etiqueta: string;
  icono: IconoDeporte;
  /** Todos los valores del enum que caen bajo esta familia. */
  miembros: Deporte[];
};

/**
 * Deportes cuya cantidad de jugadores es una variante del mismo juego, no un
 * deporte distinto: la ficha de un complejo los agrupa bajo una sola pestaña
 * ("Fútbol") en vez de una por modalidad ("Fútbol 5", "Fútbol 7", ...).
 */
const GRUPOS: { valor: string; etiqueta: string; miembros: Deporte[] }[] = [
  {
    valor: "FUTBOL",
    etiqueta: "Fútbol",
    miembros: ["FUTBOL_4", "FUTBOL_5", "FUTBOL_6", "FUTBOL_7", "FUTBOL_8", "FUTBOL_9", "FUTBOL_10", "FUTBOL_11"],
  },
  { valor: "BASQUET", etiqueta: "Básquet", miembros: ["BASQUET_3VS3", "BASQUET_5VS5"] },
];

/**
 * Familias distintas entre los deportes que ofrece un complejo. Cada familia
 * de grupo (Fútbol, Básquet) lleva SIEMPRE todos sus miembros, no sólo los que
 * el complejo ofrece: así, al elegir "Fútbol", el filtro de canchas trae
 * juntas las de Fútbol 5 y Fútbol 7 aunque el complejo no tenga las 8
 * modalidades. Recorre `DEPORTES` en su propio orden de catálogo, no el de
 * `deportes`, que no está garantizado.
 */
export function familiasDeDeportes(deportes: Deporte[]): FamiliaDeporte[] {
  const familias: FamiliaDeporte[] = [];
  for (const d of DEPORTES) {
    if (!deportes.includes(d.valor)) continue;
    const grupo = GRUPOS.find((g) => g.miembros.includes(d.valor));
    const valorFamilia = grupo?.valor ?? d.valor;
    if (familias.some((f) => f.valor === valorFamilia)) continue;
    familias.push(
      grupo
        ? { valor: grupo.valor, etiqueta: grupo.etiqueta, icono: d.icono, miembros: grupo.miembros }
        : { valor: d.valor, etiqueta: d.etiqueta, icono: d.icono, miembros: [d.valor] },
    );
  }
  return familias;
}
