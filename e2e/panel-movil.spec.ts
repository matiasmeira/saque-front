import { expect, test, type Page } from "@playwright/test";
import { API, tokenDe } from "./helpers/api";
import { desbordes } from "./helpers/layout";

// El panel del dueño a 390 px de ancho, con toque (el proyecto "movil" usa un Pixel 7: 412 px).
test.use({ storageState: "e2e/.auth/dueno.json", viewport: { width: 390, height: 844 } });

async function elegirComplejo(page: Page, complejo: string) {
  const selector = page.locator("#selector-establecimiento");
  await expect(selector).toBeVisible();
  await selector.click();
  await page.getByRole("option", { name: complejo }).click();
  await expect(selector).toContainText(complejo);
}

/** El contenedor de la timeline: el único de la agenda con scroll propio por debajo de lg. */
function timeline(page: Page) {
  return page.locator("div[style*='--col-min']");
}

test("canchas: cada cancha es una tarjeta con Editar a mano y nada desborda", async ({ page }) => {
  await page.goto("/panel/canchas");
  await elegirComplejo(page, "Complejo E2E Sin Seña");
  await expect(page.getByText("Cancha 1", { exact: true })).toBeVisible();

  // Tarjetas apiladas, con las etiquetas que en escritorio ponen las columnas de la tabla.
  const etiquetas = page.getByText("Precio / seña").filter({ visible: true }); // la cabecera de la tabla está oculta
  await expect(etiquetas).toHaveCount(2);
  await expect(page.getByText("Acciones")).toBeHidden();
  const editar = page.getByRole("button", { name: /^Editar Cancha/ });
  await expect(editar).toHaveCount(2);
  const cajas = await Promise.all([0, 1].map((i) => editar.nth(i).boundingBox()));
  for (const caja of cajas) {
    expect(caja).not.toBeNull();
    expect(caja!.x).toBeGreaterThanOrEqual(0);
    expect(caja!.x + caja!.width).toBeLessThanOrEqual(390);
  }
  expect(cajas[1]!.y).toBeGreaterThan(cajas[0]!.y + cajas[0]!.height); // una debajo de la otra

  expect(await desbordes(page)).toEqual([]);

  // Editar es tocable y abre la edición.
  await editar.first().tap();
  await expect(page.getByRole("dialog", { name: "Editar cancha" })).toBeVisible();
  await expect(page.getByLabel("Nombre")).toHaveValue("Cancha 1");
});

test("agenda: turno en la timeline, cabecera fija, scroll en ambos ejes y detalle con toque", async ({ page }) => {
  const nombre = `Cliente Móvil ${Date.now()}`;
  await page.goto("/panel/agenda");
  await elegirComplejo(page, "Complejo E2E Sin Seña");
  await page.getByRole("button", { name: "Fecha siguiente" }).click();

  // Alta de un turno de mañana.
  await page.getByRole("button", { name: "Nuevo turno" }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Nombre").fill(nombre);
  await form.getByLabel("Teléfono").fill("11 5555-4444");
  await form.getByRole("button", { name: "Guardar turno" }).click();
  const turno = page.getByRole("button", { name: new RegExp(`^${nombre},`) });
  await expect(turno).toBeVisible();

  // Con 2 canchas en vista día las columnas entran en 390 px: no hay scroll horizontal.
  const cuadro = timeline(page);
  const medidas = () =>
    cuadro.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }));
  const dia = await medidas();
  expect(dia.sw).toBeLessThanOrEqual(dia.cw);
  expect(dia.sh).toBeGreaterThan(dia.ch); // la timeline es más alta que su ventana

  // Scroll vertical real (rueda sobre la timeline): la cabecera de canchas queda pegada arriba.
  const caja = (await cuadro.boundingBox())!;
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => cuadro.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const cabecera = page.getByText("Cancha 1", { exact: true });
  await expect(cabecera).toBeInViewport();
  const cajaCabecera = (await cabecera.boundingBox())!;
  expect(Math.abs(cajaCabecera.y - caja.y)).toBeLessThan(20); // dentro del borde superior de la timeline
  await expect(turno).not.toBeInViewport(); // el turno de las 8:00 ya salió, la cabecera no
  await page.mouse.wheel(0, -1000);
  await expect.poll(() => cuadro.evaluate((el) => el.scrollTop)).toBe(0);

  // Vista semana: 7 columnas no entran, hay scroll horizontal y la columna de horas queda fija.
  await page.getByRole("button", { name: "Semana", exact: true }).click();
  await expect.poll(async () => (await medidas()).sw).toBeGreaterThan((await medidas()).cw);
  const cajaSemana = (await cuadro.boundingBox())!;
  await page.mouse.move(cajaSemana.x + cajaSemana.width / 2, cajaSemana.y + cajaSemana.height / 2);
  await page.mouse.wheel(300, 0);
  await expect.poll(() => cuadro.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(page.getByText("09:00", { exact: true }).first()).toBeInViewport();
  await page.getByRole("button", { name: "Día", exact: true }).click();

  // Tocar el turno abre el detalle.
  await turno.tap();
  await expect(page.getByRole("button", { name: "Cancelar turno" })).toBeVisible();
  await expect(page.getByText(nombre).first()).toBeVisible();
  expect(await desbordes(page)).toEqual([]);

  // Limpieza: cancelar el turno.
  await page.getByRole("button", { name: "Cancelar turno" }).tap();
  await expect(page.getByRole("button", { name: new RegExp(`^${nombre},`) })).toHaveCount(0);
});

test("header: un nombre de complejo larguísimo no desborda", async ({ page, request }) => {
  const nombreLargo = "Complejo Deportivo y Social Club Atlético Los Tres Pinos de la Ribera Norte E2E";
  const headers = { Authorization: `Bearer ${await tokenDe("dueno")}` };
  // El seed no tiene un nombre largo y el dueño tiene 2 de 3 cupos: se crea uno y se elimina al final.
  const creado = await request.post(`${API}/api/v1/establecimientos`, {
    headers,
    data: {
      nombre: nombreLargo,
      direccion: "Av. Siempreviva 742, Buenos Aires",
      latitud: -34.6037,
      longitud: -58.3816,
      requiereSena: false,
      requiereTelefonoVerificado: false,
      horariosAtencion: [],
      servicios: [],
    },
  });
  expect(creado.status()).toBe(201);
  const { id } = (await creado.json()) as { id: number };
  try {
    await page.goto("/panel/agenda");
    await elegirComplejo(page, nombreLargo);
    await expect(page.getByText("Sin horarios cargados")).toBeVisible(); // las píldoras de estado también están

    const header = page.locator("header");
    const cajaHeader = (await header.boundingBox())!;
    expect(cajaHeader.width).toBeLessThanOrEqual(390);
    const selector = (await page.locator("#selector-establecimiento").boundingBox())!;
    expect(selector.x + selector.width).toBeLessThanOrEqual(390);
    expect(await desbordes(page)).toEqual([]);
  } finally {
    await request.patch(`${API}/api/v1/establecimientos/${id}/estado`, { headers, data: { activo: false } });
    const baja = await request.delete(`${API}/api/v1/establecimientos/${id}`, { headers });
    expect(baja.status(), "limpieza del complejo de prueba").toBe(204);
  }
});
