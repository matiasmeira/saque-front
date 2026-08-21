# Header consciente de la sesión, con menú según el rol — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El header público deja de mostrar "Ingresar" fijo y pasa a reflejar la sesión real: carga,
no-logueado, o un menú de usuario con las opciones que corresponden al rol (PLAYER/OWNER/ADMIN/EMPLOYEE),
todo sin recargar la página al iniciar o cerrar sesión.

**Architecture:** El bug no es de estado ni de reactividad — `usePerfil()` (ya existente, exactamente
lo que el pedido llama "useMe") y `useHaySesion()` ya son la fuente de verdad reactiva del rol, y
`useLogin()`/`useLogout()` ya siembran/limpian ese cache correctamente. El bug es que
`HeaderPublico` nunca los consulta: su slot derecho es JSX estático. La solución extrae ese slot a un
componente cliente nuevo (`NavSesion`) que lee `usePerfil()`/`useHaySesion()` y decide qué mostrar; un
segundo componente (`MenuUsuario`) es el dropdown en sí (click-afuera + Escape para cerrar, sin
dependencias nuevas); y una función pura (`itemsMenuUsuario`) mapea rol → ítems de navegación, aislada
para poder testearla con vitest igual que el resto de `src/lib`.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query v5, TypeScript, Tailwind v4. Sin
infraestructura de testing de componentes/hooks en este repo (vitest solo cubre funciones puras en
`src/lib/**/*.test.ts`, ver `vitest.config.ts`) — la única pieza testeable automáticamente es
`itemsMenuUsuario`; el resto se verifica con el dev server, como en el resto de la zona pública.

**Spec:** El pedido original del usuario en esta conversación ("Tarea: header consciente de la sesión,
con menú según el rol del usuario"), con sus 5 estados del header y su checklist de verificación.

## Global Constraints

- Fuente de verdad del usuario: `GET /api/v1/usuarios/me`, ya envuelto en `usePerfil()`
  (`src/hooks/api/use-perfil.ts:23-32`). NO crear un hook `useMe` nuevo — sería duplicar exactamente
  esto.
- NO tocar `useLogin`/`useLogout` (`src/hooks/api/use-perfil.ts:98-136`): ya siembran (`setQueryData`)
  y limpian (`queryClient.clear()`) el cache de `["perfil"]` en el momento correcto: el header
  reacciona solo en cuanto lea esos hooks. Ver la nota al final de este documento.
- Sin shadcn/ui: el repo no tiene Radix ni `components/ui/` (confirmado con el usuario). El menú se
  arma a mano, siguiendo el patrón de click-afuera de `src/components/saque/selector-ubicacion.tsx:62-68`
  y el de Escape de `src/components/panel/modal-panel.tsx:24-30`.
- Roles válidos: exactamente `"ADMIN" | "OWNER" | "EMPLOYEE" | "PLAYER"` (`Role`, en
  `src/lib/api/tipos/comunes.ts:42`). No inventar variantes.
- Rutas a usar en el menú — todas ya existen, no inventar ninguna: `/mis-reservas`, `/perfil`,
  `/panel/agenda` (destino de OWNER **y** ADMIN: es donde ya los manda `entrar()` en
  `src/app/ingresar/page.tsx:110-121` tras el login; no existe un panel de ADMIN separado).
- EMPLOYEE es un caso borde en el sitio público (normalmente entra por PIN en `/caja`, no por acá):
  solo nombre + "Cerrar sesión", sin links de navegación.
- Fuera de alcance: auto-redirect de OWNER/ADMIN desde la home al panel. Esto solo agrega el acceso
  en el menú.
- No hay infraestructura de testing de componentes: no inventar un setup de Testing Library para esta
  tarea puntual. La verificación de `NavSesion`/`MenuUsuario`/`HeaderPublico` es manual (dev server).

---

### Task 1: `itemsMenuUsuario` — mapeo puro de rol a ítems de navegación

**Files:**
- Create: `src/lib/menu-usuario.ts`
- Test: `src/lib/menu-usuario.test.ts`

**Interfaces:**
- Consumes: `Role` de `@/lib/api/tipos/comunes` (`"ADMIN" | "OWNER" | "EMPLOYEE" | "PLAYER"`).
- Produces: `type ItemMenuUsuario = { label: string; href: string }` y
  `itemsMenuUsuario(rol: Role): ItemMenuUsuario[]`, que consume el Task 2 (`MenuUsuario`). Ojo: esto
  NO incluye "Cerrar sesión" — esa es una acción (mutación), no un link, y `MenuUsuario` la agrega
  siempre al final, sea cual sea el rol.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/menu-usuario.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import { itemsMenuUsuario } from "./menu-usuario";

describe("itemsMenuUsuario", () => {
  it("PLAYER ve Mis reservas y Mi perfil", () => {
    expect(itemsMenuUsuario("PLAYER")).toEqual([
      { label: "Mis reservas", href: "/mis-reservas" },
      { label: "Mi perfil", href: "/perfil" },
    ]);
  });

  it("OWNER ve el acceso a su panel y Mi perfil", () => {
    expect(itemsMenuUsuario("OWNER")).toEqual([
      { label: "Ir a mi panel", href: "/panel/agenda" },
      { label: "Mi perfil", href: "/perfil" },
    ]);
  });

  it("ADMIN ve solo el panel de administración", () => {
    expect(itemsMenuUsuario("ADMIN")).toEqual([
      { label: "Panel de administración", href: "/panel/agenda" },
    ]);
  });

  it("EMPLOYEE no tiene links de navegación: caso borde en el sitio público", () => {
    expect(itemsMenuUsuario("EMPLOYEE")).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/menu-usuario.test.ts`
Expected: FAIL — `Cannot find module './menu-usuario'` (el archivo todavía no existe).

- [ ] **Step 3: Implementación mínima**

Crear `src/lib/menu-usuario.ts`:

```typescript
import type { Role } from "./api/tipos/comunes";

/**
 * Ítems de navegación del menú de usuario del header público, según rol.
 * "Cerrar sesión" no está acá a propósito: es una acción, no un link, y el
 * componente que consume esto (MenuUsuario) siempre la agrega al final.
 */
export type ItemMenuUsuario = {
  label: string;
  href: string;
};

export function itemsMenuUsuario(rol: Role): ItemMenuUsuario[] {
  switch (rol) {
    case "PLAYER":
      return [
        { label: "Mis reservas", href: "/mis-reservas" },
        { label: "Mi perfil", href: "/perfil" },
      ];
    case "OWNER":
      return [
        { label: "Ir a mi panel", href: "/panel/agenda" },
        { label: "Mi perfil", href: "/perfil" },
      ];
    case "ADMIN":
      // Mismo destino que OWNER: no existe un panel de administración
      // separado, ADMIN comparte /panel/agenda (ver entrar() en
      // src/app/ingresar/page.tsx). /admin/ofertas existe pero es una
      // pantalla puntual, no "el" panel.
      return [{ label: "Panel de administración", href: "/panel/agenda" }];
    case "EMPLOYEE":
      // No entra por acá en el uso normal (login por PIN en /caja): si un
      // token de empleado sobrevive en localStorage y esta persona cae en
      // una página pública, solo ve su nombre y Cerrar sesión.
      return [];
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/menu-usuario.test.ts`
Expected: PASS — 4 tests OK.

- [ ] **Step 5: Commit**

```bash
git add src/lib/menu-usuario.ts src/lib/menu-usuario.test.ts
git commit -m "feat(header): agrega el mapeo de rol a items del menu de usuario"
```

---

### Task 2: `MenuUsuario` — el dropdown en sí

**Files:**
- Create: `src/components/saque/menu-usuario.tsx`

**Interfaces:**
- Consumes: `itemsMenuUsuario(rol: Role): ItemMenuUsuario[]` (Task 1). `useLogout()` de
  `@/hooks/api/use-perfil` — `useMutation` sin variables, `mutateAsync(): Promise<void>`,
  `isPending: boolean`; ya borra el token y limpia el cache de React Query internamente
  (`src/hooks/api/use-perfil.ts:121-136`). `PerfilResponse` de `@/lib/api/tipos/auth` (campos usados:
  `nombre: string`, `rol: Role`).
- Produces: `MenuUsuario({ perfil: PerfilResponse; oscuro: boolean })`, consumido por el Task 3
  (`NavSesion`). Solo se monta cuando ya hay `perfil` resuelto — no maneja el estado de carga ni el de
  no-logueado, eso lo decide `NavSesion` antes de renderizarlo.

**Comportamiento esperado:**
- Trigger: primer nombre de pila (`perfil.nombre.split(" ")[0]`) + ícono de flecha. Color según
  `oscuro` (mismo criterio de `HeaderPublico`: blanco sobre fondo tinta, `text-tinta` sobre claro).
- Al abrir: panel `role="menu"` con los ítems de `itemsMenuUsuario(perfil.rol)` (cada uno un
  `<Link role="menuitem">`) y, siempre al final, un botón "Cerrar sesión" (`role="menuitem"`) que
  llama a `useLogout().mutateAsync()` y redirige a `/` — mismo patrón que
  `src/app/perfil/page.tsx:87-95` (`await logout.mutateAsync().catch(() => {}); router.push("/")`,
  sin el `borrarUsuario()` de ahí porque ese es un residuo del store mock viejo que este componente no
  usa).
- Cierra con click afuera (`mousedown` en `document`, mismo patrón que `selector-ubicacion.tsx:62-68`)
  y con `Escape` (mismo patrón que `modal-panel.tsx:24-30`).
- El panel del dropdown es siempre claro (`bg-white`, `border-borde`, `shadow-lg`) igual que el resto
  de los popovers del repo (`selector-ubicacion.tsx:159`) — solo el trigger cambia con `oscuro`.

- [ ] **Step 1: Crear el componente**

Crear `src/components/saque/menu-usuario.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";

import { useLogout } from "@/hooks/api/use-perfil";
import { itemsMenuUsuario } from "@/lib/menu-usuario";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/**
 * Menú de usuario del header público: reemplaza a "Ingresar" cuando hay
 * sesión. Solo se monta con un `perfil` ya resuelto (ver NavSesion para los
 * estados de carga / no-logueado).
 */
export function MenuUsuario({ perfil, oscuro }: { perfil: PerfilResponse; oscuro: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logout = useLogout();

  useEffect(() => {
    function alClickAfuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    }
    function alEscapar(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClickAfuera);
    window.addEventListener("keydown", alEscapar);
    return () => {
      document.removeEventListener("mousedown", alClickAfuera);
      window.removeEventListener("keydown", alEscapar);
    };
  }, []);

  async function cerrarSesion() {
    setAbierto(false);
    // Igual que src/app/perfil/page.tsx: si el logout del servidor falla,
    // igual se limpia el cliente — quedar "logueado" contra un token muerto
    // es peor.
    await logout.mutateAsync().catch(() => {});
    router.push("/");
  }

  const items = itemsMenuUsuario(perfil.rol);
  const primerNombre = perfil.nombre.split(" ")[0];
  const textoTrigger = oscuro ? "text-white" : "text-tinta";

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className={`inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-bold ${textoTrigger}`}
      >
        {primerNombre}
        <ChevronDown className="size-4" aria-hidden />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-card border border-borde bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="block px-4 py-2.5 text-sm text-tinta transition-colors hover:bg-humo"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={cerrarSesion}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-grafito transition-colors hover:bg-humo hover:text-cancelado disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `src/components/saque/menu-usuario.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/saque/menu-usuario.tsx
git commit -m "feat(header): agrega el dropdown de usuario del header publico"
```

---

### Task 3: `NavSesion` — el slot que decide qué mostrar, y su conexión al header

**Files:**
- Create: `src/components/saque/nav-sesion.tsx`
- Modify: `src/components/saque/header-publico.tsx` (todo el archivo — reemplaza el `<nav>` estático)

**Interfaces:**
- Consumes: `useHaySesion(): boolean` de `@/hooks/api/use-sesion` (lectura síncrona de si hay token,
  sin red). `usePerfil()` de `@/hooks/api/use-perfil` — `useQuery` con `data: PerfilResponse | undefined`,
  `isPending: boolean`, `enabled: haySesion` (por eso `isPending` ya es `false` de entrada cuando no hay
  sesión: no hace falta chequearlo aparte). `MenuUsuario({ perfil, oscuro })` (Task 2).
- Produces: `NavSesion({ texto: string; textoSecundario: string; oscuro: boolean })`, consumido por
  `HeaderPublico`.

**Los 5 estados** (igual que el pedido original):
1. Sin token (`!haySesion`): "Software para negocios" + "Ingresar", como hoy.
2. Con token, `/me` resolviendo (`haySesion && perfil.isPending`): placeholder animado en vez de
   "Ingresar" — evita el parpadeo "Ingresar → menú".
3. Con token, `/me` resuelto (`haySesion && perfil.data`): `MenuUsuario`.
4. Con token pero sin `data` ni `isPending` (ventana brevísima tras un 401: `apiFetch` ya llamó
   `borrarToken()` — ver `src/lib/api/cliente.ts` — lo que dispara el evento que hace que
   `useHaySesion()` pase a `false` en el próximo render): no se renderiza nada en ese instante: es más
   seguro que mostrar "Ingresar" un frame para volver a "menú" al siguiente. No hace falta código
   extra para esto, es la consecuencia de las tres condiciones de arriba siendo mutuamente
   excluyentes.
5. "Software para negocios" solo se muestra en el estado 1: para alguien logueado (cualquier rol) no
   aplica — ya tiene una cuenta.

- [ ] **Step 1: Crear `NavSesion`**

Crear `src/components/saque/nav-sesion.tsx`:

```tsx
"use client";

import Link from "next/link";

import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { MenuUsuario } from "@/components/saque/menu-usuario";

/**
 * Slot derecho del header público. "Software para negocios" es un link
 * discreto a propósito: es la puerta de entrada B2B, pero no puede competir
 * visualmente con la acción de sesión. Para alguien ya logueado no aplica
 * (cualquier rol ya tiene cuenta), así que desaparece junto con "Ingresar".
 *
 * `usePerfil()` tiene `enabled: haySesion` (src/hooks/api/use-perfil.ts), así
 * que `isPending` ya es `false` sin sesión — no hace falta un chequeo extra
 * para eso acá.
 */
export function NavSesion({
  texto,
  textoSecundario,
  oscuro,
}: {
  texto: string;
  textoSecundario: string;
  oscuro: boolean;
}) {
  const haySesion = useHaySesion();
  const { data: perfil, isPending } = usePerfil();

  return (
    <nav className="flex items-center gap-5 text-sm">
      {!haySesion && (
        <Link
          href="/negocios"
          className={`hidden min-h-11 items-center decoration-celeste decoration-2 underline-offset-4 transition-colors hover:underline sm:inline-flex ${textoSecundario}`}
        >
          Software para negocios
        </Link>
      )}

      {!haySesion && (
        <Link
          href="/ingresar"
          className={`inline-flex min-h-11 items-center font-semibold decoration-celeste decoration-2 underline-offset-4 transition-colors hover:underline ${texto}`}
        >
          Ingresar
        </Link>
      )}

      {haySesion && isPending && (
        <div
          className={`h-4 w-20 animate-pulse rounded ${oscuro ? "bg-white/20" : "bg-borde"}`}
          aria-hidden
        />
      )}

      {haySesion && perfil && <MenuUsuario perfil={perfil} oscuro={oscuro} />}
    </nav>
  );
}
```

- [ ] **Step 2: Conectar `NavSesion` en `HeaderPublico`**

Reemplazar todo `src/components/saque/header-publico.tsx` por:

```tsx
import Link from "next/link";
import { Isotipo } from "@/components/saque/logo";
import { NavSesion } from "@/components/saque/nav-sesion";

/**
 * Header de zona A y B.
 *
 * El slot derecho (antes "Software para negocios" + "Ingresar" fijos) ahora
 * depende de la sesión: lo resuelve NavSesion (usePerfil()/useHaySesion()).
 */
type HeaderPublicoProps = {
  /** "oscuro" para fondos tinta (ej. el hero de A1), "claro" para el resto */
  variant?: "claro" | "oscuro";
  /** Ancho del contenido. A1/A2 usan 5xl; A3 necesita más aire para la grilla. */
  ancho?: "5xl" | "7xl";
};

export function HeaderPublico({ variant = "claro", ancho = "5xl" }: HeaderPublicoProps) {
  const oscuro = variant === "oscuro";
  const texto = oscuro ? "text-white" : "text-tinta";
  const textoSecundario = oscuro ? "text-[#9DB6D6]" : "text-grafito";
  const maxWidth = ancho === "7xl" ? "max-w-7xl" : "max-w-5xl";

  return (
    <header className="relative z-10">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between px-5 py-5 sm:px-8`}>
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <Isotipo variant={oscuro ? "blanco" : "color"} className="h-7 w-auto" />
          <span
            className={`font-display text-lg font-extrabold tracking-tight ${texto}`}
          >
            saque
          </span>
        </Link>

        <NavSesion texto={texto} textoSecundario={textoSecundario} oscuro={oscuro} />
      </div>
    </header>
  );
}
```

Nota: `HeaderPublico` sigue sin `"use client"` — sigue siendo renderizable desde Server Components
(ej. `src/app/buscar/page.tsx`) porque el hook-consuming vive en su hijo `NavSesion`, que sí lo tiene.
Esto es composición estándar de Next.js (un Server Component puede renderizar un Client Component
como hijo) y es la razón de separar `NavSesion` en su propio archivo en vez de agregar `"use client"`
directamente a `header-publico.tsx`.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde `c:\Users\USER\Desktop\saque-front`
Expected: sin errores nuevos relacionados a `src/components/saque/nav-sesion.tsx` ni
`src/components/saque/header-publico.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/saque/nav-sesion.tsx src/components/saque/header-publico.tsx
git commit -m "fix(header): el header publico refleja la sesion real en vez de mostrar Ingresar fijo"
```

---

### Task 4: Verificación manual end-to-end

**Files:** ninguno — solo uso del dev server. Necesita el backend (`sacaladelangulo`) corriendo en
`http://localhost:8080` (o el valor de `NEXT_PUBLIC_API_URL`) con al menos una cuenta PLAYER y una
OWNER; ADMIN y EMPLOYEE son opcionales si no hay cuentas a mano — igual quedan cubiertos por los tests
de `itemsMenuUsuario` (Task 1).

- [ ] **Step 1: Levantar el dev server**

Run: `npm run dev` (dejar corriendo)

- [ ] **Step 2: PLAYER**

Ir a `/ingresar`, loguearse con una cuenta PLAYER. Confirmar que el header cambia a un menú con el
nombre INMEDIATAMENTE tras el login (sin recargar la página). Abrir el menú: debe mostrar "Mis
reservas", "Mi perfil", "Cerrar sesión", en ese orden. Click en "Mis reservas" → navega a
`/mis-reservas`. Volver y click en "Cerrar sesión" → vuelve a "Ingresar" y redirige a `/`.

- [ ] **Step 3: OWNER**

Loguearse con una cuenta OWNER. El menú debe ofrecer "Ir a mi panel" (→ `/panel/agenda`), "Mi perfil",
"Cerrar sesión".

- [ ] **Step 4: Persistencia al recargar**

Logueado (cualquier rol), presionar F5. Durante el instante de carga debe verse el placeholder
animado, NUNCA "Ingresar". Al resolver `/me`, el menú vuelve a aparecer — la sesión no vuelve a
"Ingresar" solo por recargar.

- [ ] **Step 5: Token vencido**

Con sesión iniciada, en las DevTools reemplazar el valor de `localStorage["saque:token"]` por un JWT
inválido (o vencido) y recargar. `GET /me` responde 401 → el header debe mostrar "Ingresar" (no un
error, no el menú) y `localStorage["saque:token"]` debe quedar vacío.

- [ ] **Step 6: Sin sesión**

En una pestaña sin token, el header debe verse exactamente igual que antes de este cambio: "Software
para negocios" + "Ingresar".

- [ ] **Step 7: Lint y test**

Run: `npm run lint`
Expected: sin errores nuevos en los archivos tocados.

Run: `npm run test`
Expected: PASS, incluyendo los 4 tests de `src/lib/menu-usuario.test.ts`.

---

## Nota: por qué no se toca `useLogin`/`useLogout`

El pedido original menciona "invalidá/refetcheá el query `['me']`" al loguearse y "reseteá el query
(a null)" al cerrar sesión, como si fuera algo a agregar. Ya existe, y de una forma mejor que
invalidar + refetchear:

- `useLogin()` (`src/hooks/api/use-perfil.ts:98-114`) pide `/me` DENTRO de la mutación y hace
  `queryClient.setQueryData(keys.perfil(), perfil)` en `onSuccess` — siembra el cache directamente,
  sin un round-trip de red extra. Como esto corre antes de que se resuelva la promesa que espera quien
  llama (`entrar()` en `src/app/ingresar/page.tsx`), el cache ya está actualizado cuando esa función
  decide a dónde redirigir.
- `useLogout()` (`src/hooks/api/use-perfil.ts:121-136`) hace `queryClient.clear()` en `onSettled`, que
  vacía TODO el cache (no solo `["perfil"]`) — el estado del header vuelve solo en cuanto `NavSesion`
  lea `usePerfil()`/`useHaySesion()` de nuevo.

Por eso este plan no toca ese archivo: una vez que el header consulta esos hooks (Task 3), hereda esta
reactividad gratis.
