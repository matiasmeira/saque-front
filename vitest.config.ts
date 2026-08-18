import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Cubre las funciones puras de src/lib: las que traducen el contrato del
// backend (src/lib/api) y las que derivan de él algo que la UI necesita, como
// el rango horario de la agenda. Los componentes y hooks se verifican en el
// browser.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
