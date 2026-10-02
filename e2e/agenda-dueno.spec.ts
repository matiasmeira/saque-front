import { expect, test, type Page } from "@playwright/test";

async function irAAgendaDeManana(page: Page, complejo: string) {
  await page.goto("/panel/agenda");
  const selector = page.locator("#selector-establecimiento");
  await expect(selector).toBeVisible();
  await selector.click();
  await page.getByRole("option", { name: complejo }).click();
  await expect(selector).toContainText(complejo);
  await page.getByRole("button", { name: "Fecha siguiente" }).click();
}

test.describe("dueño con complejos", () => {
  test.use({ storageState: "e2e/.auth/dueno.json" });

  test("alta manual de un turno, detalle con acciones de hoy deshabilitadas y cancelación", async ({ page }) => {
    const nombre = `Cliente E2E ${Date.now()}`;
    await irAAgendaDeManana(page, "Complejo E2E Sin Seña");

    // Alta: "Nuevo turno" → primer horario libre que ofrece el formulario.
    await page.getByRole("button", { name: "Nuevo turno" }).click();
    const form = page.getByRole("dialog");
    await form.getByLabel("Nombre").fill(nombre);
    await form.getByLabel("Teléfono").fill("11 5555-4444");
    await form.getByRole("button", { name: "Guardar turno" }).click();

    // El turno aparece en la timeline con ese nombre.
    const turno = page.getByRole("button", { name: new RegExp(`^${nombre},`) });
    await expect(turno).toBeVisible();

    // Detalle: el turno es de mañana, así que cobrar y marcar ausente todavía no se habilitan.
    await turno.click();
    await expect(page.getByRole("button", { name: "Cobrar y cerrar turno" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Marcar ausente" })).toBeDisabled();
    await expect(page.getByText(/Se habilitan cuando empieza el turno/)).toBeVisible();

    // Cancelar el turno: la agenda hoy lo saca de la timeline (no lo dibuja como cancelado).
    await page.getByRole("button", { name: "Cancelar turno" }).click();
    await expect(page.getByRole("button", { name: new RegExp(`^${nombre},`) })).toHaveCount(0);
  });
});

test.describe("dueño sin canchas", () => {
  test.use({ storageState: "e2e/.auth/duenoVacio.json" });

  test("Nuevo turno y Turno fijo están deshabilitados con 'Cargá una cancha primero'", async ({ page }) => {
    await page.goto("/panel/agenda");
    const nuevo = page.getByRole("button", { name: "Nuevo turno" });
    const fijo = page.getByRole("button", { name: "Turno fijo" });
    await expect(nuevo).toBeDisabled();
    await expect(fijo).toBeDisabled();
    await expect(nuevo).toHaveAttribute("title", "Cargá una cancha primero");
    await expect(fijo).toHaveAttribute("title", "Cargá una cancha primero");
    await expect(page.getByText("Cargá una cancha primero")).toHaveCount(1); // el texto sr-only, compartido
  });
});

