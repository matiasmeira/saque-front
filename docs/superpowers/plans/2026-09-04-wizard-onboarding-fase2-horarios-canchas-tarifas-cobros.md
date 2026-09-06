# Wizard de onboarding — Fase 2 (Horarios, Canchas, Tarifas, Cobros) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el wizard de onboarding de complejos (ya en producción con Fase 1: Identidad + Políticas) para cubrir los 4 pasos restantes — Horarios, Canchas, Tarifas y Cobros — reutilizando los formularios ya existentes del panel, y mover la pantalla de éxito al final del flujo de 6 pasos en vez de mostrarla tras el paso 2.

**Architecture:** Cada paso nuevo es un componente presentacional propio (mismo patrón que `PasoIdentidad`/`PasoPoliticas`: recibe datos y callbacks por props, no conoce TanStack Query) que envuelve un formulario ya existente del panel (`FormHorariosAtencion`, `FormCancha`, `FormTarifa`, `ListaTarifas`) sin reescribir su lógica de validación. Toda la orquestación de red vive en `useWizardOnboarding`, que se extiende (no se reescribe desde cero) para llevar `pasoActual` de `1|2` a `1|2|3|4|5|6` y agregar las mutaciones de cada paso nuevo. El establecimiento ya existe desde el paso 2 (Fase 1) — Horarios lo actualiza con `PUT` completo, Canchas y Tarifas usan los mismos endpoints y adaptadores que `panel/canchas` y `panel/precios`, y Cobros consume una convención de endpoints de MercadoPago que todavía no existe en el backend (a confirmar cuando esté listo — ver Ruling 3).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query v5, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-02-wizard-onboarding-complejo-design.md` (secciones 3 — Paso 3 a Paso 6 —, 4, 7, 9). El plan de Fase 1 (`docs/superpowers/plans/2026-09-03-wizard-onboarding-fase1-identidad-politicas.md`) ya implementó Identidad + Políticas — este plan continúa desde ahí, sobre `feat/conexion-backend` commit `1040d12`.

## Global Constraints

- Todo el texto visible es en español (AGENTS.md del repo).
- Reutilizar componentes existentes tal cual, sin reescribir su validación: `FormHorariosAtencion`, `FormCancha`, `PrecioBaseCancha` (con la excepción documentada en Ruling 2), `ListaTarifas`, `FormTarifa`, y los adaptadores `src/lib/api/adaptadores/canchas.ts` y `src/lib/api/tarifas.ts`.
- Sistema de diseño: tokens de `globals.css` (`tinta`, `grafito`, `azul`, `azul-oscuro`, `celeste`, `celeste-suave`, `humo`, `borde`, `disponible`/`disponible-suave`, `cancelado`, `rounded-card`/`rounded-input`, `shadow-card`), íconos `lucide-react`. Nunca la paleta ni los íconos Material Symbols de los mockups de Stitch.
- Nunca usar `Date.prototype.toISOString()` para mandar fechas/horas al backend — usar las conversiones de `src/lib/api/fechas.ts` (`aHoraBack`, `aFechaHora`, etc.), igual que el resto del proyecto.
- `EstablecimientoRequest.horariosAtencion` NO tiene semántica de "no modificar": un `PUT` sin esa clave BORRA los horarios existentes. Todo `PUT /establecimientos/{id}` de este plan manda el objeto completo (nombre, dirección, latitud, longitud, requiereSena, requiereTelefonoVerificado, horariosAtencion) y omite `servicios` (para no pisarlo — semántica de 3 estados: ausente = no modificar).
- Las tarifas viajan DENTRO de `CanchaRequest` (no hay endpoint granular): cambiar una tarifa es un `PUT` completo de la cancha vía `endpointCanchas.actualizar`.
- Fuera de alcance de este plan (igual que Fase 1): días no laborables/excepciones de horario, downgrade automático TRIAL→FREE, wiring de política de cancelación en `panel/configuracion`.
- Tests: solo para lógica pura en `src/lib/` (Vitest, sin React Testing Library — no está instalado en el repo). Los hooks de React y los componentes de este plan se verifican por `tsc --noEmit`, `npm run build`, y verificación manual/en vivo — igual que Fase 1, que no tiene tests de componentes.

## Rulings (decisiones tomadas al escribir este plan, sin bloquear en preguntas)

1. **Contrato de MercadoPago (pregunta abierta #2 de la spec):** se usa la convención ya propuesta en la spec §3/Paso 6 tal cual — `GET /api/v1/establecimientos/{id}/mercadopago/oauth/iniciar` → `{ urlAutorizacion }` y `GET /api/v1/establecimientos/{id}/mercadopago` → `{ conectado, cuenta }`. Es un contrato asumido: cuando el backend real exista, si difiere, es un cambio de una sola función (`src/lib/api/endpoints/mercadopago.ts`), no del resto del wizard.
2. **`PrecioBaseCancha` en el paso 5 (pregunta de diseño, no en la spec original):** el componente `PrecioBaseCancha` existente SIEMPRE es editable (tiene su propio botón "Guardar cambios", sin prop de solo-lectura). La spec pide que en el paso 5 se muestre de sólo lectura. En vez de agregar una prop `soloLectura` a un componente compartido con `panel/precios` (que sí necesita que sea editable), el paso 5 renderiza un bloque estático propio con el mismo dato (`cancha.preciosBase`), sin reutilizar el componente `PrecioBaseCancha`. `ListaTarifas` y `FormTarifa` sí se reutilizan sin cambios.
3. **Estado "Conectado" de MercadoPago (pregunta abierta #3 de la spec):** dentro del wizard, el estado conectado es sólo informativo (ícono + nombre de cuenta), sin botón de desconectar. No existe ningún endpoint de desconexión ni en la spec ni en el backend, y desconectar una cuenta a mitad del alta no aporta al flujo de onboarding — esa gestión completa (desconectar, reconectar) queda para `panel/configuracion` en un trabajo aparte, no para este wizard.
4. **Navegación "Atrás" una vez creado el establecimiento:** desde el paso 3 en adelante, "Atrás" nunca vuelve a los pasos 1 o 2. El paso 2 ya crea el establecimiento con una mutación que sólo hace el `POST` la primera vez (`establecimientoRef.current`); si el dueño pudiera volver al paso 1, cambiar el nombre y volver a confirmar el paso 2, ese cambio de nombre nunca llegaría al backend (el `POST` se saltea) — es la misma razón por la que `PasoPoliticas` ya deshabilita su "Atrás" una vez que hay `establecimientoParcial` con error parcial. El paso 3 (Horarios) directamente no tiene botón "Atrás". Los pasos 4, 5 y 6 sí lo tienen, pero sólo navegan entre sí (4→3, 5→4, 6→5), nunca antes del paso 3.
5. **Bloqueos de mantenimiento en el paso 4:** `FormCancha` muestra la sección de bloqueos siempre que `cancha !== null` (o sea, al editar una cancha ya creada) — es parte de "reutilizar tal cual". Se conecta igual que `panel/canchas`: alta/baja de bloqueo pega directo contra el backend y refresca la lista de bloqueos de la cancha en edición.
6. **"Publicar complejo" (paso 6):** no dispara ningún request nuevo. Todo lo que existe (identidad, políticas, horarios, canchas, tarifas, conexión de MercadoPago) ya se guardó contra el backend en cuanto se confirmó cada paso — "Publicar" es una transición de estado local (`publicado = true`) que muestra la pantalla de éxito, tal como lo describe la spec ("`publicarComplejo()` queda muy liviano... en el peor caso hace un refetch final").
7. **`FormCancha` no queda 100% "sin tocar" (conflicto entre la spec §9 y §3):** la spec lista `FormCancha` entre los componentes que "se reutilizan tal cual (sin tocar)" (§9), pero también exige, específicamente para el paso 4, que la seña de una cancha nueva se prellene con `politicas.montoSenaDefault` (§3, Paso 4) — algo que `FormCancha` no soporta hoy (hardcodea `0` para `cancha === null`). Gana la instrucción más específica (§3, el comportamiento pedido para ESE paso) sobre la más general (§9, un resumen). Task 4 agrega una única prop opcional (`montoSenaSugerido?: number`, usada sólo cuando `cancha === null`) — compatible hacia atrás, `panel/canchas` sigue sin pasarla y su comportamiento no cambia.

---

### Task 1: Lógica pura del wizard — gate de canchas y patrón rápido de horarios

**Files:**
- Modify: `src/lib/panel/wizard-onboarding.ts`
- Test: `src/lib/panel/wizard-onboarding.test.ts`

**Interfaces:**
- Consumes: `HorarioAtencionDto` y `DiaSemanaBack` de `@/lib/api/tipos/comunes` / `@/lib/api/fechas`; `CanchaResponse` de `@/lib/api/tipos/canchas`.
- Produces: `validarPasoCanchas(canchas, requiereSena): ErroresCampo` (consumida por Task 4 / `PasoCanchas`), `PatronHorario` y `horariosDelPatron(patron, base): HorarioAtencionDto[]` (consumidos por Task 3 / `PasoHorarios`).

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `src/lib/panel/wizard-onboarding.test.ts`:

```ts
describe("validarPasoCanchas", () => {
  const cancha = (montoSena: number | null): CanchaResponse => ({
    id: 1,
    nombre: "Cancha 1",
    deportes: ["PADEL"],
    isActive: true,
    establecimientoId: 1,
    precioBase: 1000,
    montoSena,
    duracionesPermitidas: [60],
    preciosPorDuracion: { "60": 1000 },
    permiteInicioMediaHora: false,
    tarifas: [],
    canchasFisicasIds: [],
    cantidadCanchasNecesarias: null,
  });

  it("sin canchas, siempre falla sin importar la seña", () => {
    expect(validarPasoCanchas([], false)).toEqual({
      canchas: "Cargá al menos una cancha para continuar.",
    });
    expect(validarPasoCanchas([], true)).toEqual({
      canchas: "Cargá al menos una cancha para continuar.",
    });
  });

  it("con canchas y sin seña obligatoria, no hace falta monto de seña", () => {
    expect(validarPasoCanchas([cancha(0)], false)).toEqual({});
  });

  it("con seña obligatoria, exige al menos una cancha con montoSena > 0", () => {
    expect(validarPasoCanchas([cancha(0), cancha(null)], true)).toEqual({
      sena: "Con seña obligatoria, al menos una cancha necesita un monto de seña mayor a 0.",
    });
  });

  it("con seña obligatoria y alguna cancha con seña > 0, no hay error", () => {
    expect(validarPasoCanchas([cancha(0), cancha(1500)], true)).toEqual({});
  });
});

describe("horariosDelPatron", () => {
  const base: HorarioAtencionDto[] = [
    { diaSemana: "MONDAY", horaApertura: "08:00:00", horaCierre: "22:00:00" },
  ];

  it("'dia-por-dia' devuelve la base sin tocarla", () => {
    expect(horariosDelPatron("dia-por-dia", base)).toBe(base);
  });

  it("'mismo' pone los 7 días con el horario del primero de la base", () => {
    const resultado = horariosDelPatron("mismo", base);
    expect(resultado).toHaveLength(7);
    expect(resultado.every((h) => h.horaApertura === "08:00:00" && h.horaCierre === "22:00:00")).toBe(true);
    expect(resultado.map((h) => h.diaSemana).sort()).toEqual(
      ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].sort(),
    );
  });

  it("'mismo' sin base usa el default 09:00-23:00", () => {
    const resultado = horariosDelPatron("mismo", []);
    expect(resultado.every((h) => h.horaApertura === "09:00:00" && h.horaCierre === "23:00:00")).toBe(true);
  });

  it("'semana-finde' separa lunes a viernes del fin de semana", () => {
    const resultado = horariosDelPatron("semana-finde", base);
    const entreSemana = resultado.filter((h) => !["SATURDAY", "SUNDAY"].includes(h.diaSemana));
    const finde = resultado.filter((h) => ["SATURDAY", "SUNDAY"].includes(h.diaSemana));
    expect(entreSemana).toHaveLength(5);
    expect(finde).toHaveLength(2);
    expect(entreSemana.every((h) => h.horaApertura === "08:00:00" && h.horaCierre === "22:00:00")).toBe(true);
    expect(finde.every((h) => h.horaApertura === "10:00:00" && h.horaCierre === "20:00:00")).toBe(true);
  });
});
```

Agregar el import correspondiente al principio del archivo de test:

```ts
import type { CanchaResponse } from "@/lib/api/tipos/canchas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- wizard-onboarding`
Expected: FAIL — `validarPasoCanchas` y `horariosDelPatron` no existen todavía.

- [ ] **Step 3: Implementar**

Agregar al final de `src/lib/panel/wizard-onboarding.ts` (después de `validarPasoPoliticas`), y agregar los imports que hagan falta al principio del archivo:

```ts
import type { DiaSemanaBack } from "@/lib/api/fechas";
import type { CanchaResponse } from "@/lib/api/tipos/canchas";
import type { HorarioAtencionDto, Servicio } from "@/lib/api/tipos/comunes";
```

(el import de `Servicio` ya existe — no duplicarlo, sólo agregar `DiaSemanaBack` y `CanchaResponse`).

```ts
/**
 * Paso 4 — Canchas. No hay llamada al backend al confirmar: cada cancha ya se
 * creó individualmente al agregarla (ver useWizardOnboarding). Esto sólo
 * valida que haya al menos una, y — si el plan fuerza seña — que al menos una
 * cobre algo, igual que exige CanchaService.validarMontoSena en el backend.
 */
export function validarPasoCanchas(canchas: CanchaResponse[], requiereSena: boolean): ErroresCampo {
  const errores: ErroresCampo = {};
  if (canchas.length === 0) {
    errores.canchas = "Cargá al menos una cancha para continuar.";
    return errores;
  }
  if (requiereSena && !canchas.some((c) => (c.montoSena ?? 0) > 0)) {
    errores.sena = "Con seña obligatoria, al menos una cancha necesita un monto de seña mayor a 0.";
  }
  return errores;
}

/**
 * Paso 3 — Horarios. Los 3 radios de patrón rápido que Stitch mockeó y
 * `FormHorariosAtencion` no tiene: son sólo una PRE-CARGA del valor inicial
 * con el que ese formulario arranca (se remonta vía `key={patron}` — ver
 * PasoHorarios) — la validación y el guardado se heredan sin tocarlos, así
 * que nada impide seguir editando una fila suelta después de elegir un
 * patrón.
 */
export type PatronHorario = "mismo" | "semana-finde" | "dia-por-dia";

const DEFAULT_APERTURA = "09:00:00";
const DEFAULT_CIERRE = "23:00:00";
const DEFAULT_APERTURA_FINDE = "10:00:00";
const DEFAULT_CIERRE_FINDE = "20:00:00";

const DIAS_SEMANA_BACK: DiaSemanaBack[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DIAS_FINDE_BACK: DiaSemanaBack[] = ["SATURDAY", "SUNDAY"];

export function horariosDelPatron(patron: PatronHorario, base: HorarioAtencionDto[]): HorarioAtencionDto[] {
  if (patron === "dia-por-dia") return base;

  const referencia = base[0] ?? { horaApertura: DEFAULT_APERTURA, horaCierre: DEFAULT_CIERRE };

  if (patron === "mismo") {
    return DIAS_SEMANA_BACK.map((diaSemana) => ({
      diaSemana,
      horaApertura: referencia.horaApertura,
      horaCierre: referencia.horaCierre,
    }));
  }

  return DIAS_SEMANA_BACK.map((diaSemana) => {
    const esFinde = DIAS_FINDE_BACK.includes(diaSemana);
    return {
      diaSemana,
      horaApertura: esFinde ? DEFAULT_APERTURA_FINDE : referencia.horaApertura,
      horaCierre: esFinde ? DEFAULT_CIERRE_FINDE : referencia.horaCierre,
    };
  });
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test -- wizard-onboarding`
Expected: PASS — todos los tests, incluidos los de Fase 1.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/lib/panel/wizard-onboarding.ts src/lib/panel/wizard-onboarding.test.ts
git commit -m "feat(wizard): agrega validacion de canchas y patron rapido de horarios"
```

---

### Task 2: Endpoint y tipos de MercadoPago (convención, backend a confirmar)

**Files:**
- Create: `src/lib/api/tipos/mercadopago.ts`
- Create: `src/lib/api/endpoints/mercadopago.ts`
- Modify: `src/lib/api/keys.ts`

**Interfaces:**
- Produces: `mercadopago.iniciarOAuth(estId)`, `mercadopago.obtenerEstado(estId)`, tipos `IniciarOAuthMercadoPagoResponse`, `EstadoMercadoPagoResponse` (consumidos por Task 7, `useWizardOnboarding`).

No lleva test: es un wrapper fino sobre `apiFetch`, igual que el resto de `src/lib/api/endpoints/*.ts`, que tampoco tiene tests unitarios propios en este repo (se verifican en uso).

- [ ] **Step 1: Crear los tipos**

`src/lib/api/tipos/mercadopago.ts`:

```ts
/**
 * MercadoPagoController — convención propuesta (Ruling 1 del plan de Fase 2
 * del wizard), a confirmar cuando el backend real exista. Mismo patrón que
 * fotos/canchas/políticas-cancelación: sub-recurso propio del establecimiento.
 */
export type IniciarOAuthMercadoPagoResponse = {
  /** URL de Mercado Pago a la que el front sólo redirige — arma client_id + redirect_uri el backend. */
  urlAutorizacion: string;
};

export type EstadoMercadoPagoResponse = {
  conectado: boolean;
  /** Nombre o email de la cuenta conectada, para mostrar. null si no está conectado. */
  cuenta: string | null;
};
```

- [ ] **Step 2: Crear el endpoint**

`src/lib/api/endpoints/mercadopago.ts`:

```ts
import { apiFetch } from "../cliente";
import type { EstadoMercadoPagoResponse, IniciarOAuthMercadoPagoResponse } from "../tipos/mercadopago";

/**
 * Sub-recurso de establecimiento, convención propuesta — ver
 * src/lib/api/tipos/mercadopago.ts. El intercambio del "code" de OAuth lo
 * hace el backend en su propio callback: el front nunca lo parsea, sólo
 * relee el estado (incluso al volver del redirect de MP).
 */
export const mercadopago = {
  iniciarOAuth: (estId: number) =>
    apiFetch<IniciarOAuthMercadoPagoResponse>(`/api/v1/establecimientos/${estId}/mercadopago/oauth/iniciar`),

  obtenerEstado: (estId: number) =>
    apiFetch<EstadoMercadoPagoResponse>(`/api/v1/establecimientos/${estId}/mercadopago`),
};
```

- [ ] **Step 3: Agregar la query key**

En `src/lib/api/keys.ts`, dentro de `establecimientos: { ... }`, agregar junto a `politicaCancelacion`:

```ts
  establecimientos: {
    mios: () => ["establecimientos", "mios"] as const,
    fotos: (estId: number) => ["establecimientos", estId, "fotos"] as const,
    politicaCancelacion: (estId: number) => ["establecimientos", estId, "politica-cancelacion"] as const,
    mercadopago: (estId: number) => ["establecimientos", estId, "mercadopago"] as const,
  },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/tipos/mercadopago.ts src/lib/api/endpoints/mercadopago.ts src/lib/api/keys.ts
git commit -m "feat(wizard): agrega el endpoint y los tipos de conexion con MercadoPago"
```

---

### Task 3: Componente del Paso 3 — Horarios

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-horarios.tsx`

**Interfaces:**
- Consumes: `FormHorariosAtencion` de `@/components/panel/form-horarios-atencion` (`{horarios, guardando, onGuardar}` → `onGuardar(horarios: HorarioAtencionDto[])`), `horariosDelPatron`/`PatronHorario` de Task 1.
- Produces: `PasoHorarios({horarios, guardando, error, onGuardar})` — `onGuardar: (horarios: HorarioAtencionDto[]) => void`. Consumido por Task 8 (orquestador), alimentado por `confirmarHorarios` de Task 7.

Sin test dedicado (componente presentacional, mismo criterio que `PasoIdentidad`/`PasoPoliticas` en Fase 1, que tampoco tienen test propio).

- [ ] **Step 1: Crear el componente**

`src/components/panel/wizard-onboarding/paso-horarios.tsx`:

```tsx
"use client";

import { useState } from "react";
import { FormHorariosAtencion } from "@/components/panel/form-horarios-atencion";
import { horariosDelPatron, type PatronHorario } from "@/lib/panel/wizard-onboarding";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";

const PATRONES: { valor: PatronHorario; etiqueta: string; descripcion: string }[] = [
  { valor: "mismo", etiqueta: "Mismo horario todos los días", descripcion: "Una franja única, los 7 días." },
  {
    valor: "semana-finde",
    etiqueta: "Lunes a viernes y fin de semana distinto",
    descripcion: "Una franja para la semana, otra para sábado y domingo.",
  },
  { valor: "dia-por-dia", etiqueta: "Día por día", descripcion: "Cargo cada día por separado." },
];

/**
 * Paso 3 del wizard. Los radios de patrón sólo deciden con QUÉ valores se
 * pre-carga `FormHorariosAtencion` — el `key={patron}` lo remonta al cambiar
 * de patrón (mismo truco que `PrecioBaseCancha` con `key={cancha.id}` en
 * /panel/precios), así que la validación y el guardado de ese formulario no
 * se tocan.
 */
export function PasoHorarios({
  horarios,
  guardando,
  error,
  onGuardar,
}: {
  horarios: HorarioAtencionDto[];
  guardando: boolean;
  error: string | null;
  onGuardar: (horarios: HorarioAtencionDto[]) => void;
}) {
  const [patron, setPatron] = useState<PatronHorario>("dia-por-dia");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Horarios de atención</h2>
        <p className="mt-1 text-sm text-grafito">Alimentan la disponibilidad y el % de ocupación de Reportes.</p>
      </div>

      <div className="space-y-2">
        {PATRONES.map((p) => (
          <label
            key={p.valor}
            className={`flex cursor-pointer items-start gap-3 rounded-input border p-3 transition-colors ${
              patron === p.valor ? "border-azul bg-celeste-suave/40" : "border-borde hover:border-azul"
            }`}
          >
            <input
              type="radio"
              name="patron-horario"
              checked={patron === p.valor}
              onChange={() => setPatron(p.valor)}
              className="mt-0.5 size-4 shrink-0 accent-azul"
            />
            <span>
              <span className="block text-sm font-semibold text-tinta">{p.etiqueta}</span>
              <span className="block text-xs text-grafito">{p.descripcion}</span>
            </span>
          </label>
        ))}
      </div>

      <FormHorariosAtencion
        key={patron}
        horarios={horariosDelPatron(patron, horarios)}
        guardando={guardando}
        onGuardar={onGuardar}
      />

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

Nota: `PasoHorarios` no tiene botones "Atrás"/"Continuar" propios — el "Guardar horarios" de `FormHorariosAtencion` ES el submit de este paso (Ruling 4: el paso 3 no permite volver a Identidad/Políticas).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores (el import de `HorarioAtencionDto`/`horariosDelPatron` debe resolver contra lo que dejó Task 1).

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-horarios.tsx
git commit -m "feat(wizard): agrega el paso 3 (horarios) del wizard de onboarding"
```

---

### Task 4: Componente del Paso 4 — Canchas

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-canchas.tsx`
- Modify: `src/components/panel/form-cancha.tsx`

**Interfaces:**
- Consumes: `FormCancha`, `DrawerPanel`, `ModalPanel`, `etiquetaDeporte`, tipos `Cancha`/`Bloqueo` de `@/lib/panel/canchas`, `CanchaResponse` de `@/lib/api/tipos/canchas`, `DatosCancha` de `@/lib/api/adaptadores/canchas`, `validarPasoCanchas` de Task 1 (se le pasa `canchasCrudas: CanchaResponse[]`, no la forma adaptada — ver nota abajo).
- Produces: `PasoCanchas({...})` con las props detalladas en el Step 2. Consumido por Task 8, alimentado por Task 7.

- [ ] **Step 1: Agregar `montoSenaSugerido` a `FormCancha`**

`FormCancha` no tiene forma de prellenar la seña de una cancha nueva con otro valor que no sea 0 — y la spec pide prellenarla con `politicas.montoSenaDefault` del paso 2. Es un cambio de una línea, compatible hacia atrás (prop opcional, `panel/canchas` sigue sin pasarla).

En `src/components/panel/form-cancha.tsx`, modificar la firma y el estado inicial de `montoSena`:

```tsx
export function FormCancha({
  cancha,
  canchasExistentes,
  montoSenaSugerido,
  onGuardar,
  onCancelar,
  onAgregarBloqueo,
  onQuitarBloqueo,
}: {
  cancha: Cancha | null;
  /** para elegir el pool: solo físicas, sin incluirse a sí misma */
  canchasExistentes: Cancha[];
  /** sólo se usa cuando `cancha === null` — ej. el wizard de onboarding prellena con la seña por defecto del paso 2 */
  montoSenaSugerido?: number;
  onGuardar: (datos: DatosCancha) => void;
  onCancelar: () => void;
  /** los bloqueos se aplican al toque, no esperan al Guardar del resto del form */
  onAgregarBloqueo: (bloqueo: Bloqueo) => void;
  onQuitarBloqueo: (indice: number) => void;
}) {
```

Y la línea del estado (reemplazar la existente):

```tsx
  const [montoSena, setMontoSena] = useState(cancha?.montoSena ?? montoSenaSugerido ?? 0);
```

- [ ] **Step 2: Crear `PasoCanchas`**

`src/components/panel/wizard-onboarding/paso-canchas.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArrowRight, LayoutGrid, Plus } from "lucide-react";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { FormCancha } from "@/components/panel/form-cancha";
import { etiquetaDeporte } from "@/lib/deportes";
import { validarPasoCanchas } from "@/lib/panel/wizard-onboarding";
import type { DatosCancha } from "@/lib/api/adaptadores/canchas";
import type { CanchaResponse } from "@/lib/api/tipos/canchas";
import type { Bloqueo, Cancha } from "@/lib/panel/canchas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; canchaId: number } | null;

/** Resumen simplificado — no la tabla completa de /panel/canchas: nombre, deportes, precio "desde", estado. */
function ListaCanchasWizard({
  canchas,
  onEditar,
  onDesactivar,
}: {
  canchas: Cancha[];
  onEditar: (cancha: Cancha) => void;
  onDesactivar: (cancha: Cancha) => void;
}) {
  return (
    <ul className="space-y-2">
      {canchas.map((c) => {
        const desde = c.preciosBase.length > 0 ? Math.min(...c.preciosBase.map((p) => p.precio)) : null;
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-input border border-borde p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-tinta">{c.nombre}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    c.isActive ? "bg-disponible-suave text-disponible" : "bg-humo text-grafito"
                  }`}
                >
                  {c.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {c.deportes.map((d) => (
                  <span key={d} className="rounded-full bg-humo px-2 py-0.5 text-[11px] font-semibold text-grafito">
                    {etiquetaDeporte(d)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {desde !== null && <span className="text-sm text-grafito">desde ${desde}</span>}
              <button type="button" onClick={() => onEditar(c)} className="text-xs font-semibold text-azul hover:underline">
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDesactivar(c)}
                className="text-xs font-semibold text-cancelado hover:underline"
              >
                Desactivar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PasoCanchas({
  canchas,
  canchasCrudas,
  requiereSena,
  montoSenaDefault,
  bloqueosDeCanchaEnEdicion,
  guardando,
  desactivando,
  error,
  onAbrirEdicion,
  onCrear,
  onActualizar,
  onDesactivar,
  onAgregarBloqueo,
  onQuitarBloqueo,
  onContinuar,
}: {
  /** ya adaptadas a la forma del panel, listas para FormCancha/la lista */
  canchas: Cancha[];
  /** crudas del backend — se lo que necesita validarPasoCanchas (usa montoSena: number | null) */
  canchasCrudas: CanchaResponse[];
  requiereSena: boolean;
  montoSenaDefault: number;
  bloqueosDeCanchaEnEdicion: Bloqueo[];
  guardando: boolean;
  desactivando: boolean;
  error: string | null;
  onAbrirEdicion: (canchaId: number) => void;
  onCrear: (datos: DatosCancha) => void;
  onActualizar: (id: number, datos: DatosCancha) => void;
  onDesactivar: (id: number) => void;
  onAgregarBloqueo: (bloqueo: Bloqueo) => void;
  onQuitarBloqueo: (indice: number) => void;
  onContinuar: () => void;
}) {
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);
  const [aDesactivar, setADesactivar] = useState<Cancha | null>(null);
  const [errorGate, setErrorGate] = useState<string | null>(null);

  const canchaEditandoId = panelAbierto?.tipo === "editar" ? panelAbierto.canchaId : null;
  const canchaEnEdicion = canchaEditandoId ? canchas.find((c) => c.id === canchaEditandoId) : undefined;

  function abrirEdicion(cancha: Cancha) {
    onAbrirEdicion(cancha.id);
    setPanelAbierto({ tipo: "editar", canchaId: cancha.id });
  }

  function continuar() {
    const errores = validarPasoCanchas(canchasCrudas, requiereSena);
    const mensaje = errores.canchas ?? errores.sena;
    if (mensaje) {
      setErrorGate(mensaje);
      return;
    }
    setErrorGate(null);
    onContinuar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-tinta">Canchas</h2>
          <p className="mt-1 text-sm text-grafito">Cargá al menos una cancha para poder recibir turnos.</p>
        </div>
        <button
          type="button"
          onClick={() => setPanelAbierto({ tipo: "nueva" })}
          disabled={guardando}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden />
          Nueva cancha
        </button>
      </div>

      {canchas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-borde py-14 text-center">
          <LayoutGrid className="size-7 text-grafito" aria-hidden />
          <p className="text-sm font-semibold text-tinta">Todavía no cargaste ninguna cancha</p>
        </div>
      ) : (
        <ListaCanchasWizard canchas={canchas} onEditar={abrirEdicion} onDesactivar={setADesactivar} />
      )}

      {(error || errorGate) && (
        <p className="text-sm text-cancelado" role="alert">
          {error ?? errorGate}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <span />
        <button
          type="button"
          onClick={continuar}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva cancha" onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={null}
            canchasExistentes={canchas}
            montoSenaSugerido={montoSenaDefault}
            onGuardar={(datos) => {
              onCrear(datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={() => {}}
            onQuitarBloqueo={() => {}}
          />
        </DrawerPanel>
      )}

      {canchaEnEdicion && (
        <DrawerPanel titulo="Editar cancha" subtitulo={canchaEnEdicion.nombre} onClose={() => setPanelAbierto(null)}>
          <FormCancha
            cancha={{ ...canchaEnEdicion, mantenimientos: bloqueosDeCanchaEnEdicion }}
            canchasExistentes={canchas}
            onGuardar={(datos) => {
              onActualizar(canchaEnEdicion.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
            onAgregarBloqueo={onAgregarBloqueo}
            onQuitarBloqueo={onQuitarBloqueo}
          />
        </DrawerPanel>
      )}

      {aDesactivar && (
        <ModalPanel titulo="¿Desactivar esta cancha?" subtitulo={aDesactivar.nombre} onClose={() => setADesactivar(null)}>
          <p className="text-sm text-grafito">
            Deja de recibir turnos y desaparece del listado.{" "}
            <strong className="text-tinta">Esta acción no se puede deshacer</strong>: para volver a tenerla vas a
            tener que crearla de nuevo.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setADesactivar(null)}
              className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                onDesactivar(aDesactivar.id);
                setADesactivar(null);
              }}
              disabled={desactivando}
              className="h-11 flex-1 rounded-full bg-cancelado text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {desactivando ? "Desactivando..." : "Sí, desactivar"}
            </button>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
```

Nota sobre `canchas`/`canchasCrudas`: `validarPasoCanchas` (Task 1) trabaja sobre `CanchaResponse[]` (`montoSena: number | null`, forma cruda del backend), mientras que la lista y `FormCancha` trabajan sobre `Cancha[]` (forma del panel, `montoSena: number`). En vez de traducir `Cancha` de vuelta a `CanchaResponse` dentro del componente, `PasoCanchas` recibe ambas formas ya calculadas por el hook (Task 7 ya tiene las dos: `canchas` crudo del backend y `.map(aCanchaPanel)`).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-canchas.tsx src/components/panel/form-cancha.tsx
git commit -m "feat(wizard): agrega el paso 4 (canchas) del wizard de onboarding"
```

---

### Task 5: Componente del Paso 5 — Tarifas

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-tarifas.tsx`

**Interfaces:**
- Consumes: `ListaTarifas`, `FormTarifa`, `DrawerPanel`, tipos `Tarifa`/`DiaSemana` de `@/lib/panel/tarifas`, `Cancha` de `@/lib/panel/canchas`.
- Produces: `PasoTarifas({...})`. Consumido por Task 8, alimentado por Task 7.

- [ ] **Step 1: Crear el componente**

`src/components/panel/wizard-onboarding/paso-tarifas.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DrawerPanel } from "@/components/panel/drawer-panel";
import { ListaTarifas } from "@/components/panel/lista-tarifas";
import { FormTarifa } from "@/components/panel/form-tarifa";
import { etiquetaDias, type DiaSemana, type Tarifa } from "@/lib/panel/tarifas";
import type { PrecioPorDuracion } from "@/lib/panel/canchas";
import type { Cancha } from "@/lib/panel/canchas";

type PanelAbierto = { tipo: "nueva" } | { tipo: "editar"; tarifaId: number } | null;
export type DatosTarifaForm = { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] };

/**
 * Paso 5, opcional. `PrecioBaseCancha` no se reutiliza acá (Ruling 2 del
 * plan): ese componente siempre es editable y este paso lo necesita de sólo
 * lectura, así que el precio base se muestra en un bloque estático propio.
 */
export function PasoTarifas({
  canchas,
  tarifasPorCancha,
  error,
  onCrearTarifa,
  onEditarTarifa,
  onQuitarTarifa,
  onAtras,
  onContinuar,
}: {
  canchas: Cancha[];
  tarifasPorCancha: Record<number, Tarifa[]>;
  error: string | null;
  onCrearTarifa: (canchaId: number, datos: DatosTarifaForm) => void;
  onEditarTarifa: (canchaId: number, tarifaId: number, datos: DatosTarifaForm) => void;
  onQuitarTarifa: (canchaId: number, tarifa: Tarifa) => void;
  onAtras: () => void;
  onContinuar: () => void;
}) {
  const [canchaId, setCanchaId] = useState<number | null>(canchas[0]?.id ?? null);
  const [panelAbierto, setPanelAbierto] = useState<PanelAbierto>(null);

  const cancha = canchas.find((c) => c.id === canchaId) ?? canchas[0];
  const tarifasDeCancha = cancha ? (tarifasPorCancha[cancha.id] ?? []) : [];
  const tarifaEnEdicion =
    panelAbierto?.tipo === "editar" ? tarifasDeCancha.find((t) => t.id === panelAbierto.tarifaId) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Tarifas</h2>
        <p className="mt-1 text-sm text-grafito">
          Opcional: cargá reglas de precio distinto por día y horario. Sin ninguna, rige el precio base de cada
          cancha.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Cancha a tarifar">
        {canchas.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === cancha?.id}
            onClick={() => setCanchaId(c.id)}
            className={`h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
              c.id === cancha?.id
                ? "bg-azul text-white"
                : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {cancha && (
        <>
          <div className="rounded-card border border-borde p-4">
            <p className="text-xs font-semibold text-grafito">Precio base — ya cargado en el paso anterior</p>
            <div className="mt-2 space-y-1">
              {cancha.preciosBase.map((p) => (
                <p key={p.duracionMinutos} className="text-sm text-tinta">
                  {p.duracionMinutos} min — ${p.precio}
                </p>
              ))}
            </div>
          </div>

          <ListaTarifas
            tarifas={tarifasDeCancha}
            onAgregar={() => setPanelAbierto({ tipo: "nueva" })}
            onEditar={(tarifa) => setPanelAbierto({ tipo: "editar", tarifaId: tarifa.id })}
            onQuitar={(tarifa) => onQuitarTarifa(cancha.id, tarifa)}
          />
        </>
      )}

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onContinuar}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {cancha && panelAbierto?.tipo === "nueva" && (
        <DrawerPanel titulo="Nueva tarifa" subtitulo={cancha.nombre} onClose={() => setPanelAbierto(null)}>
          <FormTarifa
            tarifa={null}
            cancha={cancha}
            otrasTarifasDeLaCancha={tarifasDeCancha}
            onGuardar={(datos) => {
              onCrearTarifa(cancha.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}

      {cancha && tarifaEnEdicion && (
        <DrawerPanel
          titulo="Editar tarifa"
          subtitulo={`${cancha.nombre} · ${etiquetaDias(tarifaEnEdicion.dias)}`}
          onClose={() => setPanelAbierto(null)}
        >
          <FormTarifa
            tarifa={tarifaEnEdicion}
            cancha={cancha}
            otrasTarifasDeLaCancha={tarifasDeCancha.filter((t) => t.id !== tarifaEnEdicion.id)}
            onGuardar={(datos) => {
              onEditarTarifa(cancha.id, tarifaEnEdicion.id, datos);
              setPanelAbierto(null);
            }}
            onCancelar={() => setPanelAbierto(null)}
          />
        </DrawerPanel>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-tarifas.tsx
git commit -m "feat(wizard): agrega el paso 5 (tarifas) del wizard de onboarding"
```

---

### Task 6: Componente del Paso 6 — Cobros (MercadoPago)

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-cobros.tsx`

**Interfaces:**
- Consumes: `EstadoMercadoPagoResponse` de Task 2.
- Produces: `PasoCobros({...})`. Consumido por Task 8, alimentado por Task 7.

- [ ] **Step 1: Crear el componente**

`src/components/panel/wizard-onboarding/paso-cobros.tsx`:

```tsx
"use client";

import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Wallet } from "lucide-react";
import type { EstadoMercadoPagoResponse } from "@/lib/api/tipos/mercadopago";

/**
 * Paso 6, el último del wizard. El gate de "Publicar complejo" es el fix más
 * importante de este paso (spec §3): con seña obligatoria, hace falta
 * Mercado Pago conectado. Sin seña obligatoria, la card se reemplaza por un
 * texto — no hace falta conectar nada para publicar.
 */
export function PasoCobros({
  requiereSena,
  estadoMercadoPago,
  cargandoEstado,
  conectando,
  publicando,
  error,
  onConectar,
  onAtras,
  onPublicar,
}: {
  requiereSena: boolean;
  estadoMercadoPago: EstadoMercadoPagoResponse | null;
  cargandoEstado: boolean;
  conectando: boolean;
  publicando: boolean;
  error: string | null;
  onConectar: () => void;
  onAtras: () => void;
  onPublicar: () => void;
}) {
  const conectado = estadoMercadoPago?.conectado ?? false;
  const bloqueadoPorSena = requiereSena && !conectado;

  function publicar(e: FormEvent) {
    e.preventDefault();
    if (bloqueadoPorSena) return;
    onPublicar();
  }

  return (
    <form onSubmit={publicar} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Cobros</h2>
        <p className="mt-1 text-sm text-grafito">Conectá Mercado Pago para cobrar señas de forma online.</p>
      </div>

      {!requiereSena && (
        <div className="rounded-input border border-borde bg-humo p-4 text-sm text-grafito">
          Tu complejo no exige seña para reservar, así que esto no es necesario ahora — podés conectarlo cuando
          quieras desde Configuración.
        </div>
      )}

      {requiereSena && cargandoEstado && (
        <div className="rounded-input border border-borde p-4 text-sm text-grafito">
          Comprobando la conexión con Mercado Pago...
        </div>
      )}

      {requiereSena && !cargandoEstado && !conectado && (
        <div className="space-y-3 rounded-input border border-borde p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-celeste-suave">
              <Wallet className="size-5 text-azul" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-tinta">Mercado Pago desconectado</p>
              <p className="text-xs text-grafito">Con seña obligatoria, necesitás conectar una cuenta para publicar.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onConectar}
            disabled={conectando}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-azul px-4 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:opacity-60"
          >
            {conectando ? "Redirigiendo..." : "Conectar Mercado Pago"}
            {!conectando && <ExternalLink className="size-4" aria-hidden />}
          </button>
        </div>
      )}

      {requiereSena && !cargandoEstado && conectado && (
        <div className="flex items-center gap-3 rounded-input border border-borde bg-disponible-suave p-4">
          <CheckCircle2 className="size-8 shrink-0 text-disponible" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-tinta">Mercado Pago conectado</p>
            {estadoMercadoPago?.cuenta && <p className="text-xs text-grafito">{estadoMercadoPago.cuenta}</p>}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={publicando}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={bloqueadoPorSena || publicando}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
        >
          {publicando ? "Publicando..." : "Publicar complejo"}
          {!publicando && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-cobros.tsx
git commit -m "feat(wizard): agrega el paso 6 (cobros) del wizard de onboarding"
```

---

### Task 7: Extender `useWizardOnboarding` con los pasos 3 a 6

**Files:**
- Modify: `src/hooks/api/use-wizard-onboarding.ts`

**Interfaces:**
- Consumes: todo lo de Task 1 y Task 2, más `canchas`/`bloqueos` de `@/lib/api/endpoints/canchas`, `aCanchaPanel`/`aCanchaRequest`/`aBloqueoPanel`/`aFechaHoraBloqueo` de `@/lib/api/adaptadores/canchas`, `aTarifasDto`/`aTarifasPanel` de `@/lib/api/tarifas`.
- Produces: la forma completa que Task 8 (orquestador) consume — ver el objeto de retorno completo al final de este archivo.

Sin test dedicado: es un hook de React con `useMutation`/`useState`/`useEffect`, mismo criterio que el hook de Fase 1 (`useWizardOnboarding` original), que tampoco tiene test unitario — se verifica con `tsc`, `npm run build`, y en vivo.

- [ ] **Step 1: Reescribir el archivo completo**

Reemplazar TODO el contenido de `src/hooks/api/use-wizard-onboarding.ts` por:

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { canchas as endpointCanchas, bloqueos as endpointBloqueos } from "@/lib/api/endpoints/canchas";
import { mercadopago as endpointMercadoPago } from "@/lib/api/endpoints/mercadopago";
import { aBloqueoPanel, aCanchaPanel, aCanchaRequest, aFechaHoraBloqueo, type DatosCancha } from "@/lib/api/adaptadores/canchas";
import { aTarifasDto, aTarifasPanel } from "@/lib/api/tarifas";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { guardarEstablecimientoSeleccionado } from "@/lib/establecimiento-seleccionado";
import { usePerfil } from "@/hooks/api/use-perfil";
import type { DatosPasoIdentidad, DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";
import type { BloqueoCanchaResponse, CanchaResponse } from "@/lib/api/tipos/canchas";
import type { EstadoMercadoPagoResponse } from "@/lib/api/tipos/mercadopago";
import type { Bloqueo } from "@/lib/panel/canchas";
import type { DiaSemana, Tarifa } from "@/lib/panel/tarifas";
import type { HorarioAtencionDto } from "@/lib/api/tipos/comunes";
import type { PrecioPorDuracion } from "@/lib/panel/canchas";

type DatosTarifaForm = { dias: DiaSemana[]; horaDesde: string; horaHasta: string; precios: PrecioPorDuracion[] };
type PasoActual = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Estado y orquestación del wizard de onboarding completo (6 pasos). El
 * establecimiento se crea al confirmar el paso 2 (Fase 1) y de ahí en
 * adelante `establecimientoParcial` es la fuente de verdad: horarios lo
 * actualiza con un PUT completo, canchas/tarifas son sub-recursos aparte.
 * "Publicar complejo" (paso 6) no dispara ningún request — todo ya se guardó
 * en cuanto se confirmó cada paso (ver Ruling 6 del plan de Fase 2).
 */
export function useWizardOnboarding() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();

  const [pasoActual, setPasoActual] = useState<PasoActual>(1);
  const [datosIdentidad, setDatosIdentidad] = useState<DatosPasoIdentidad | null>(null);
  const [montoSenaDefault, setMontoSenaDefault] = useState(0);
  const [establecimientoParcial, setEstablecimientoParcial] = useState<EstablecimientoResponse | null>(null);
  const [erroresFotos, setErroresFotos] = useState<string[]>([]);
  const establecimientoRef = useRef<EstablecimientoResponse | null>(null);

  // ---------------------------------------------------------------------
  // Paso 1 — Identidad
  // ---------------------------------------------------------------------

  function confirmarIdentidad(datos: DatosPasoIdentidad) {
    setDatosIdentidad(datos);
    setPasoActual(2);
  }

  function volverAIdentidad() {
    setPasoActual(1);
  }

  // ---------------------------------------------------------------------
  // Paso 2 — Políticas (crea el establecimiento)
  // ---------------------------------------------------------------------

  const crear = useMutation<EstablecimientoResponse, ApiError, DatosPasoPoliticas>({
    mutationFn: async (politicas) => {
      if (!datosIdentidad) {
        throw new ApiError({ status: 0, mensaje: "Falta completar el paso 1." });
      }

      let establecimiento = establecimientoRef.current;
      if (!establecimiento) {
        establecimiento = await endpointEstablecimientos.crear({
          nombre: datosIdentidad.nombre,
          direccion: datosIdentidad.direccion,
          latitud: datosIdentidad.latitud,
          longitud: datosIdentidad.longitud,
          requiereSena: politicas.requiereSena,
          requiereTelefonoVerificado: politicas.requiereTelefonoVerificado,
          horariosAtencion: [],
          servicios: datosIdentidad.servicios,
        });
        establecimientoRef.current = establecimiento;
        setEstablecimientoParcial(establecimiento);
        // Refleja el alta en la cache al instante: invalidateQueries no
        // refetchea queries sin observadores activos (TanStack Query v5,
        // refetchType "active" por defecto), y nada en /panel/bienvenida
        // observa esta query. Sin esto, "Ir al panel" — o un reintento
        // tras un fallo parcial — vuelve a leer [] cacheado en
        // /panel/agenda y rebota de nuevo al wizard, arriesgando un
        // establecimiento duplicado. Mismo patrón que
        // ModalCrearEstablecimiento (modal-crear-establecimiento.tsx).
        const nuevo = establecimiento;
        queryClient.setQueryData<EstablecimientoResponse[]>(
          keys.establecimientos.mios(),
          (previos) => [...(previos ?? []), nuevo],
        );
        guardarEstablecimientoSeleccionado(establecimiento.id);
      }

      const fotosFallidas: string[] = [];
      for (const archivo of datosIdentidad.fotos) {
        try {
          await endpointEstablecimientos.subirFoto(establecimiento.id, archivo);
        } catch {
          fotosFallidas.push(archivo.name);
        }
      }
      setErroresFotos(fotosFallidas);

      await endpointEstablecimientos.actualizarPoliticaCancelacion(establecimiento.id, {
        horasCancelacionAntesPartido: politicas.horasCancelacionAntesPartido,
        minutosGraciaCancelacion: politicas.minutosGraciaCancelacion,
      });

      return establecimiento;
    },
    onSuccess: (establecimiento) => {
      setEstablecimientoParcial(establecimiento);
      setPasoActual(3);
    },
  });

  function confirmarPoliticas(politicas: DatosPasoPoliticas) {
    setMontoSenaDefault(politicas.montoSenaDefault);
    crear.mutate(politicas);
  }

  // ---------------------------------------------------------------------
  // Paso 3 — Horarios
  // ---------------------------------------------------------------------

  const guardarHorarios = useMutation<EstablecimientoResponse, ApiError, HorarioAtencionDto[]>({
    mutationFn: (horarios) => {
      const actual = establecimientoParcial!;
      return endpointEstablecimientos.actualizar(actual.id, {
        nombre: actual.nombre,
        direccion: actual.direccion,
        latitud: actual.latitud,
        longitud: actual.longitud,
        requiereSena: actual.requiereSena,
        requiereTelefonoVerificado: actual.requiereTelefonoVerificado,
        // Va SIEMPRE: omitirlo borra los horarios (ver Global Constraints del plan).
        horariosAtencion: horarios,
        // `servicios` se omite a propósito: ausente = no modificar.
      });
    },
    onSuccess: (actualizado) => {
      setEstablecimientoParcial(actualizado);
      setPasoActual(4);
    },
  });

  function confirmarHorarios(horarios: HorarioAtencionDto[]) {
    guardarHorarios.mutate(horarios);
  }

  // ---------------------------------------------------------------------
  // Paso 4 — Canchas
  // ---------------------------------------------------------------------

  const [canchas, setCanchas] = useState<CanchaResponse[]>([]);
  const [errorCanchas, setErrorCanchas] = useState<string | null>(null);
  const [desactivandoCanchaId, setDesactivandoCanchaId] = useState<number | null>(null);
  const [canchaEnEdicionId, setCanchaEnEdicionId] = useState<number | null>(null);
  // Cruda, no adaptada: quitarBloqueo necesita el `id` real que el backend
  // asigna, y `Bloqueo` (la forma del panel) no lo trae — se adapta recién
  // en el objeto de retorno, para el prop que consume PasoCanchas.
  const [bloqueosCrudosDeCanchaEnEdicion, setBloqueosCrudosDeCanchaEnEdicion] = useState<BloqueoCanchaResponse[]>([]);

  function refrescarBloqueos(canchaId: number) {
    endpointBloqueos
      .deCancha(establecimientoParcial!.id, canchaId)
      .then(setBloqueosCrudosDeCanchaEnEdicion)
      .catch(() => setBloqueosCrudosDeCanchaEnEdicion([]));
  }

  function abrirEdicionCancha(canchaId: number) {
    setCanchaEnEdicionId(canchaId);
    refrescarBloqueos(canchaId);
  }

  const guardarCancha = useMutation<CanchaResponse, ApiError, { id: number | null; datos: DatosCancha }>({
    mutationFn: ({ id, datos }) => {
      const estId = establecimientoParcial!.id;
      return id === null
        ? endpointCanchas.crear(estId, aCanchaRequest(datos))
        : endpointCanchas.actualizar(estId, id, aCanchaRequest(datos));
    },
    onSuccess: (cancha, { id }) => {
      setCanchas((prev) => (id === null ? [...prev, cancha] : prev.map((c) => (c.id === cancha.id ? cancha : c))));
      setErrorCanchas(null);
    },
    onError: (e) => setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar la cancha."),
  });

  const desactivarCanchaMut = useMutation<void, ApiError, number>({
    mutationFn: (canchaId) => {
      setDesactivandoCanchaId(canchaId);
      return endpointCanchas.desactivar(establecimientoParcial!.id, canchaId);
    },
    onSuccess: (_vacio, canchaId) => {
      setCanchas((prev) => prev.filter((c) => c.id !== canchaId));
      setDesactivandoCanchaId(null);
      setErrorCanchas(null);
    },
    onError: (e) => {
      setDesactivandoCanchaId(null);
      setErrorCanchas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos desactivar la cancha.");
    },
  });

  const agregarBloqueoMut = useMutation({
    mutationFn: ({ canchaId, bloqueo }: { canchaId: number; bloqueo: Bloqueo }) =>
      endpointBloqueos.crear(establecimientoParcial!.id, canchaId, {
        fechaInicio: aFechaHoraBloqueo(bloqueo.desde),
        fechaFin: aFechaHoraBloqueo(bloqueo.hasta),
        motivo: bloqueo.motivo?.trim() || "Mantenimiento",
      }),
    onSuccess: (_nuevo, { canchaId }) => refrescarBloqueos(canchaId),
  });

  const quitarBloqueoMut = useMutation({
    mutationFn: ({ canchaId, bloqueoId }: { canchaId: number; bloqueoId: number }) =>
      endpointBloqueos.eliminar(establecimientoParcial!.id, canchaId, bloqueoId),
    onSuccess: (_vacio, { canchaId }) => refrescarBloqueos(canchaId),
  });

  function agregarBloqueo(bloqueo: Bloqueo) {
    if (canchaEnEdicionId === null) return;
    agregarBloqueoMut.mutate({ canchaId: canchaEnEdicionId, bloqueo });
  }

  function quitarBloqueo(indice: number) {
    if (canchaEnEdicionId === null) return;
    // El formulario trabaja por índice; se resuelve contra la lista CRUDA
    // (no la adaptada) porque es la única que trae el `id` que pide el DELETE.
    const bloqueo = bloqueosCrudosDeCanchaEnEdicion[indice];
    if (bloqueo) quitarBloqueoMut.mutate({ canchaId: canchaEnEdicionId, bloqueoId: bloqueo.id });
  }

  function volverAHorarios() {
    setPasoActual(3);
  }

  function confirmarCanchas() {
    setPasoActual(5);
  }

  // ---------------------------------------------------------------------
  // Paso 5 — Tarifas
  // ---------------------------------------------------------------------

  const [errorTarifas, setErrorTarifas] = useState<string | null>(null);

  function tarifasDeCanchaId(canchaId: number): Tarifa[] {
    const cancha = canchas.find((c) => c.id === canchaId);
    return cancha ? aTarifasPanel(cancha.tarifas, cancha.id) : [];
  }

  const guardarTarifas = useMutation<
    CanchaResponse,
    ApiError,
    { canchaId: number; preciosBase?: PrecioPorDuracion[]; tarifas: Tarifa[] }
  >({
    mutationFn: ({ canchaId, preciosBase, tarifas }) => {
      const canchaCruda = canchas.find((c) => c.id === canchaId)!;
      const canchaPanel = aCanchaPanel(canchaCruda);
      return endpointCanchas.actualizar(establecimientoParcial!.id, canchaId, {
        ...aCanchaRequest({ ...canchaPanel, preciosBase: preciosBase ?? canchaPanel.preciosBase }),
        tarifas: aTarifasDto(tarifas),
      });
    },
    onSuccess: (actualizada) => {
      setCanchas((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      setErrorTarifas(null);
    },
    onError: (e) => setErrorTarifas(e instanceof ApiError ? mensajeVisible(e) : "No pudimos guardar los precios."),
  });

  function crearTarifa(canchaId: number, datos: DatosTarifaForm) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: [...actuales, { ...datos, id: actuales.length, canchaId }] });
  }

  function editarTarifa(canchaId: number, tarifaId: number, datos: DatosTarifaForm) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: actuales.map((t) => (t.id === tarifaId ? { ...t, ...datos } : t)) });
  }

  function quitarTarifa(canchaId: number, tarifa: Tarifa) {
    const actuales = tarifasDeCanchaId(canchaId);
    guardarTarifas.mutate({ canchaId, tarifas: actuales.filter((t) => t.id !== tarifa.id) });
  }

  function volverACanchas() {
    setPasoActual(4);
  }

  function confirmarTarifas() {
    setPasoActual(6);
  }

  // ---------------------------------------------------------------------
  // Paso 6 — Cobros (MercadoPago)
  // ---------------------------------------------------------------------

  const [estadoMercadoPago, setEstadoMercadoPago] = useState<EstadoMercadoPagoResponse | null>(null);
  const [cargandoEstadoMercadoPago, setCargandoEstadoMercadoPago] = useState(false);
  const [conectandoMercadoPago, setConectandoMercadoPago] = useState(false);
  const [errorMercadoPago, setErrorMercadoPago] = useState<string | null>(null);
  const [publicado, setPublicado] = useState(false);

  function consultarEstadoMercadoPago() {
    if (!establecimientoParcial) return;
    setCargandoEstadoMercadoPago(true);
    endpointMercadoPago
      .obtenerEstado(establecimientoParcial.id)
      .then(setEstadoMercadoPago)
      .catch(() => setEstadoMercadoPago({ conectado: false, cuenta: null }))
      .finally(() => setCargandoEstadoMercadoPago(false));
  }

  // Vuelve a chequear el estado al entrar al paso 6 y cada vez que la
  // pestaña recupera el foco — es como se entera de una conexión hecha en
  // la pestaña de Mercado Pago que abrió el redirect (ver comentario en
  // src/lib/api/endpoints/mercadopago.ts: el front nunca parsea el "code").
  useEffect(() => {
    if (pasoActual !== 6 || !establecimientoParcial) return;
    consultarEstadoMercadoPago();
    function alVolverElFoco() {
      if (document.visibilityState === "visible") consultarEstadoMercadoPago();
    }
    document.addEventListener("visibilitychange", alVolverElFoco);
    return () => document.removeEventListener("visibilitychange", alVolverElFoco);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoActual, establecimientoParcial?.id]);

  function iniciarConexionMercadoPago() {
    if (!establecimientoParcial) return;
    setConectandoMercadoPago(true);
    setErrorMercadoPago(null);
    endpointMercadoPago
      .iniciarOAuth(establecimientoParcial.id)
      .then(({ urlAutorizacion }) => {
        window.location.href = urlAutorizacion;
      })
      .catch((e) => {
        setConectandoMercadoPago(false);
        setErrorMercadoPago(
          e instanceof ApiError ? mensajeVisible(e) : "No pudimos iniciar la conexión con Mercado Pago.",
        );
      });
  }

  function volverATarifas() {
    setPasoActual(5);
  }

  function publicarComplejo() {
    setPublicado(true);
  }

  // ---------------------------------------------------------------------

  const errorCreacion = crear.isError ? crear.error : null;
  const errorHorarios = guardarHorarios.isError
    ? guardarHorarios.error instanceof ApiError
      ? mensajeVisible(guardarHorarios.error)
      : "No pudimos guardar los horarios."
    : null;

  return {
    pasoActual,
    plan: perfil?.planSuscripcion,

    // Paso 1
    datosIdentidad,
    confirmarIdentidad,

    // Paso 2
    establecimientoParcial,
    creando: crear.isPending,
    errorCreacion,
    erroresFotos,
    volverAIdentidad,
    confirmarPoliticas,

    // Paso 3
    guardandoHorarios: guardarHorarios.isPending,
    errorHorarios,
    confirmarHorarios,

    // Paso 4
    canchas,
    canchasPanel: canchas.map(aCanchaPanel),
    montoSenaDefault,
    bloqueosDeCanchaEnEdicion: bloqueosCrudosDeCanchaEnEdicion.map(aBloqueoPanel),
    guardandoCancha: guardarCancha.isPending,
    desactivandoCanchaId,
    errorCanchas,
    abrirEdicionCancha,
    crearCancha: (datos: DatosCancha) => guardarCancha.mutate({ id: null, datos }),
    actualizarCancha: (id: number, datos: DatosCancha) => guardarCancha.mutate({ id, datos }),
    desactivarCancha: (id: number) => desactivarCanchaMut.mutate(id),
    agregarBloqueo,
    quitarBloqueo,
    volverAHorarios,
    confirmarCanchas,

    // Paso 5
    tarifasPorCancha: Object.fromEntries(canchas.map((c) => [c.id, aTarifasPanel(c.tarifas, c.id)])),
    errorTarifas,
    crearTarifa,
    editarTarifa,
    quitarTarifa,
    volverACanchas,
    confirmarTarifas,

    // Paso 6
    estadoMercadoPago,
    cargandoEstadoMercadoPago,
    conectandoMercadoPago,
    errorMercadoPago,
    iniciarConexionMercadoPago,
    volverATarifas,
    publicarComplejo,

    // Pantalla de éxito
    publicado,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores. Si aparece un error de tipos en `quitarBloqueo` o en cualquier firma, revisar contra las interfaces exactas dejadas por Task 2 (`mercadopago.ts`) y Task 1 (`wizard-onboarding.ts`) antes de tocar nada más — no improvisar una forma distinta.

- [ ] **Step 3: Correr toda la suite**

Run: `npm test`
Expected: PASS (70+ tests existentes de Fase 1 y del resto del repo, más los agregados en Task 1).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/api/use-wizard-onboarding.ts
git commit -m "feat(wizard): extiende useWizardOnboarding a los pasos 3-6"
```

---

### Task 8: Orquestador — renderizar los pasos 3 a 6 y mover la pantalla de éxito

**Files:**
- Modify: `src/components/panel/wizard-onboarding/wizard-onboarding.tsx`

**Interfaces:**
- Consumes: `PasoHorarios` (Task 3), `PasoCanchas` (Task 4), `PasoTarifas` (Task 5), `PasoCobros` (Task 6), el objeto completo devuelto por `useWizardOnboarding` (Task 7).

- [ ] **Step 1: Reescribir el archivo completo**

Reemplazar TODO el contenido de `src/components/panel/wizard-onboarding/wizard-onboarding.tsx` por:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BarraProgresoWizard } from "./barra-progreso-wizard";
import { PasoIdentidad } from "./paso-identidad";
import { PasoPoliticas } from "./paso-politicas";
import { PasoHorarios } from "./paso-horarios";
import { PasoCanchas } from "./paso-canchas";
import { PasoTarifas } from "./paso-tarifas";
import { PasoCobros } from "./paso-cobros";
import { useWizardOnboarding } from "@/hooks/api/use-wizard-onboarding";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { useBloqueadoPorCaja } from "@/lib/permisos";

export function WizardOnboarding() {
  const router = useRouter();
  const bloqueadoPorCaja = useBloqueadoPorCaja();
  const wizard = useWizardOnboarding();

  if (bloqueadoPorCaja) return <div className="min-h-dvh bg-humo" />;

  if (wizard.publicado) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-disponible-suave">
          <CheckCircle2 className="size-10 text-disponible" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">¡Tu complejo está listo!</h1>
          <p className="mt-2 text-sm text-grafito">
            {wizard.establecimientoParcial?.nombre} ya existe en Saque, con sus horarios, canchas y tarifas
            cargados. Entrá a tu panel para revisar todo o seguir editando cuando quieras.
          </p>
          {wizard.erroresFotos.length > 0 && (
            <p className="mt-3 text-sm text-pendiente">
              No pudimos subir {wizard.erroresFotos.length === 1 ? "esta foto" : "estas fotos"}:{" "}
              {wizard.erroresFotos.join(", ")}. Podés volver a intentarlo desde Configuración.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/panel/agenda")}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Ir al panel
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  const errorCreacion =
    wizard.errorCreacion instanceof ApiError
      ? mensajeVisible(wizard.errorCreacion)
      : wizard.errorCreacion
        ? "No pudimos crear el complejo. Intentá de nuevo."
        : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-humo p-4 md:p-8">
      <div className="w-full max-w-2xl rounded-card bg-white p-6 shadow-card md:p-10">
        <div className="mb-8">
          <BarraProgresoWizard pasoActual={wizard.pasoActual} />
        </div>

        {wizard.pasoActual === 1 && (
          <PasoIdentidad datosIniciales={wizard.datosIdentidad} onContinuar={wizard.confirmarIdentidad} />
        )}

        {wizard.pasoActual === 2 && (
          <PasoPoliticas
            plan={wizard.plan}
            guardando={wizard.creando}
            error={errorCreacion}
            establecimientoParcial={wizard.establecimientoParcial}
            onAtras={wizard.volverAIdentidad}
            onConfirmar={wizard.confirmarPoliticas}
          />
        )}

        {wizard.pasoActual === 3 && wizard.establecimientoParcial && (
          <PasoHorarios
            horarios={wizard.establecimientoParcial.horariosAtencion}
            guardando={wizard.guardandoHorarios}
            error={wizard.errorHorarios}
            onGuardar={wizard.confirmarHorarios}
          />
        )}

        {wizard.pasoActual === 4 && wizard.establecimientoParcial && (
          <PasoCanchas
            canchas={wizard.canchasPanel}
            canchasCrudas={wizard.canchas}
            requiereSena={wizard.establecimientoParcial.requiereSena}
            montoSenaDefault={wizard.montoSenaDefault}
            bloqueosDeCanchaEnEdicion={wizard.bloqueosDeCanchaEnEdicion}
            guardando={wizard.guardandoCancha}
            desactivando={wizard.desactivandoCanchaId !== null}
            error={wizard.errorCanchas}
            onAbrirEdicion={wizard.abrirEdicionCancha}
            onCrear={wizard.crearCancha}
            onActualizar={wizard.actualizarCancha}
            onDesactivar={wizard.desactivarCancha}
            onAgregarBloqueo={wizard.agregarBloqueo}
            onQuitarBloqueo={wizard.quitarBloqueo}
            onContinuar={wizard.confirmarCanchas}
          />
        )}

        {wizard.pasoActual === 5 && (
          <PasoTarifas
            canchas={wizard.canchasPanel}
            tarifasPorCancha={wizard.tarifasPorCancha}
            error={wizard.errorTarifas}
            onCrearTarifa={wizard.crearTarifa}
            onEditarTarifa={wizard.editarTarifa}
            onQuitarTarifa={wizard.quitarTarifa}
            onAtras={wizard.volverACanchas}
            onContinuar={wizard.confirmarTarifas}
          />
        )}

        {wizard.pasoActual === 6 && wizard.establecimientoParcial && (
          <PasoCobros
            requiereSena={wizard.establecimientoParcial.requiereSena}
            estadoMercadoPago={wizard.estadoMercadoPago}
            cargandoEstado={wizard.cargandoEstadoMercadoPago}
            conectando={wizard.conectandoMercadoPago}
            publicando={false}
            error={wizard.errorMercadoPago}
            onConectar={wizard.iniciarConexionMercadoPago}
            onAtras={wizard.volverATarifas}
            onPublicar={wizard.publicarComplejo}
          />
        )}
      </div>
    </div>
  );
}
```

Nota: `publicando={false}` en `PasoCobros` — "Publicar complejo" es una transición local instantánea (Ruling 6), no hay estado de carga que mostrar.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build exitoso, sin errores ni warnings nuevos.

- [ ] **Step 4: Correr toda la suite una vez más**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panel/wizard-onboarding/wizard-onboarding.tsx
git commit -m "feat(wizard): conecta los pasos 3-6 al orquestador y mueve la pantalla de exito al final"
```

---

## Verificación final (no es una tarea del plan — recordatorio para quien lo ejecute)

Este plan, a diferencia de Fase 1, no puede probarse en vivo de punta a punta contra un backend real: los endpoints de canchas/tarifas/horarios ya existen (se probaron indirectamente vía `panel/canchas`/`panel/precios`/`panel/configuracion`, que siguen funcionando), pero el backend de MercadoPago (paso 6) es una convención propuesta (Ruling 1) que todavía no existe — `iniciarOAuth`/`obtenerEstado` van a devolver 404 hasta que el backend real se implemente. Verificar en vivo los pasos 3, 4 y 5 (que si tienen backend real) es responsabilidad de quien ejecute este plan antes de dar a Fase 2 por terminada; el paso 6 sólo puede verificarse una vez que el backend de MercadoPago exista.
