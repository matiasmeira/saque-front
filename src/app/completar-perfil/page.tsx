import { redirect } from "next/navigation";

/**
 * Ruta histórica del alta passwordless. El alta real del backend pide
 * contraseña y datos en un único request (CompletarRegistroRequest), así que
 * esos pasos viven ahora dentro de /ingresar y de /verificar, sin navegación
 * intermedia — la contraseña nunca tiene que persistirse entre rutas.
 *
 * Se conserva como redirect y no se borra porque puede haber links viejos
 * (mails ya enviados, historial del navegador) apuntando acá.
 */
export default function CompletarPerfil() {
  redirect("/ingresar");
}
