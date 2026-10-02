import { expect, test } from "@playwright/test";

test.use({ storageState: "e2e/.auth/dueno.json" });

test("una cuenta de dueño ve el aviso en la ficha y no se le ofrece reservar", async ({ page }) => {
  await page.goto("/complejo/e2e-sin-sena");
  await expect(
    page.getByText("Las reservas son para cuentas de jugador. Para reservar, ingresá con una cuenta de jugador."),
  ).toBeVisible();
  // Con la grilla ya cargada: hay horarios libres, pero ninguno es un link "Reservar ...".
  await expect(page.getByLabel(/: libre de \d{2}:\d{2} a \d{2}:\d{2}/).first()).toBeAttached();
  await expect(page.getByRole("link", { name: /^Reservar / })).toHaveCount(0);
});
