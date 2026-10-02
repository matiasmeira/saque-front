import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

try {
  process.loadEnvFile(path.join(__dirname, "e2e/.env.e2e"));
} catch {
  /* opcional: DB_PASSWORD, DB_USERNAME y JWT_SECRET pueden venir del entorno */
}

const BACK = path.resolve(__dirname, process.env.E2E_BACK_DIR ?? "../sacaladelangulo");
const mvnw = path.join(BACK, process.platform === "win32" ? "mvnw.cmd" : "mvnw");

// El back e2e no hereda perfiles, base ni mails reales del entorno de desarrollo.
const envBack = { ...process.env, RESEND_ENABLED: "false" } as Record<string, string>;
delete envBack.SPRING_PROFILES_ACTIVE;
delete envBack.DB_NAME;
delete envBack.FRONTEND_URL;

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3001",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] }, testMatch: /recarga-panel/ },
  ],
  webServer: [
    {
      command: `"${mvnw}" -q -Dbuild.dir=target-e2e spring-boot:test-run -Dspring-boot.run.main-class=com.matiasmeira.sacaladelangulo.e2e.E2eApplication`,
      cwd: BACK,
      url: "http://localhost:8081/actuator/health",
      timeout: 180_000,
      reuseExistingServer: true,
      env: envBack,
    },
    {
      command: "npx next dev -p 3001",
      url: "http://localhost:3001",
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_PUBLIC_API_URL: "http://localhost:8081",
      } as Record<string, string>,
    },
  ],
});
