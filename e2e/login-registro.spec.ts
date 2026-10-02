import { expect, test, type Page } from "@playwright/test";
import { ultimoCodigo } from "./helpers/mails";
import { CLAVE_E2E, USUARIOS, emailUnico } from "./helpers/usuarios";

// Sin sesión previa: estos tests recorren /ingresar de punta a punta.
test.use({ storageState: { cookies: [], origins: [] } });

async function pasarEmail(page: Page, email: string) {
  await page.getByLabel("Tu email").fill(email);
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function tokenGuardado(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem("saque:token"));
}

// Cada pasada por el email consume 1 de los 10 cupos por IP de /auth/registro/iniciar
// (10 min) y 1 por minuto por email: por eso un solo ingreso por usuario del seed.
const ingresos = [
  { rol: "dueño", usuario: USUARIOS.dueno, destino: /\/panel\/agenda$/ },
  { rol: "admin", usuario: USUARIOS.admin, destino: /\/admin\/ofertas$/ },
  { rol: "jugador", usuario: USUARIOS.jugador, destino: /\/$/ },
];

for (const { rol, usuario, destino } of ingresos) {
  test(`ingreso del ${rol} lleva a su pantalla`, async ({ page }) => {
    await page.goto("/ingresar");
    await pasarEmail(page, usuario.email);
    await expect(page.getByRole("heading", { name: "Ingresá tu contraseña" })).toBeVisible();
    if (rol === "jugador") {
      // Contraseña incorrecta: error visible y sin sesión; después la correcta, en el mismo paso.
      await page.getByLabel("Contraseña").fill("Esta-no-es-1!");
      await page.getByRole("button", { name: "Ingresar" }).click();
      await expect(page.locator("main").getByRole("alert")).toBeVisible();
      await expect(page).toHaveURL(/\/ingresar/);
      expect(await tokenGuardado(page)).toBeNull();
    }
    await page.getByLabel("Contraseña").fill(usuario.password);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(destino);
    expect(await tokenGuardado(page)).toBeTruthy();
  });
}

test("email sin cuenta arranca el alta: pide el código del mail", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  const respuestas500: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 500) respuestas500.push(`${r.status()} ${r.url()}`);
  });

  const email = emailUnico("inexistente");
  await page.goto("/ingresar");
  await pasarEmail(page, email);

  await expect(page.getByRole("heading", { name: "Revisá tu email" })).toBeVisible();
  await expect(page.getByLabel("Código")).toBeVisible();
  expect(await ultimoCodigo(email)).toMatch(/^\d{6}$/);
  expect(respuestas500).toEqual([]);
  expect(errores).toEqual([]);
});

async function completarAlta(page: Page, email: string, nombre: string) {
  await pasarEmail(page, email);
  await expect(page.getByRole("heading", { name: "Revisá tu email" })).toBeVisible();
  await page.getByLabel("Código").fill(await ultimoCodigo(email));
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Elegí una contraseña" })).toBeVisible();
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE_E2E);
  await page.getByLabel("Repetila").fill(CLAVE_E2E);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Contanos quién sos" })).toBeVisible();
  await page.getByLabel("Nombre y apellido").fill(nombre);
  await page.getByLabel(/Teléfono/).fill("11 5555 1234");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

test("registro de jugador en pasos: código, contraseña y datos", async ({ page }) => {
  await page.goto("/ingresar");
  await completarAlta(page, emailUnico("jugador"), "Jugador E2E Nuevo");
  await expect(page).toHaveURL(/\/$/);
  expect(await tokenGuardado(page)).toBeTruthy();
  // Logueado de verdad: una pantalla que exige sesión no lo manda a ingresar.
  await page.goto("/mis-reservas");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/mis-reservas$/);
});

test("registro de dueño termina en el panel nuevo", async ({ page }) => {
  await page.goto("/ingresar?tipo=dueno");
  await expect(page.getByRole("heading", { name: "Creá tu cuenta de dueño" })).toBeVisible();
  await completarAlta(page, emailUnico("dueno"), "Dueño E2E Nuevo");
  await expect(page).toHaveURL(/\/panel\//);
  expect(await tokenGuardado(page)).toBeTruthy();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/panel\/bienvenida$/);
});
