import { readFile } from "node:fs/promises";
import path from "node:path";

type Mail = { destinatario: string; codigo: string | null; links: string[] };

function archivoMails(): string {
  const back = path.resolve(__dirname, "../..", process.env.E2E_BACK_DIR ?? "../sacaladelangulo");
  return path.join(back, "target-e2e", "mails.jsonl");
}

async function leerMails(): Promise<Mail[]> {
  try {
    const texto = await readFile(archivoMails(), "utf8");
    return texto
      .split("\n")
      .filter((linea) => linea.trim() !== "")
      .map((linea) => JSON.parse(linea) as Mail);
  } catch {
    return [];
  }
}

/** Código del ÚLTIMO mail enviado a `email`. Espera hasta 10 s a que llegue. */
export async function ultimoCodigo(email: string): Promise<string> {
  const limite = Date.now() + 10_000;
  while (Date.now() < limite) {
    const propios = (await leerMails()).filter((m) => m.destinatario === email);
    const codigo = propios.at(-1)?.codigo;
    if (codigo) return codigo;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No llegó ningún mail con código para ${email} en ${archivoMails()}`);
}
