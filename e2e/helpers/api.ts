import { readFile } from "node:fs/promises";
import path from "node:path";
import type { APIRequestContext } from "@playwright/test";

export const API = "http://localhost:8081";

/** JWT guardado por el global-setup para un rol (e2e/.auth/<rol>.json). */
export async function tokenDe(rol: "dueno" | "admin" | "jugador"): Promise<string> {
  const archivo = path.join(__dirname, "..", ".auth", `${rol}.json`);
  const estado = JSON.parse(await readFile(archivo, "utf8")) as {
    origins: { localStorage: { name: string; value: string }[] }[];
  };
  const token = estado.origins[0]?.localStorage.find((i) => i.name === "saque:token")?.value;
  if (!token) throw new Error(`No hay token de ${rol} en ${archivo}`);
  return token;
}

/**
 * Confirma una pre-reserva como dueño: PUT /reservas/{id}/confirmar.
 * La UI del panel todavía no tiene un botón para esto, así que el test lo hace
 * por la API con la sesión del dueño.
 */
export async function confirmarComoDueno(request: APIRequestContext, reservaId: number) {
  const respuesta = await request.put(`${API}/api/v1/reservas/${reservaId}/confirmar`, {
    headers: { Authorization: `Bearer ${await tokenDe("dueno")}` },
  });
  if (!respuesta.ok()) {
    throw new Error(`No se pudo confirmar la reserva ${reservaId}: HTTP ${respuesta.status()}`);
  }
}

/** Limpieza de un test: cancela una reserva del jugador; si ya estaba cancelada no pasa nada. */
export async function cancelarComoJugador(request: APIRequestContext, reservaId: number) {
  await request.put(`${API}/api/v1/reservas/${reservaId}/cancelar`, {
    headers: { Authorization: `Bearer ${await tokenDe("jugador")}` },
  });
}
