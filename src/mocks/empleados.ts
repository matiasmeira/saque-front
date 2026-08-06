/**
 * C10 — empleados del complejo. Viven dentro de Configuración porque
 * son un dato administrativo del establecimiento, no operativo del
 * día a día (eso es C2/C5).
 *
 * No hay más un rol EMPLEADO de permisos fijos: cada empleado tiene
 * su propia lista de permisos, que el dueño tilda uno por uno acá.
 * El dueño tiene todos los permisos siempre, implícito — nunca se
 * lista ni se guarda como si fuera "otro empleado más". El helper
 * central que resuelve esto vive en @/lib/permisos (usePermisos).
 *
 * TODO backend: los permisos por empleado y la autenticación por
 * nombre+contraseña vienen de la API. Acá "contrasena" es un mock en
 * texto plano que nunca se muestra en pantalla — el backend real
 * jamás devuelve ni almacena la contraseña así.
 *
 * "pin" es una credencial aparte, para la zona E (kiosco de caja,
 * /caja/*): 4 dígitos, se usa solo ahí, nunca en el login del panel
 * de escritorio (ese sigue siendo nombre + contrasena). Mismo
 * criterio de seguridad que la contraseña: nunca se vuelve a mostrar
 * después del alta.
 */
export type Permiso =
  | "ver_agenda"
  | "cobrar_turnos"
  | "cancelar_turnos"
  | "ver_clientes"
  | "vender_buffet"
  | "ver_stock_buffet"
  | "gestionar_caja";

export const PERMISOS: { valor: Permiso; etiqueta: string; descripcion: string }[] = [
  { valor: "ver_agenda", etiqueta: "Ver agenda", descripcion: "Ver la grilla de turnos" },
  { valor: "cobrar_turnos", etiqueta: "Cobrar turnos", descripcion: "Finalizar y cobrar un turno" },
  { valor: "cancelar_turnos", etiqueta: "Cancelar turnos", descripcion: "Cancelar una reserva" },
  { valor: "ver_clientes", etiqueta: "Ver clientes", descripcion: "Ver la lista de clientes y su historial" },
  { valor: "vender_buffet", etiqueta: "Vender en el buffet", descripcion: "Cargar ventas del buffet" },
  { valor: "ver_stock_buffet", etiqueta: "Ver stock del buffet", descripcion: "Ver el inventario del buffet" },
  { valor: "gestionar_caja", etiqueta: "Gestionar caja", descripcion: "Abrir, cerrar y registrar movimientos de caja" },
];

export type EstadoEmpleado = "activo" | "inactivo";

export type Empleado = {
  id: string;
  nombre: string;
  contrasena: string;
  /** 4 dígitos — login del kiosco de caja (zona E), independiente de la contraseña del panel */
  pin: string;
  estado: EstadoEmpleado;
  permisos: Permiso[];
  fechaAlta: string;
};

// Julián: turno completo (agenda + cobrar + cancelar + clientes).
// Camila: además ayuda en el buffet. Braian: recién arranca, solo
// mira la agenda todavía. Yamila: dada de baja, permisos vencidos
// junto con el acceso — quedan como estaban al momento de la baja,
// no se borran (ver TablaEmpleados).
export const PANEL_EMPLEADOS: Empleado[] = [
  {
    id: "emp-1",
    nombre: "Julián Ibarra",
    contrasena: "cancha2026",
    pin: "1234",
    estado: "activo",
    permisos: ["ver_agenda", "cobrar_turnos", "cancelar_turnos", "ver_clientes"],
    fechaAlta: "2026-05-11",
  },
  {
    id: "emp-2",
    nombre: "Camila Sosa",
    contrasena: "sosa1234",
    pin: "5678",
    estado: "activo",
    permisos: ["ver_agenda", "cobrar_turnos", "ver_clientes", "vender_buffet", "ver_stock_buffet"],
    fechaAlta: "2026-06-03",
  },
  {
    id: "emp-3",
    nombre: "Braian Molina",
    contrasena: "molina99",
    pin: "0000",
    estado: "activo",
    permisos: ["ver_agenda"],
    fechaAlta: "2026-07-20",
  },
  {
    id: "emp-4",
    nombre: "Yamila Duarte",
    contrasena: "duarte22",
    pin: "9999",
    estado: "inactivo",
    permisos: ["ver_agenda", "ver_clientes"],
    fechaAlta: "2026-03-02",
  },
];
