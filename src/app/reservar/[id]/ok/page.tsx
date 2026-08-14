import { redirect } from "next/navigation";

/**
 * Pantalla de confirmación del mock. Ya no tiene contenido propio.
 *
 * No existe GET /api/v1/reservas/{id}: no hay forma de releer una reserva por
 * id, así que esta ruta no podría reconstruir su estado si alguien la abre
 * directo o recarga. El resultado de crear la prereserva se muestra en el
 * propio checkout, con la respuesta de la mutación, y el listado vive en
 * /mis-reservas.
 *
 * Se conserva como redirect por los links viejos.
 */
export default function ReservaConfirmada() {
  redirect("/mis-reservas");
}
