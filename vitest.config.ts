import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Solo cubre la capa de API (src/lib/api): funciones puras que traducen el
// contrato del backend. Los componentes y hooks se verifican en el browser.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/api/**/*.test.ts"],
  },
});
