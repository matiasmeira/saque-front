import { redirect } from "next/navigation";

/**
 * El alta de dueño es el mismo flujo que el de jugador (con verificación de
 * mail) en modo dueño. Se mantiene la ruta para los links de la landing y los
 * bookmarks.
 */
export default function RegistroDueno() {
  redirect("/ingresar?tipo=dueno");
}
