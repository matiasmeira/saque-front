/**
 * Decide si todavía no se sabe quién es el usuario, y por lo tanto ninguna
 * guardia (por rol o por permiso) puede redirigir.
 *
 * Tres estados distintos que no hay que confundir:
 * - no hidratado: en el primer commit de una carga dura (F5, URL directa)
 *   todos los useSyncExternalStore (useHaySesion, useEmparejado,
 *   useEmpleadoIdSesion) rinden su snapshot de servidor, así que `haySesion`
 *   da `false` aunque haya token. Hoy este chequeo es REDUNDANTE: la carrera
 *   del pendiente 96 (la guardia veía "sin perfil pendiente + rol empleado" y
 *   expulsaba al dueño antes de que llegara GET /me) la cubre `!haySesion` en
 *   guardiaDebeEsperar, y useCajaSinEmpleado da false en ese commit porque
 *   `emparejado` vale false. Se mantiene como red de seguridad por si algún
 *   snapshot de servidor cambia.
 * - hay sesión y GET /me en vuelo: pendiente.
 * - ya hidratado y sin sesión: no pendiente (sigue la redirección normal,
 *   ver destinoSinSesion).
 */
export function perfilPendiente(estado: { hidratado: boolean; haySesion: boolean; perfilCargando: boolean }): boolean {
  if (!estado.hidratado) return true;
  return estado.haySesion && estado.perfilCargando;
}

/**
 * Las guardias de rol/permiso de cada pantalla (las que hacen
 * `router.replace("/panel/agenda")` y parecidas) esperan si el perfil está
 * pendiente O si no hay sesión. Sin sesión no hay rol que juzgar: la
 * redirección la decide GuardSesionPanel (destinoSinSesion). Antes las
 * pantallas también redirigían, sus efectos corren después del de GuardSesionPanel
 * (el layout lo monta antes que a la página) y ganaban ellas: sin sesión se
 * rebotaba entre /panel/agenda y /panel/caja en vez de llegar a /ingresar.
 *
 * Distinto de `perfilPendiente`: useCajaSinEmpleado sí necesita saber que no hay
 * sesión (un dispositivo emparejado sin nadie va a /caja, no a /ingresar).
 */
export function guardiaDebeEsperar(estado: { hidratado: boolean; haySesion: boolean; perfilCargando: boolean }): boolean {
  return perfilPendiente(estado) || !estado.haySesion;
}
