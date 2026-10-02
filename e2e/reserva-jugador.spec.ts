import { expect, test, type Page } from "@playwright/test";
import { cancelarComoJugador, confirmarComoDueno } from "./helpers/api";
import { mananaISO } from "./helpers/fechas";

test.use({ storageState: "e2e/.auth/jugador.json" });

// Las canchas de los dos complejos del seed se llaman igual y la tarjeta de Mis
// reservas no muestra el complejo: cada test cancela lo que reservó para que la
// próxima corrida (con servidores reusados) no encuentre tarjetas repetidas.
const reservasCreadas: number[] = [];
test.afterEach(async ({ request }) => {
  for (const id of reservasCreadas.splice(0)) await cancelarComoJugador(request, id);
});

type TurnoElegido = { cancha: string; horaInicio: string; horaFin: string };

/** Va a mañana en la grilla pública y elige el primer horario libre. */
async function elegirPrimerHorarioDeManana(page: Page, slug: string): Promise<TurnoElegido> {
  await page.goto(`/complejo/${slug}`);
  await page.getByRole("button", { name: "Día siguiente" }).click();
  const primero = page.getByRole("link", { name: /^Reservar / }).first();
  await expect(primero).toBeVisible();
  const etiqueta = (await primero.getAttribute("aria-label")) ?? "";
  const m = etiqueta.match(/^Reservar (.+) de (\d{2}:\d{2}) a (\d{2}:\d{2})$/);
  if (!m) throw new Error(`Etiqueta de horario inesperada: ${etiqueta}`);
  await primero.click();
  await expect(page).toHaveURL(new RegExp(`/reservar/${slug}\?`));
  // La grilla manda inicio=<ISO> de mañana (hora argentina).
  expect(new URL(page.url()).searchParams.get("inicio")).toContain(mananaISO());
  return { cancha: m[1], horaInicio: m[2], horaFin: m[3] };
}

async function reservar(page: Page): Promise<number> {
  await page.getByRole("button", { name: "Reservar este turno" }).click();
  const creada = page.getByText(/Reserva #\d+ creada/);
  await expect(creada).toBeVisible();
  const id = (await creada.textContent())?.match(/#(\d+)/)?.[1];
  if (!id) throw new Error("No se pudo leer el número de reserva");
  reservasCreadas.push(Number(id));
  return Number(id);
}

function tarjeta(page: Page, t: TurnoElegido) {
  return page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: t.cancha, exact: true }) })
    .filter({ hasText: `${t.horaInicio} a ${t.horaFin}` });
}

test("complejo sin seña: reserva confirmada al instante, aparece en Mis reservas y se cancela", async ({ page }) => {
  const turno = await elegirPrimerHorarioDeManana(page, "e2e-sin-sena");
  await reservar(page);
  await expect(page.getByRole("heading", { name: "¡Reserva confirmada!" })).toBeVisible();

  await page.getByRole("link", { name: "Ver mis reservas" }).click();
  await expect(page).toHaveURL(/\/mis-reservas$/);
  const card = tarjeta(page, turno);
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Confirmada")).toBeVisible();

  await card.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Sí, cancelar" }).click();
  await expect(tarjeta(page, turno)).toHaveCount(0);

  await page.getByRole("button", { name: "Anteriores" }).click();
  await expect(tarjeta(page, turno).getByText("Cancelada").first()).toBeVisible();
});

test("complejo con seña: queda en pre-reserva con cuenta regresiva y el dueño la confirma", async ({ page, request }) => {
  const turno = await elegirPrimerHorarioDeManana(page, "e2e-con-sena");
  const reservaId = await reservar(page);

  await expect(page.getByRole("heading", { name: "Tu turno quedó reservado" })).toBeVisible();
  await expect(page.getByText("Falta confirmar el pago de la seña")).toBeVisible();
  await expect(page.getByText(/Te guardamos el turno del .+ por \d{2}:\d{2}/)).toBeVisible();

  await page.getByRole("link", { name: "Ver mis reservas" }).click();
  const card = tarjeta(page, turno);
  await expect(card.getByText("Pendiente de seña")).toBeVisible();

  // El dueño confirma la seña (no hay botón en el panel: va por la API), bastante
  // antes de los 10 minutos de la pre-reserva.
  await confirmarComoDueno(request, reservaId);

  await page.reload();
  await expect(tarjeta(page, turno).getByText("Confirmada")).toBeVisible();
});
