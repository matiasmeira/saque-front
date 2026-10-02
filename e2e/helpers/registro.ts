import { expect, type Page } from "@playwright/test";
import { ultimoCodigo } from "./mails";
import { CLAVE_E2E } from "./usuarios";

/** Primer paso de /ingresar: el email. */
export async function pasarEmail(page: Page, email: string) {
  await page.getByLabel("Tu email").fill(email);
  await page.getByRole("button", { name: "Continuar" }).click();
}

/**
 * Alta de cuenta por la UI: email → código del mail (mails.jsonl del back e2e)
 * → contraseña → nombre y teléfono. Cada alta consume 1 de los 10 cupos por IP
 * de /auth/registro/iniciar (10 min).
 */
export async function completarAlta(page: Page, email: string, nombre: string) {
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
