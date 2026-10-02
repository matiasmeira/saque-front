import { expect, test, type Page } from "@playwright/test";

// Regresión del 96: recargar (F5) o entrar por URL directa a una pantalla del
// panel no tiene que redirigir a otra, ni siquiera de paso.

const RUTAS_PANEL = [
  "/panel/clientes",
  "/panel/gastos",
  "/panel/configuracion",
  "/panel/precios",
  "/panel/agenda",
];

/** Registra toda navegación del frame principal (incluidas las de router.replace). */
function registrarNavegaciones(page: Page): string[] {
  const urls: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) urls.push(new URL(frame.url()).pathname);
  });
  return urls;
}

/** Deja pasar los efectos de las guardias, que corren cuando llega GET /me. */
async function esperarAsentado(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

test.describe("dueño", () => {
  test.use({ storageState: "e2e/.auth/dueno.json" });

  for (const ruta of RUTAS_PANEL) {
    test(`recargar ${ruta} no redirige`, async ({ page }) => {
      const navegaciones = registrarNavegaciones(page);
      await page.goto(ruta);
      await esperarAsentado(page);
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));

      navegaciones.length = 0;
      await page.reload();
      await esperarAsentado(page);

      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
      const otrasDelPanel = navegaciones.filter((p) => p !== ruta);
      expect(otrasDelPanel, `pasó por otras rutas al recargar ${ruta}`).toEqual([]);
    });
  }
});

test.describe("admin", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("recargar /admin/ofertas no redirige", async ({ page }) => {
    const navegaciones = registrarNavegaciones(page);
    await page.goto("/admin/ofertas");
    await esperarAsentado(page);
    await expect(page).toHaveURL(/\/admin\/ofertas$/);

    navegaciones.length = 0;
    await page.reload();
    await esperarAsentado(page);

    await expect(page).toHaveURL(/\/admin\/ofertas$/);
    expect(navegaciones.filter((p) => p !== "/admin/ofertas")).toEqual([]);
  });
});

test.describe("sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/panel/clientes manda a /ingresar sin pasar por /panel/caja", async ({ page }) => {
    const navegaciones = registrarNavegaciones(page);
    await page.goto("/panel/clientes");
    await expect(page).toHaveURL(/\/ingresar/);
    await esperarAsentado(page);
    await expect(page).toHaveURL(/\/ingresar/);
    expect(navegaciones).not.toContain("/panel/caja");
  });
});
