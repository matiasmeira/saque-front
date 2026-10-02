import { expect, test, type Page } from "@playwright/test";
import { API } from "./helpers/api";
import { completarAlta } from "./helpers/registro";
import { emailUnico } from "./helpers/usuarios";

// Sin sesión previa: el dueño se registra por la UI y arma el complejo con el wizard.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * georef-ar-api (apis.datos.gob.ar) es un servicio externo del Estado, no la app
 * bajo prueba: se reemplaza por respuestas fijas para que el test no dependa de
 * internet. Sin dirección geocodificada el wizard usa el centroide de la localidad.
 */
async function simularGeoref(page: Page) {
  await page.route("https://apis.datos.gob.ar/georef/api/localidades**", (ruta) =>
    ruta.fulfill({
      json: {
        localidades: [
          {
            id: "0605801001",
            nombre: "Pilar",
            provincia: { nombre: "Buenos Aires" },
            departamento: { nombre: "Pilar" },
            centroide: { lat: -34.4587, lon: -58.9142 },
          },
        ],
      },
    }),
  );
  await page.route("https://apis.datos.gob.ar/georef/api/direcciones**", (ruta) =>
    ruta.fulfill({ json: { direcciones: [] } }),
  );
}

test("dueño nuevo: registro, wizard completo y complejo en revisión", async ({ page, request }) => {
  const nombreComplejo = `Complejo Wizard ${Date.now()}`;
  await simularGeoref(page);

  // Registro de dueño: cae en la bienvenida (wizard).
  await page.goto("/ingresar?tipo=dueno");
  await completarAlta(page, emailUnico("dueno"), "Dueño Wizard E2E");
  await expect(page).toHaveURL(/\/panel\/bienvenida$/);

  // Paso 1 · Identidad (sin fotos: se suben a ImageKit, un servicio externo).
  await expect(page.getByRole("heading", { name: "Identidad del complejo" })).toBeVisible();
  await page.getByLabel("Nombre del complejo").fill(nombreComplejo);
  await page.getByLabel("Dirección").fill("Calle Falsa 123");
  await page.getByRole("combobox").fill("Pilar");
  await page.getByRole("option", { name: /Pilar/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2 · Políticas: acá se crea el complejo en el back.
  await expect(page.getByRole("heading", { name: "Políticas de reserva" })).toBeVisible();
  await page.getByRole("button", { name: "Crear complejo" }).click();

  // Paso 3 · Horarios: "mismo horario todos los días" (09:00 a 23:00).
  await expect(page.getByRole("heading", { name: "Horarios de atención" })).toBeVisible();
  await page.getByRole("radio", { name: /Mismo horario todos los días/ }).check();
  await page.getByRole("button", { name: "Guardar horarios" }).click();

  // Paso 4 · Canchas: una cancha de pádel de 60 minutos.
  await expect(page.getByRole("heading", { name: "Canchas", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nueva cancha" }).click();
  const drawer = page.getByRole("dialog", { name: "Nueva cancha" });
  await drawer.getByLabel("Nombre").fill("Cancha Wizard");
  await drawer.getByRole("button", { name: "Pádel", exact: true }).click();
  await drawer.getByLabel("Precio base para 60 minutos").fill("12000");
  await drawer.getByRole("button", { name: "Guardar" }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByText("Cancha Wizard")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 5 · Tarifas: opcional, sin ninguna rige el precio base.
  await expect(page.getByRole("heading", { name: "Tarifas", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 6 · Verificación: CUIT con dígito verificador válido (módulo 11).
  await expect(page.getByRole("heading", { name: "Verificación", exact: true })).toBeVisible();
  await page.getByLabel("CUIT").fill("20-12345678-6");
  await page.getByLabel("Razón social").fill("Wizard E2E SRL");
  await page.getByLabel("Teléfono de contacto").fill("11 2345 6789");
  await page.getByLabel(/Instagram o Facebook/).fill("https://instagram.com/wizard-e2e");
  await page.getByRole("button", { name: "Enviar a revisión" }).click();

  // Cierre: dice la verdad (a revisión, no "listo") y lleva al panel.
  await expect(page.getByRole("heading", { name: "Enviaste tu complejo a revisión" })).toBeVisible();
  await page.getByRole("button", { name: "Ir al panel" }).click();
  await expect(page).toHaveURL(/\/panel\/agenda$/);
  await expect(page.getByText("Verificación en revisión")).toBeVisible();

  // Contra el back: un complejo, EN_REVISION, con su única cancha.
  const token = await page.evaluate(() => localStorage.getItem("saque:token"));
  const headers = { Authorization: `Bearer ${token}` };
  const mios = await request.get(`${API}/api/v1/establecimientos`, { headers });
  expect(mios.ok()).toBe(true);
  const complejos = (await mios.json()) as { id: number; nombre: string; estadoVerificacion: string }[];
  expect(complejos).toHaveLength(1);
  expect(complejos[0]).toMatchObject({ nombre: nombreComplejo, estadoVerificacion: "EN_REVISION" });
  const canchas = await request.get(`${API}/api/v1/establecimientos/${complejos[0].id}/canchas?incluirInactivas=true`, {
    headers,
  });
  expect(canchas.ok()).toBe(true);
  const lista = (await canchas.json()) as { nombre: string }[];
  expect(lista.map((c) => c.nombre)).toEqual(["Cancha Wizard"]);
});
