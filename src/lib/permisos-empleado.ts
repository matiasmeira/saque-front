import type { PermisoEmpleado } from "@/lib/api/tipos/comunes";

/**
 * Los 7 permisos del enum `PermisoEmpleado` del backend, con la etiqueta que ve
 * el dueño cuando arma la ficha de un empleado.
 *
 * Reemplaza al conjunto viejo del mock, que NO era el mismo: el front modelaba
 * permisos de PANTALLA (`ver_agenda`, `ver_clientes`, `ver_stock_buffet`) y el
 * backend modela permisos de ACCIÓN. No había forma de traducir uno en otro —
 * `ver_agenda` no existe del lado del back, y `CREAR_RESERVA_MANUAL`,
 * `MARCAR_AUSENTE` y `FIJAR_COMENTARIO_DESTACADO` no existían del lado del front.
 */

/**
 * Hasta dónde llega hoy cada permiso en la práctica.
 *
 * Es una foto del gateo REAL del backend, verificada con un empleado con los
 * siete permisos: casi todos los listados del panel son
 * `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")`, así que un empleado puede
 * tener permitida la acción y no poder llegar a la pantalla desde donde se
 * ejerce. Se muestra en la ficha para que el dueño no tilde un permiso
 * esperando un efecto que no va a ver.
 *
 * Si el backend abre esos listados a EMPLOYEE, esto pasa a "disponible".
 */
export type AlcanceReal =
  /** El empleado puede ejercerlo hoy desde el panel. */
  | "disponible"
  /** La acción está permitida, pero el listado desde el que se dispara es OWNER/ADMIN. */
  | "sin_lectura"
  /** No hay pantalla en el panel desde donde ejercerlo. */
  | "sin_pantalla";

export const PERMISOS_EMPLEADO: {
  valor: PermisoEmpleado;
  etiqueta: string;
  descripcion: string;
  alcance: AlcanceReal;
}[] = [
  {
    valor: "OPERAR_CAJA",
    etiqueta: "Gestionar caja",
    descripcion: "Abrir la caja, registrar movimientos y cerrarla al final del turno.",
    alcance: "disponible",
  },
  {
    valor: "CREAR_RESERVA_MANUAL",
    etiqueta: "Cargar turnos a mano",
    descripcion: "Anotar en la agenda un turno de alguien que vino o llamó.",
    alcance: "sin_lectura",
  },
  {
    valor: "FINALIZAR_RESERVA",
    etiqueta: "Cobrar turnos",
    descripcion: "Marcar un turno como jugado y registrar con qué se pagó.",
    alcance: "sin_lectura",
  },
  {
    valor: "CANCELAR_RESERVA",
    etiqueta: "Cancelar turnos",
    descripcion: "Dar de baja una reserva ya cargada.",
    alcance: "sin_lectura",
  },
  {
    valor: "MARCAR_AUSENTE",
    etiqueta: "Marcar ausencias",
    descripcion: "Registrar que el cliente no se presentó al turno.",
    alcance: "sin_lectura",
  },
  {
    valor: "REGISTRAR_VENTA_BUFFET",
    etiqueta: "Vender en el buffet",
    descripcion: "Cargar ventas de productos del buffet.",
    alcance: "sin_lectura",
  },
  {
    valor: "FIJAR_COMENTARIO_DESTACADO",
    etiqueta: "Destacar comentarios",
    descripcion: "Elegir qué opinión de un cliente se muestra en la ficha del complejo.",
    alcance: "sin_pantalla",
  },
];

const POR_VALOR = new Map(PERMISOS_EMPLEADO.map((p) => [p.valor, p]));

export function etiquetaPermiso(valor: PermisoEmpleado): string {
  return POR_VALOR.get(valor)?.etiqueta ?? valor;
}

export const NOTA_ALCANCE: Record<AlcanceReal, string | null> = {
  disponible: null,
  sin_lectura: "El backend todavía no le deja ver la pantalla desde donde se hace.",
  sin_pantalla: "Todavía no hay pantalla en el panel para esto.",
};
