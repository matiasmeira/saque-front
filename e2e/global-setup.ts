import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { USUARIOS } from "./helpers/usuarios";

const API = "http://localhost:8081";
const ORIGEN_FRONT = "http://localhost:3001";
const ROLES = ["dueno", "duenoVacio", "admin", "jugador"] as const;

/** Un login por rol → storageState con el token donde lo lee src/lib/api/sesion.ts. */
export default async function globalSetup() {
  const dir = path.join(__dirname, ".auth");
  await mkdir(dir, { recursive: true });
  for (const rol of ROLES) {
    const respuesta = await fetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(USUARIOS[rol]),
    });
    if (!respuesta.ok) {
      throw new Error(`Login de ${rol} falló en el back e2e: HTTP ${respuesta.status}`);
    }
    const { token } = (await respuesta.json()) as { token: string };
    const estado = {
      cookies: [],
      origins: [{ origin: ORIGEN_FRONT, localStorage: [{ name: "saque:token", value: token }] }],
    };
    await writeFile(path.join(dir, `${rol}.json`), JSON.stringify(estado));
  }
}
