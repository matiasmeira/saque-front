import { expect, test } from "@playwright/test";

test.use({ storageState: "e2e/.auth/dueno.json" });

test("el dueño entra a la agenda y ve sus complejos", async ({ page }) => {
  await page.goto("/panel/agenda");
  await expect(page).toHaveURL(/\/panel\/agenda$/);
  await expect(page.getByText(/Complejo E2E (Sin|Con) Seña/).first()).toBeVisible();
});
