# Wizard de onboarding — Fase 1 (Identidad + Políticas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un dueño (OWNER) sin establecimiento entra a `/panel/bienvenida`, completa identidad
(nombre, dirección, ubicación, servicios, fotos) y políticas (seña, teléfono verificado, política de
cancelación), y al confirmar el paso 2 su complejo queda creado de verdad en el backend — listo para
seguir configurándolo desde las pantallas del panel que ya existen (`/panel/configuracion`,
`/panel/canchas`, `/panel/precios`).

**Architecture:** El establecimiento se crea recién al confirmar el paso 2, no antes (`POST
/establecimientos` exige datos de ambos pasos a la vez). Un hook central
(`useWizardOnboarding`) es dueño de todo el estado del wizard y orquesta la creación: crea el
establecimiento, sube en cola las fotos que quedaron en espera del paso 1, y actualiza la política de
cancelación — todo en una sola mutación. Cada paso es un formulario autocontenido (mismo patrón que
`FormDatosComplejo`/`FormCancha`: estado local, valida al confirmar, entrega los datos ya validados
al padre) — no hay `Context` ni store global, el hook alcanza.

Esta es la Fase 1 de un wizard de 6 pasos completo (ver spec). Las fases 2 (Horarios + Canchas) y 3
(Tarifas + Cobros) son planes separados, a escribir cuando ésta esté implementada y revisada —
producir el flujo completo de una vez sería un plan no revisable. Al terminar la Fase 1, un dueño ya
tiene un complejo funcional (aunque incompleto) y puede terminar de cargarlo a mano desde el panel
existente, que ya cubre horarios, canchas, tarifas, servicios, fotos y política de cancelación.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query v5, TypeScript, Tailwind v4. Sin
infraestructura de testing de componentes/hooks en este repo (vitest solo cubre funciones puras en
`src/lib/**/*.test.ts`) — los componentes y el hook de este plan se verifican con el dev server, igual
que el resto del panel.

**Spec:** `docs/superpowers/specs/2026-09-02-wizard-onboarding-complejo-design.md`

## Global Constraints

- El establecimiento se crea al confirmar el **paso 2**, no el paso 1: `POST
  /api/v1/establecimientos` (`EstablecimientoRequest`) exige `nombre`, `direccion`, `latitud`,
  `longitud`, `requiereSena` y `requiereTelefonoVerificado` juntos.
- `isActive` no se lee ni se escribe desde ningún componente de este plan — es un flag de
  verificación de soporte, ajeno al wizard.
- `requiereSena` se fuerza a `true` (control deshabilitado) **solo si `plan === "FREE"`** — NO
  `TRIAL`. Ya corregido en el backend (`EstablecimientoService.esPlanLimitado`,
  `CanchaService.validarMontoSena`) y en `src/components/panel/form-datos-complejo.tsx:143`
  durante la sesión de diseño. Este plan replica esa misma condición, no la reabre.
- El `slug` **no es editable**: se muestra como preview de solo lectura, calculado en el cliente con
  el mismo algoritmo que `SlugGenerator.normalizar` del backend (minúsculas, sin diacríticos, no
  alfanumérico → guión, sin guiones al borde, vacío → `"complejo"`).
- Fotos: se validan tipo (`image/jpeg`, `image/png`, `image/webp`) y tamaño (máx. 5MB), igual que
  `src/components/panel/form-fotos.tsx:13-14`. No son obligatorias para crear el establecimiento — no
  hay forma de exigirlas server-side, así que no se bloquea la creación por esto.
- Política de cancelación: horas `0–168`, minutos `0–1440` (enteros) — mismos límites que
  `src/components/panel/seccion-politica-cancelacion.tsx:11-12`.
- Nunca usar shadcn/Radix/sonner — componentes hechos a mano, siguiendo los patrones ya existentes en
  `src/components/panel/`.
- Sin infraestructura de testing de componentes/hooks: no inventar un setup de Testing Library. Sólo
  las funciones puras (Task 1) llevan TDD con vitest; el resto se verifica manualmente.
- Todo el texto visible en español.

---

### Task 1: Helpers puros del wizard — preview de slug y validación por paso

**Files:**
- Create: `src/lib/panel/wizard-onboarding.ts`
- Test: `src/lib/panel/wizard-onboarding.test.ts`

**Interfaces:**
- Produces: `calcularSlugPreview(nombre: string): string`, `type ErroresCampo = Record<string,
  string>`, `validarPasoIdentidad(datos: { nombre: string; direccion: string; coords: { lat: number;
  lng: number } | null }): ErroresCampo`, `validarPasoPoliticas(datos: {
  horasCancelacionAntesPartido: number; minutosGraciaCancelacion: number; montoSenaDefault: number
  }): ErroresCampo`, `type DatosPasoIdentidad = { nombre: string; direccion: string; latitud: number;
  longitud: number; servicios: Servicio[]; fotos: File[] }`, `type DatosPasoPoliticas = {
  requiereSena: boolean; requiereTelefonoVerificado: boolean; montoSenaDefault: number;
  horasCancelacionAntesPartido: number; minutosGraciaCancelacion: number }`. Consumidos por los Tasks
  3, 4 y 5.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/panel/wizard-onboarding.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import { calcularSlugPreview, validarPasoIdentidad, validarPasoPoliticas } from "./wizard-onboarding";

describe("calcularSlugPreview", () => {
  it("pasa a minúsculas y separa por guiones", () => {
    expect(calcularSlugPreview("Club Atlético Pilar")).toBe("club-atletico-pilar");
  });

  it("saca acentos y diéresis", () => {
    expect(calcularSlugPreview("Ñandú Fútbol Club")).toBe("nandu-futbol-club");
  });

  it("colapsa símbolos y espacios repetidos en un solo guión", () => {
    expect(calcularSlugPreview("El  Súper   Complejo!!")).toBe("el-super-complejo");
  });

  it("saca guiones al principio y al final", () => {
    expect(calcularSlugPreview("  -Pilar-  ")).toBe("pilar");
  });

  it("un nombre vacío o sin caracteres alfanuméricos cae a 'complejo'", () => {
    expect(calcularSlugPreview("")).toBe("complejo");
    expect(calcularSlugPreview("   ")).toBe("complejo");
    expect(calcularSlugPreview("###")).toBe("complejo");
  });
});

describe("validarPasoIdentidad", () => {
  const base = { nombre: "Club Pilar", direccion: "Falsa 123", coords: { lat: -34.1, lng: -58.9 } };

  it("sin errores cuando todo está completo", () => {
    expect(validarPasoIdentidad(base)).toEqual({});
  });

  it("nombre vacío o solo espacios", () => {
    expect(validarPasoIdentidad({ ...base, nombre: "  " })).toEqual({
      nombre: "Falta el nombre del complejo.",
    });
  });

  it("dirección vacía", () => {
    expect(validarPasoIdentidad({ ...base, direccion: "" })).toEqual({
      direccion: "Falta la dirección.",
    });
  });

  it("sin ubicación resuelta", () => {
    expect(validarPasoIdentidad({ ...base, coords: null })).toEqual({
      ubicacion: "Elegí una localidad para ubicar el complejo.",
    });
  });

  it("acumula varios errores a la vez", () => {
    expect(validarPasoIdentidad({ nombre: "", direccion: "", coords: null })).toEqual({
      nombre: "Falta el nombre del complejo.",
      direccion: "Falta la dirección.",
      ubicacion: "Elegí una localidad para ubicar el complejo.",
    });
  });
});

describe("validarPasoPoliticas", () => {
  const base = { horasCancelacionAntesPartido: 24, minutosGraciaCancelacion: 30, montoSenaDefault: 0 };

  it("sin errores con los valores por defecto", () => {
    expect(validarPasoPoliticas(base)).toEqual({});
  });

  it("horas negativas o por encima de 168", () => {
    expect(validarPasoPoliticas({ ...base, horasCancelacionAntesPartido: -1 }).horasCancelacionAntesPartido).toBe(
      "Tiene que ser un número entero entre 0 y 168.",
    );
    expect(validarPasoPoliticas({ ...base, horasCancelacionAntesPartido: 169 }).horasCancelacionAntesPartido).toBe(
      "Tiene que ser un número entero entre 0 y 168.",
    );
  });

  it("minutos negativos o por encima de 1440", () => {
    expect(validarPasoPoliticas({ ...base, minutosGraciaCancelacion: -1 }).minutosGraciaCancelacion).toBe(
      "Tiene que ser un número entero entre 0 y 1440.",
    );
    expect(validarPasoPoliticas({ ...base, minutosGraciaCancelacion: 1441 }).minutosGraciaCancelacion).toBe(
      "Tiene que ser un número entero entre 0 y 1440.",
    );
  });

  it("monto de seña por defecto negativo", () => {
    expect(validarPasoPoliticas({ ...base, montoSenaDefault: -100 }).montoSenaDefault).toBe(
      "Tiene que ser un número entero mayor o igual a 0.",
    );
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/panel/wizard-onboarding.test.ts`
Expected: FAIL — `Cannot find module './wizard-onboarding'` (el archivo todavía no existe).

- [ ] **Step 3: Implementación mínima**

Crear `src/lib/panel/wizard-onboarding.ts`:

```typescript
import type { Servicio } from "@/lib/api/tipos/comunes";

/**
 * Datos que entrega cada paso al confirmarlo. `fotos`/`montoSenaDefault` no
 * viajan en ningún DTO del backend — fotos se sube aparte por su propio
 * endpoint, montoSenaDefault es un valor local que solo sirve para prellenar
 * el formulario de cancha en el paso 4 (fuera del alcance de esta fase).
 */
export type DatosPasoIdentidad = {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  servicios: Servicio[];
  fotos: File[];
};

export type DatosPasoPoliticas = {
  requiereSena: boolean;
  requiereTelefonoVerificado: boolean;
  montoSenaDefault: number;
  horasCancelacionAntesPartido: number;
  minutosGraciaCancelacion: number;
};

export type ErroresCampo = Record<string, string>;

const HORAS_CANCELACION_MAX = 168;
const MINUTOS_GRACIA_MAX = 1440;

/**
 * Mismo algoritmo que `SlugGenerator.normalizar` del backend
 * (sacaladelangulo/establecimiento/service/SlugGenerator.java): minúsculas,
 * sin diacríticos, todo lo no alfanumérico se colapsa en un guión, sin
 * guiones al borde. El backend es quien genera el slug real (con sufijo si
 * hay colisión) — esto es sólo un preview, nunca se manda al servidor.
 */
export function calcularSlugPreview(nombre: string): string {
  const descompuesto = nombre.toLowerCase().normalize("NFD");
  const sinDiacriticos = descompuesto.replace(/[\u0300-\u036f]/g, "");
  const conGuiones = sinDiacriticos.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return conGuiones === "" ? "complejo" : conGuiones;
}

export function validarPasoIdentidad(datos: {
  nombre: string;
  direccion: string;
  coords: { lat: number; lng: number } | null;
}): ErroresCampo {
  const errores: ErroresCampo = {};
  if (!datos.nombre.trim()) errores.nombre = "Falta el nombre del complejo.";
  if (!datos.direccion.trim()) errores.direccion = "Falta la dirección.";
  if (!datos.coords) errores.ubicacion = "Elegí una localidad para ubicar el complejo.";
  return errores;
}

export function validarPasoPoliticas(datos: {
  horasCancelacionAntesPartido: number;
  minutosGraciaCancelacion: number;
  montoSenaDefault: number;
}): ErroresCampo {
  const errores: ErroresCampo = {};
  if (
    !Number.isInteger(datos.horasCancelacionAntesPartido) ||
    datos.horasCancelacionAntesPartido < 0 ||
    datos.horasCancelacionAntesPartido > HORAS_CANCELACION_MAX
  ) {
    errores.horasCancelacionAntesPartido = `Tiene que ser un número entero entre 0 y ${HORAS_CANCELACION_MAX}.`;
  }
  if (
    !Number.isInteger(datos.minutosGraciaCancelacion) ||
    datos.minutosGraciaCancelacion < 0 ||
    datos.minutosGraciaCancelacion > MINUTOS_GRACIA_MAX
  ) {
    errores.minutosGraciaCancelacion = `Tiene que ser un número entero entre 0 y ${MINUTOS_GRACIA_MAX}.`;
  }
  if (!Number.isInteger(datos.montoSenaDefault) || datos.montoSenaDefault < 0) {
    errores.montoSenaDefault = "Tiene que ser un número entero mayor o igual a 0.";
  }
  return errores;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/panel/wizard-onboarding.test.ts`
Expected: PASS — 12 tests OK.

- [ ] **Step 5: Commit**

```bash
git add src/lib/panel/wizard-onboarding.ts src/lib/panel/wizard-onboarding.test.ts
git commit -m "feat(wizard): agrega helpers puros de slug preview y validacion por paso"
```

---

### Task 2: `BarraProgresoWizard` — barra de progreso compartida

**Files:**
- Create: `src/components/panel/wizard-onboarding/barra-progreso-wizard.tsx`

**Interfaces:**
- Produces: `BarraProgresoWizard({ pasoActual: number })`, consumido por el Task 6.

Los 6 pasos completos del wizard (Identidad, Políticas, Horarios, Canchas, Tarifas, Cobros) se listan
siempre, aunque en esta fase sólo los dos primeros tengan pantalla real — es la misma barra que van a
usar las fases 2 y 3.

- [ ] **Step 1: Crear el componente**

Crear `src/components/panel/wizard-onboarding/barra-progreso-wizard.tsx`:

```tsx
import { Check } from "lucide-react";

const PASOS = ["Identidad", "Políticas", "Horarios", "Canchas", "Tarifas", "Cobros"];

/**
 * Barra de progreso única del wizard: reemplaza las 4 variantes distintas
 * que traía cada pantalla de Stitch (con/sin etiquetas, 4 vs. 6 puntos,
 * texto "Paso X de Y" presente o no). Los puntos "perforan" el track de
 * fondo con `bg-white`, porque este componente siempre vive dentro de la
 * card blanca del wizard (ver WizardOnboarding, Task 6).
 */
export function BarraProgresoWizard({ pasoActual }: { pasoActual: number }) {
  return (
    <div className="w-full">
      <p className="mb-4 text-center text-xs font-semibold text-grafito">
        Paso {pasoActual} de {PASOS.length}
      </p>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-borde" aria-hidden />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-azul transition-all duration-500"
          style={{ width: `${(Math.max(pasoActual - 1, 0) / (PASOS.length - 1)) * 100}%` }}
          aria-hidden
        />
        {PASOS.map((etiqueta, indice) => {
          const numero = indice + 1;
          const completado = numero < pasoActual;
          const activo = numero === pasoActual;
          return (
            <div key={etiqueta} className="relative z-10 flex flex-col items-center gap-2 bg-white px-1">
              <div
                className={`flex size-6 items-center justify-center rounded-full font-display text-xs font-bold ${
                  completado || activo ? "bg-azul text-white" : "border-2 border-borde bg-white text-grafito"
                }`}
              >
                {completado ? <Check className="size-3.5" aria-hidden /> : numero}
              </div>
              <span className={`hidden text-xs font-semibold sm:block ${activo ? "text-azul" : "text-grafito"}`}>
                {etiqueta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `barra-progreso-wizard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/barra-progreso-wizard.tsx
git commit -m "feat(wizard): agrega la barra de progreso compartida del wizard"
```

---

### Task 3: `PasoIdentidad`

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-identidad.tsx`

**Interfaces:**
- Consumes: `SelectorUbicacion`/`type Ubicacion` (`@/components/canche/selector-ubicacion`),
  `geocodificarDireccion` (`@/lib/api/georef`), `MapaUbicacion` (`@/components/canche/mapa-ubicacion`,
  cargado con `next/dynamic` y `ssr: false` — toca `window` al armar sus íconos), `SERVICIOS`
  (`@/lib/servicios`), `validarPasoIdentidad`/`type DatosPasoIdentidad`/`calcularSlugPreview`
  (Task 1).
- Produces: `PasoIdentidad({ datosIniciales: DatosPasoIdentidad | null; onContinuar: (datos:
  DatosPasoIdentidad) => void })`, consumido por el Task 6. La resolución de ubicación (selector +
  geocodificación + pin arrastrable + prioridad pin manual > geocodificado > centroide de localidad)
  replica el mismo patrón de `src/components/panel/form-datos-complejo.tsx:66-134`, adaptado para no
  incluir `requiereSena`/`requiereTelefonoVerificado` (van en el paso 2, Task 4).

- [ ] **Step 1: Crear el componente**

Crear `src/components/panel/wizard-onboarding/paso-identidad.tsx`:

```tsx
"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trash2, Upload } from "lucide-react";
import { SelectorUbicacion, type Ubicacion } from "@/components/canche/selector-ubicacion";
import { geocodificarDireccion } from "@/lib/api/georef";
import { SERVICIOS } from "@/lib/servicios";
import { calcularSlugPreview, validarPasoIdentidad, type DatosPasoIdentidad } from "@/lib/panel/wizard-onboarding";
import type { Servicio } from "@/lib/api/tipos/comunes";

const MapaUbicacion = dynamic(
  () => import("@/components/canche/mapa-ubicacion").then((mod) => mod.MapaUbicacion),
  { ssr: false },
);

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

const MS_DEBOUNCE_DIRECCION = 400;
const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

type FotoEnCola = { id: string; archivo: File; previewUrl: string };

export function PasoIdentidad({
  datosIniciales,
  onContinuar,
}: {
  datosIniciales: DatosPasoIdentidad | null;
  onContinuar: (datos: DatosPasoIdentidad) => void;
}) {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [direccion, setDireccion] = useState(datosIniciales?.direccion ?? "");
  const [servicios, setServicios] = useState<Servicio[]>(datosIniciales?.servicios ?? []);
  // Si el dueño vuelve "Atrás" desde el paso 2, las fotos que ya había
  // elegido se re-hidratan acá (con URLs de preview nuevas) en vez de
  // perderse — datosIniciales.fotos son los mismos File, sólo hace falta
  // volver a armarles la miniatura.
  const [fotos, setFotos] = useState<FotoEnCola[]>(() =>
    (datosIniciales?.fotos ?? []).map((archivo) => ({
      id: crypto.randomUUID(),
      archivo,
      previewUrl: URL.createObjectURL(archivo),
    })),
  );
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [pin, setPin] = useState<{
    lat: number;
    lng: number;
    direccion: string;
    provincia?: string;
    departamento?: string;
  } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [arrastrando, setArrastrando] = useState(false);

  const [direccionDebounced, setDireccionDebounced] = useState(direccion.trim());
  useEffect(() => {
    const id = setTimeout(() => setDireccionDebounced(direccion.trim()), MS_DEBOUNCE_DIRECCION);
    return () => clearTimeout(id);
  }, [direccion]);

  // Al desmontar (avanzar de paso o salir del wizard) se liberan los blob: URL
  // de las miniaturas — si no, quedan colgados hasta recargar la página.
  useEffect(() => {
    return () => {
      fotos.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pinVigente =
    pin && pin.direccion === direccionDebounced && pin.provincia === ubicacion?.provincia && pin.departamento === ubicacion?.departamento
      ? pin
      : null;

  function moverPin(coords: { lat: number; lng: number }) {
    setPin({ ...coords, direccion: direccionDebounced, provincia: ubicacion?.provincia, departamento: ubicacion?.departamento });
  }

  const direccionGeocodificada = useQuery({
    queryKey: ["georef", "direccion", direccionDebounced, ubicacion?.provincia, ubicacion?.departamento],
    queryFn: ({ signal }) =>
      geocodificarDireccion(direccionDebounced, { provincia: ubicacion!.provincia!, departamento: ubicacion?.departamento }, signal),
    enabled: direccionDebounced.length >= 5 && Boolean(ubicacion?.provincia),
    staleTime: 60 * 60_000,
    retry: false,
  });
  const geocodificado = direccionGeocodificada.data;

  const coords =
    pinVigente ??
    (geocodificado ? { lat: geocodificado.lat, lng: geocodificado.lng } : null) ??
    (ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null);

  const slugPreview = calcularSlugPreview(nombre);

  function alternarServicio(valor: Servicio) {
    setServicios((prev) => (prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]));
  }

  function agregarFotos(archivos: File[]) {
    const nuevas = archivos
      .filter((a) => TIPOS_ACEPTADOS.includes(a.type) && a.size <= TAMANO_MAXIMO)
      .map((archivo) => ({ id: crypto.randomUUID(), archivo, previewUrl: URL.createObjectURL(archivo) }));
    setFotos((prev) => [...prev, ...nuevas]);
  }

  function quitarFoto(id: string) {
    setFotos((prev) => {
      const objetivo = prev.find((f) => f.id === id);
      if (objetivo) URL.revokeObjectURL(objetivo.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function onSeleccionarArchivos(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length) agregarFotos(archivos);
  }

  function onDropArchivos(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastrando(false);
    agregarFotos(Array.from(e.dataTransfer.files));
  }

  function continuar(e: FormEvent) {
    e.preventDefault();
    const erroresValidacion = validarPasoIdentidad({ nombre, direccion, coords });
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    onContinuar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud: coords!.lat,
      longitud: coords!.lng,
      servicios,
      fotos: fotos.map((f) => f.archivo),
    });
  }

  return (
    <form onSubmit={continuar} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Identidad del complejo</h2>
        <p className="mt-1 text-sm text-grafito">Contanos los datos básicos de tu establecimiento.</p>
      </div>

      <div>
        <label htmlFor="wizard-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre del complejo
        </label>
        <input
          id="wizard-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Club Atlético Pilar"
          className={campoClase}
        />
        {errores.nombre && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.nombre}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 block text-xs font-semibold text-grafito">Enlace de reserva</p>
        <p className="rounded-input bg-humo px-3 py-2.5 text-sm text-grafito">
          saque.app/complejo/<span className="font-semibold text-tinta">{slugPreview}</span>
        </p>
        <p className="mt-1 text-xs text-grafito">Se genera solo a partir del nombre — no se puede editar.</p>
      </div>

      <div>
        <label htmlFor="wizard-direccion" className="mb-1 block text-xs font-semibold text-grafito">
          Dirección
        </label>
        <input
          id="wizard-direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Calle Falsa 123, Pilar, Buenos Aires"
          className={campoClase}
        />
        {errores.direccion && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.direccion}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="wizard-ubicacion" className="mb-1 block text-xs font-semibold text-grafito">
          Localidad
        </label>
        <div className="rounded-input bg-humo px-3 py-1.5">
          <SelectorUbicacion id="wizard-ubicacion" value={ubicacion} onChange={setUbicacion} />
        </div>
        <p className="mt-1 text-xs text-grafito">
          {pinVigente
            ? `Ajustaste el pin a mano: se va a guardar ahí (${pinVigente.lat.toFixed(4)}, ${pinVigente.lng.toFixed(4)}).`
            : direccionGeocodificada.isFetching
              ? "Buscando la dirección exacta…"
              : geocodificado
                ? `Se va a guardar en ${geocodificado.etiqueta} (${geocodificado.lat.toFixed(4)}, ${geocodificado.lng.toFixed(4)}).`
                : ubicacion
                  ? `No encontramos esa calle: se va a guardar cerca del centro de ${ubicacion.etiqueta}. Arrastrá el pin para afinarlo.`
                  : "Buscá la localidad donde está el complejo."}
        </p>
        {errores.ubicacion && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.ubicacion}
          </p>
        )}
        {coords && (
          <div className="mt-3 h-56 w-full overflow-hidden rounded-input">
            <MapaUbicacion lat={coords.lat} lng={coords.lng} onMover={moverPin} />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-grafito">Servicios disponibles</p>
        <div className="flex flex-wrap gap-2">
          {SERVICIOS.map(({ valor, etiqueta, Icono }) => {
            const activo = servicios.includes(valor);
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => alternarServicio(valor)}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                  activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
                }`}
              >
                <Icono className="size-4 shrink-0" aria-hidden />
                {etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-grafito">Fotos del complejo</p>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={onDropArchivos}
          className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed text-center transition-colors ${
            arrastrando ? "border-azul bg-celeste-suave/40" : "border-borde bg-humo hover:border-azul"
          }`}
        >
          <Upload className="size-5 text-grafito" aria-hidden />
          <span className="text-sm font-semibold text-tinta">Arrastrá tus fotos acá o hacé click para elegir</span>
          <span className="text-xs text-grafito">JPG, PNG o WEBP. Hasta 5MB por foto.</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onSeleccionarArchivos} />
        </label>
        <p className="mt-1 text-xs text-grafito">
          Se suben apenas se crea el complejo, al confirmar el paso 2 — no hace falta esperar acá.
        </p>

        {fotos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fotos.map((f) => (
              <div key={f.id} className="group relative aspect-[4/3] overflow-hidden rounded-input border border-borde">
                <img src={f.previewUrl} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFoto(f.id)}
                  aria-label="Quitar foto"
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-tinta/70 text-white opacity-0 transition-opacity hover:bg-cancelado group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `paso-identidad.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-identidad.tsx
git commit -m "feat(wizard): agrega el paso 1 (identidad) del wizard de onboarding"
```

---

### Task 4: `PasoPoliticas`

**Files:**
- Create: `src/components/panel/wizard-onboarding/paso-politicas.tsx`

**Interfaces:**
- Consumes: `validarPasoPoliticas`/`type DatosPasoPoliticas` (Task 1), `PlanSuscripcion` (`@/lib/api/tipos/comunes`).
- Produces: `PasoPoliticas({ plan: PlanSuscripcion | undefined; guardando: boolean; error: string |
  null; onAtras: () => void; onConfirmar: (datos: DatosPasoPoliticas) => void })`, consumido por el
  Task 6. `requiereSena` se fuerza a `true` y se deshabilita únicamente cuando `plan === "FREE"` —
  igual que `form-datos-complejo.tsx:143` (`TRIAL` puede elegir libremente).

- [ ] **Step 1: Crear el componente**

Crear `src/components/panel/wizard-onboarding/paso-politicas.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { validarPasoPoliticas, type DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { PlanSuscripcion } from "@/lib/api/tipos/comunes";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

export function PasoPoliticas({
  plan,
  guardando,
  error,
  onAtras,
  onConfirmar,
}: {
  plan: PlanSuscripcion | undefined;
  guardando: boolean;
  error: string | null;
  onAtras: () => void;
  onConfirmar: (datos: DatosPasoPoliticas) => void;
}) {
  const senaForzada = plan === "FREE";

  const [requiereSena, setRequiereSena] = useState(false);
  const [requiereTelefonoVerificado, setRequiereTelefonoVerificado] = useState(false);
  const [montoSenaDefault, setMontoSenaDefault] = useState("0");
  const [horas, setHoras] = useState("24");
  const [minutos, setMinutos] = useState("30");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const senaActiva = senaForzada || requiereSena;

  function confirmar(e: FormEvent) {
    e.preventDefault();
    const datos = {
      horasCancelacionAntesPartido: Number(horas),
      minutosGraciaCancelacion: Number(minutos),
      montoSenaDefault: Number(montoSenaDefault),
    };
    const erroresValidacion = validarPasoPoliticas(datos);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    onConfirmar({
      requiereSena: senaActiva,
      requiereTelefonoVerificado,
      ...datos,
    });
  }

  return (
    <form onSubmit={confirmar} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Políticas de reserva</h2>
        <p className="mt-1 text-sm text-grafito">Definí cómo querés que funcionen las reservas en tu complejo.</p>
      </div>

      <div className="space-y-3 rounded-input border border-borde p-4">
        <label className="flex items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-tinta">Requiere seña para reservar</span>
            <span className="block text-xs text-grafito">
              {senaForzada
                ? "En el plan gratuito la seña es obligatoria y no se puede desactivar."
                : "Solicita un pago parcial anticipado para confirmar la cancha."}
            </span>
          </span>
          <input
            type="checkbox"
            checked={senaActiva}
            disabled={senaForzada}
            onChange={(e) => setRequiereSena(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 rounded border-borde accent-azul disabled:opacity-60"
          />
        </label>

        {senaActiva && (
          <div className="border-t border-borde pt-3">
            <label htmlFor="wizard-monto-sena" className="mb-1 block text-xs font-semibold text-grafito">
              Monto de seña por defecto ($)
            </label>
            <input
              id="wizard-monto-sena"
              type="number"
              min={0}
              value={montoSenaDefault}
              onChange={(e) => setMontoSenaDefault(e.target.value)}
              placeholder="Ej. 1500"
              className={campoClase}
            />
            <p className="mt-1 text-xs text-grafito">
              Sólo un valor de referencia: se va a usar para prellenar la seña de cada cancha nueva, que después
              podés cambiar cancha por cancha.
            </p>
            {errores.montoSenaDefault && (
              <p className="mt-1 text-xs text-cancelado" role="alert">
                {errores.montoSenaDefault}
              </p>
            )}
          </div>
        )}
      </div>

      <label className="flex items-start justify-between gap-3 rounded-input border border-borde p-4">
        <span>
          <span className="block text-sm font-semibold text-tinta">Requiere teléfono verificado</span>
          <span className="block text-xs text-grafito">Los usuarios van a tener que validar su número por SMS.</span>
        </span>
        <input
          type="checkbox"
          checked={requiereTelefonoVerificado}
          onChange={(e) => setRequiereTelefonoVerificado(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 rounded border-borde accent-azul"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 border-t border-borde pt-6 sm:grid-cols-2">
        <div>
          <label htmlFor="wizard-horas" className="mb-1 block text-xs font-semibold text-grafito">
            Horas de anticipación para cancelar
          </label>
          <input id="wizard-horas" type="number" min={0} max={168} value={horas} onChange={(e) => setHoras(e.target.value)} className={campoClase} />
          {errores.horasCancelacionAntesPartido && (
            <p className="mt-1 text-xs text-cancelado" role="alert">
              {errores.horasCancelacionAntesPartido}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="wizard-minutos" className="mb-1 block text-xs font-semibold text-grafito">
            Minutos de gracia tras reservar
          </label>
          <input id="wizard-minutos" type="number" min={0} max={1440} value={minutos} onChange={(e) => setMinutos(e.target.value)} className={campoClase} />
          {errores.minutosGraciaCancelacion && (
            <p className="mt-1 text-xs text-cancelado" role="alert">
              {errores.minutosGraciaCancelacion}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAtras}
          disabled={guardando}
          className="flex h-11 items-center rounded-full border border-borde px-6 font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
        >
          {guardando ? "Creando complejo..." : "Crear complejo"}
          {!guardando && <ArrowRight className="size-4" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `paso-politicas.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/paso-politicas.tsx
git commit -m "feat(wizard): agrega el paso 2 (politicas) del wizard de onboarding"
```

---

### Task 5: Hook `useWizardOnboarding` — estado y creación del establecimiento

**Files:**
- Create: `src/hooks/api/use-wizard-onboarding.ts`

**Interfaces:**
- Consumes: `usePerfil` (`@/hooks/api/use-perfil`), `establecimientos` endpoints —
  `crear`/`subirFoto`/`actualizarPoliticaCancelacion` (`@/lib/api/endpoints/establecimientos`),
  `keys.establecimientos.mios` (`@/lib/api/keys`), `ApiError` (`@/lib/api/errores`),
  `DatosPasoIdentidad`/`DatosPasoPoliticas` (Task 1).
- Produces: `useWizardOnboarding(): { pasoActual: 1 | 2; plan: PlanSuscripcion | undefined;
  datosIdentidad: DatosPasoIdentidad | null; establecimientoCreado: EstablecimientoResponse | null;
  creando: boolean; errorCreacion: ApiError | null; erroresFotos: string[]; confirmarIdentidad:
  (datos: DatosPasoIdentidad) => void; volverAIdentidad: () => void; confirmarPoliticas: (datos:
  DatosPasoPoliticas) => void }`, consumido por el Task 6.

**Nota de orquestación:** al confirmar el paso 2 se ejecutan tres llamadas en secuencia: `POST
/establecimientos` (con los datos de ambos pasos), la subida en cola de las fotos que quedaron
pendientes del paso 1 (tolerante a fallos individuales — una foto que falla no aborta las demás ni la
creación, que ya sucedió), y `PATCH /establecimientos/{id}/politicas-cancelacion`. Si el paso 1 (crear)
falla, no se intenta nada más y el error se muestra en el paso 2. Si falla una foto o la política, el
establecimiento YA existe (nunca se revierte) — se informa aparte, sin bloquear el éxito de la
creación.

- [ ] **Step 1: Crear el hook**

Crear `src/hooks/api/use-wizard-onboarding.ts`:

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { usePerfil } from "@/hooks/api/use-perfil";
import type { DatosPasoIdentidad, DatosPasoPoliticas } from "@/lib/panel/wizard-onboarding";
import type { EstablecimientoResponse } from "@/lib/api/tipos/establecimientos";

/**
 * Estado y orquestación del wizard de onboarding (fase 1: identidad +
 * políticas). El establecimiento se crea recién al confirmar el paso 2 — ver
 * la nota de orquestación en el plan de esta tarea.
 */
export function useWizardOnboarding() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();

  const [pasoActual, setPasoActual] = useState<1 | 2>(1);
  const [datosIdentidad, setDatosIdentidad] = useState<DatosPasoIdentidad | null>(null);
  const [establecimientoCreado, setEstablecimientoCreado] = useState<EstablecimientoResponse | null>(null);
  const [erroresFotos, setErroresFotos] = useState<string[]>([]);

  const crear = useMutation<EstablecimientoResponse, ApiError, DatosPasoPoliticas>({
    mutationFn: async (politicas) => {
      if (!datosIdentidad) {
        throw new ApiError({ status: 0, mensaje: "Falta completar el paso 1." });
      }

      const establecimiento = await endpointEstablecimientos.crear({
        nombre: datosIdentidad.nombre,
        direccion: datosIdentidad.direccion,
        latitud: datosIdentidad.latitud,
        longitud: datosIdentidad.longitud,
        requiereSena: politicas.requiereSena,
        requiereTelefonoVerificado: politicas.requiereTelefonoVerificado,
        horariosAtencion: [],
        servicios: datosIdentidad.servicios,
      });

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
      queryClient.invalidateQueries({ queryKey: keys.establecimientos.mios() });
      setEstablecimientoCreado(establecimiento);
    },
  });

  function confirmarIdentidad(datos: DatosPasoIdentidad) {
    setDatosIdentidad(datos);
    setPasoActual(2);
  }

  function volverAIdentidad() {
    setPasoActual(1);
  }

  function confirmarPoliticas(politicas: DatosPasoPoliticas) {
    crear.mutate(politicas);
  }

  return {
    pasoActual,
    plan: perfil?.planSuscripcion,
    datosIdentidad,
    establecimientoCreado,
    creando: crear.isPending,
    errorCreacion: crear.isError ? crear.error : null,
    erroresFotos,
    confirmarIdentidad,
    volverAIdentidad,
    confirmarPoliticas,
  };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `use-wizard-onboarding.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/api/use-wizard-onboarding.ts
git commit -m "feat(wizard): agrega el hook de estado y creacion del wizard de onboarding"
```

---

### Task 6: `WizardOnboarding` — orquestador y pantalla de éxito

**Files:**
- Create: `src/components/panel/wizard-onboarding/wizard-onboarding.tsx`

**Interfaces:**
- Consumes: `BarraProgresoWizard` (Task 2), `PasoIdentidad` (Task 3), `PasoPoliticas` (Task 4),
  `useWizardOnboarding` (Task 5), `ApiError`/`mensajeVisible` (`@/lib/api/errores`).
- Produces: `WizardOnboarding()`, consumido por el Task 7 (la ruta).

Al terminar la creación, la pantalla de éxito no promete lo que esta fase no construye: en vez de
avanzar a un paso 3 que todavía no existe, manda al dueño a su panel — desde ahí, `/panel/configuracion`,
`/panel/canchas` y `/panel/precios` ya cubren horarios, canchas, tarifas, servicios, fotos y política de
cancelación.

- [ ] **Step 1: Crear el componente**

Crear `src/components/panel/wizard-onboarding/wizard-onboarding.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BarraProgresoWizard } from "./barra-progreso-wizard";
import { PasoIdentidad } from "./paso-identidad";
import { PasoPoliticas } from "./paso-politicas";
import { useWizardOnboarding } from "@/hooks/api/use-wizard-onboarding";
import { ApiError, mensajeVisible } from "@/lib/api/errores";

export function WizardOnboarding() {
  const router = useRouter();
  const wizard = useWizardOnboarding();

  if (wizard.establecimientoCreado) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-disponible-suave">
          <CheckCircle2 className="size-10 text-disponible" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-tinta">¡Tu complejo está creado!</h1>
          <p className="mt-2 text-sm text-grafito">
            {wizard.establecimientoCreado.nombre} ya existe en Saque. Para terminar de configurarlo —horarios,
            canchas, tarifas y cobros— entrá a tu panel: cada sección ya está lista para usar.
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
            onAtras={wizard.volverAIdentidad}
            onConfirmar={wizard.confirmarPoliticas}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `wizard-onboarding.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/wizard-onboarding/wizard-onboarding.tsx
git commit -m "feat(wizard): agrega el orquestador y la pantalla de exito del wizard"
```

---

### Task 7: Ruta `/panel/bienvenida`

**Files:**
- Create: `src/app/panel/bienvenida/page.tsx`

**Interfaces:**
- Consumes: `WizardOnboarding` (Task 6).

Sin `SidebarPanel`/`HeaderPanel` a propósito — es una pantalla transaccional (mismo criterio que
Stitch: "Navigation shells suppressed for transactional/onboarding screens").

- [ ] **Step 1: Crear la página**

Crear `src/app/panel/bienvenida/page.tsx`:

```tsx
import { WizardOnboarding } from "@/components/panel/wizard-onboarding/wizard-onboarding";

export default function PanelBienvenida() {
  return <WizardOnboarding />;
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/app/panel/bienvenida/page.tsx
git commit -m "feat(wizard): agrega la ruta /panel/bienvenida"
```

---

### Task 8: Redirigir a `/panel/bienvenida` cuando el dueño no tiene establecimiento

**Files:**
- Modify: `src/app/panel/agenda/page.tsx`

**Interfaces:**
- Consumes: `useEstablecimientoActivo` (ya importado en el archivo, `@/hooks/api/use-perfil`) — se
  agrega su campo `cargando` a la desestructuración existente.

Hoy no existe ningún redirect "OWNER sin establecimiento → wizard" (`entrar()` en
`src/app/ingresar/page.tsx:120` manda a todo OWNER/ADMIN directo a `/panel/agenda`, sin distinguir).
Se agrega el guard en `/panel/agenda` por ser el destino post-login real, siguiendo el mismo patrón que
ya usa ese archivo para su propio redirect condicional (`src/app/panel/agenda/page.tsx:95-97`, el
`useEffect` de `bloqueadoPorCaja`/`perfilPendiente`/`puedeVerAgenda`).

> **Corrección post-escritura del plan:** la primera versión de este Task citaba un `useEffect` de
> `rol === "empleado"` que en realidad vive en `panel/configuracion/page.tsx`, no en este archivo — se
> verificó contra el código real del worktree antes de dispatchear y se corrigió acá. `rol` se define en
> la línea 53 de este archivo (`const rol = useRolPanel();`).

- [ ] **Step 1: Ubicar el punto de inserción**

En `src/app/panel/agenda/page.tsx`, la línea 64 desestructura:

```tsx
const { establecimientoId, establecimiento } = useEstablecimientoActivo();
```

y en las líneas 95-97 ya hay un `useEffect` de redirect (con `rol` ya definido en la línea 53):

```tsx
useEffect(() => {
  if (!bloqueadoPorCaja && !perfilPendiente && !puedeVerAgenda) router.replace("/panel/caja");
}, [bloqueadoPorCaja, perfilPendiente, puedeVerAgenda, router]);
```

- [ ] **Step 2: Agregar `cargando` a la desestructuración**

Reemplazar la línea 64:

```tsx
const { establecimientoId, establecimiento } = useEstablecimientoActivo();
```

por:

```tsx
const { establecimientoId, establecimiento, cargando: cargandoEstablecimiento } = useEstablecimientoActivo();
```

- [ ] **Step 3: Agregar el nuevo `useEffect` de redirect**

Justo debajo del `useEffect` existente (el de `!puedeVerAgenda` → `/panel/caja`, líneas 95-97), agregar:

```tsx
// Un dueño sin establecimiento todavía no puede usar ningún otro panel:
// se lo manda al wizard de alta en cuanto se sabe con certeza que no tiene
// uno (después de que useEstablecimientoActivo termine de cargar).
useEffect(() => {
  if (!cargandoEstablecimiento && rol === "dueno" && establecimientoId === null) {
    router.replace("/panel/bienvenida");
  }
}, [cargandoEstablecimiento, rol, establecimientoId, router]);
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `panel/agenda/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/panel/agenda/page.tsx
git commit -m "fix(panel): redirige al wizard de onboarding a un dueno sin establecimiento"
```

---

### Task 9: Verificación manual end-to-end

**Files:** ninguno — solo uso del dev server. Necesita el backend (`sacaladelangulo`) corriendo en
`http://localhost:8080` (o el valor de `NEXT_PUBLIC_API_URL`), con una cuenta OWNER **sin ningún
establecimiento todavía** (crear una nueva desde `/ingresar` si hace falta).

- [ ] **Step 1: Levantar ambos servidores**

Run (backend, en `c:\Users\USER\Desktop\sacaladelangulo`): `./mvnw spring-boot:run`
Run (frontend, en `c:\Users\USER\Desktop\saque-front`): `npm run dev` (dejar ambos corriendo)

- [ ] **Step 2: Redirect automático**

Loguearse con la cuenta OWNER sin establecimiento. Confirmar que, en vez de quedar en
`/panel/agenda`, redirige sola a `/panel/bienvenida` y muestra el paso 1 (Identidad), sin sidebar ni
header del panel.

- [ ] **Step 3: Paso 1 — validación**

Tocar "Continuar" sin cargar nada. Confirmar que aparecen los tres errores (nombre, dirección,
ubicación) y que NO avanza de paso.

- [ ] **Step 4: Paso 1 — ubicación y mapa**

Cargar un nombre (ej. "Club de prueba"). Confirmar que el preview de slug debajo se actualiza en vivo
(`club-de-prueba`). Buscar una localidad en el selector, escribir una dirección real de esa localidad
y esperar a que aparezca el mapa con el pin. Arrastrar el pin: el texto de abajo tiene que cambiar a
"Ajustaste el pin a mano...".

- [ ] **Step 5: Paso 1 — servicios y fotos**

Tildar 2-3 chips de servicios. Arrastrar (o seleccionar por click) 2 imágenes de prueba: confirmar que
aparecen las miniaturas y que se pueden quitar con el botón de basura. Tocar "Continuar": avanza al
paso 2 y la barra de progreso marca el paso 1 como completado (✓).

- [ ] **Step 6: Paso 2 — plan TRIAL**

Con una cuenta recién creada (plan `TRIAL`), confirmar que el toggle "Requiere seña" arranca
destildado y SE PUEDE tildar/destildar libremente (no deshabilitado). Dejarlo destildado y tocar
"Crear complejo": no debe aparecer ningún error relacionado a Mercado Pago ni bloqueo alguno (ese gate
es del paso 6, fuera de esta fase).

- [ ] **Step 7: Paso 2 — validación de política de cancelación**

Cargar "200" en horas de anticipación: debe aparecer el error de rango (máx. 168) y no avanzar. Cargar
un valor válido (ej. 12) antes de continuar.

- [ ] **Step 8: Confirmar creación real**

Tocar "Crear complejo" con datos válidos. Confirmar que aparece la pantalla de éxito con el nombre
cargado. Ir a `/panel/configuracion` en otra pestaña (misma sesión): el complejo tiene que aparecer
con el nombre, dirección, servicios y fotos cargados en el wizard. Ir a la sección "Política de
cancelación" de esa misma pantalla: los valores de horas/minutos tienen que coincidir con los del
wizard.

- [ ] **Step 9: "Ir al panel" y no-regresión del redirect**

Tocar "Ir al panel" en la pantalla de éxito: navega a `/panel/agenda` y esta vez SE QUEDA ahí (ya no
redirige a `/panel/bienvenida`, porque el establecimiento ya existe).

- [ ] **Step 10: Plan FREE (si hay una cuenta a mano)**

Con una cuenta en plan `FREE`, repetir el paso 2: el toggle "Requiere seña" tiene que estar tildado y
deshabilitado, con el texto "En el plan gratuito la seña es obligatoria...".

- [ ] **Step 11: Lint y tests**

Run: `npm run lint`
Expected: sin errores nuevos en los archivos tocados.

Run: `npm run test`
Expected: PASS, incluyendo los 12 tests de `src/lib/panel/wizard-onboarding.test.ts`.

Run: `npx tsc --noEmit -p .`
Expected: sin errores.

---

## Nota: qué queda fuera de esta fase (a propósito)

- Pasos 3–6 (Horarios, Canchas, Tarifas, Cobros) del wizard — fases 2 y 3, planes separados.
- El estado `montoSenaDefault` que captura `PasoPoliticas` no se consume todavía en ningún lado (no
  hay paso 4 aún) — queda en el retorno de `confirmarPoliticas` sin usarse fuera de este plan porque
  la Fase 2 lo va a necesitar para prellenar `FormCancha`. No es un placeholder: el dato se captura y
  valida de verdad, sólo que su consumidor todavía no existe.
- MercadoPago (paso 6) y su gate sobre "Publicar" — no aplica a esta fase: acá no hay botón
  "Publicar", el cierre es "Crear complejo" seguido de "Ir al panel".
