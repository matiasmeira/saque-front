import { expect, test } from "@playwright/test";
import { API } from "./helpers/api";
import { ultimoCodigo } from "./helpers/mails";
import { CLAVE_E2E, emailUnico } from "./helpers/usuarios";

// Pendiente 86: se activa (quitar los fixme) cuando exista
// POST /usuarios/me/convertir-en-dueno en el back.
// No usa jugador.e2e@canche.test: otros specs dependen de que siga siendo PLAYER.
test.describe("convertir la cuenta en cuenta de dueño", () => {
  test.describe("jugador nuevo", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.fixme("se convierte en dueño con el mismo token", async ({ page }) => {
      const email = emailUnico("jugador-convierte");

      // 1. Registrar un jugador nuevo por /ingresar.
      await page.goto("/ingresar");
      await page.getByLabel("Tu email").fill(email);
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel("Código").fill(await ultimoCodigo(email));
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE_E2E);
      await page.getByLabel("Repetila").fill(CLAVE_E2E);
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel("Nombre y apellido").fill("Jugador Convierte E2E");
      await page.getByLabel(/Teléfono/).fill("11 5555 1234");
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await expect(page).toHaveURL(/\/$/);
      const token = await page.evaluate(() => localStorage.getItem("saque:token"));
      expect(token).toBeTruthy();

      // 2. /perfil -> tarjeta -> diálogo -> convertir.
      await page.goto("/perfil");
      await expect(page.getByRole("heading", { name: "¿Tenés un complejo?" })).toBeVisible();
      await page.getByRole("button", { name: "Registrar mi complejo" }).click();
      await expect(
        page.getByRole("dialog", { name: "¿Convertir tu cuenta en cuenta de dueño?" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Convertir mi cuenta" }).click();

      // 3. Cae en el paso 1 del wizard.
      await expect(page).toHaveURL(/\/panel\/bienvenida$/);

      // 4. El MISMO token ahora es OWNER en TRIAL.
      const respuesta = await page.request.get(`${API}/api/v1/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(await respuesta.json()).toMatchObject({ rol: "OWNER", planSuscripcion: "TRIAL" });

      // 5. Recargar /perfil: ya no ofrece la conversión.
      await page.goto("/perfil");
      await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "¿Tenés un complejo?" })).toHaveCount(0);
    });
  });

  test.describe("dueño del seed", () => {
    test.use({ storageState: "e2e/.auth/dueno.json" });

    test.fixme("no ve la tarjeta en /perfil", async ({ page }) => {
      await page.goto("/perfil");
      await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "¿Tenés un complejo?" })).toHaveCount(0);
    });
  });
});
