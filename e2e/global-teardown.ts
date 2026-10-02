import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * `next dev` con distDir propio reescribe next-env.d.ts apuntando a .next-e2e.
 * Lo dejamos como lo deja el dev normal (./.next/dev/types/routes.d.ts) para
 * que nadie tenga que restaurarlo a mano.
 */
export default async function globalTeardown() {
  const archivo = path.join(__dirname, "..", "next-env.d.ts");
  try {
    const actual = await readFile(archivo, "utf8");
    const arreglado = actual.replace(
      /(import ")\.\/\.next-e2e\/dev\/types\/routes\.d\.ts(")/,
      "$1./.next/dev/types/routes.d.ts$2",
    );
    if (arreglado !== actual) await writeFile(archivo, arreglado);
  } catch {
    /* next-env.d.ts es generado y está gitignored: si no existe, no hay nada que restaurar */
  }
}
