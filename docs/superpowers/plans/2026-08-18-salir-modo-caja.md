# Salir del Modo Caja hacia el panel del dueño — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un dueño autenticado nunca queda atrapado en `/caja` por el solo hecho de que la PC esté
emparejada; y desde la pantalla de seleccionar empleado hay una salida explícita hacia el login de
dueño.

**Architecture:** El guard compartido `useCajaSinEmpleado()` (consumido por `useBloqueadoPorCaja()`
en todas las pantallas de `/panel/*`) hoy solo mira `emparejado && !empleadoIdSesion`. Se le agrega
`&& !dueñoLogueado`, leyendo el rol real desde `usePerfil()` (fuente de verdad ya usada por
`useRolPanel`), con una guarda contra la carrera de `GET /me` en vuelo para no expulsar a un dueño
real durante una recarga de página. La pantalla `/caja` (seleccionar empleado) gana un link discreto
al login. El logout de dueño (nuevo, en el sidebar del panel — hoy no existe ninguno ahí) decide su
destino según el emparejamiento, sin tocarlo.

**Tech Stack:** Next.js 16 App Router, React, TanStack Query v5, TypeScript. Sin infraestructura de
testing de componentes/hooks en este repo (vitest solo cubre funciones puras en `src/lib/*`) —
verificación manual con el dev server, como indica el resto del código de esta zona.

**Spec:** Ver el pedido original del usuario en esta conversación ("Tarea: permitir salir del Modo
Caja hacia el panel del dueño"), con su tabla de verdad del redirect.

## Global Constraints

- 100% frontend. NO tocar el emparejamiento ni la cookie `saque_caja_device` en ningún botón nuevo.
- "Salir de Modo Caja" y "Desvincular esta PC" son acciones distintas — estos cambios son solo
  navegación y sesión, nunca emparejamiento.
- Sesión de empleado (PIN) NO cuenta como sesión de dueño para el guard.
- El único término que falta en el guard actual es `&& !dueñoLogueado` — no tocar el
  `!empleadoIdSesion` existente (romper eso rompe el flujo de empleados en `/panel/*`).

---

### Task 1: Guard — el dueño autenticado nunca cae a `/caja`

**Files:**
- Modify: `src/lib/permisos.ts:41-47` (función `useCajaSinEmpleado`)

**Interfaces:**
- Consumes: `usePerfil()` de `@/hooks/api/use-perfil` (ya usado en `src/lib/rol-panel.ts`) — devuelve
  `{ data: PerfilResponse | undefined, isPending: boolean, ... }`; `PerfilResponse.rol` es
  `"OWNER" | "ADMIN" | "EMPLOYEE"`. `useHaySesion()` de `@/hooks/api/use-sesion` — `boolean`, true si
  hay JWT en localStorage (lectura síncrona, sin red).
- Produces: `useCajaSinEmpleado(): boolean` sigue con la misma firma; `useBloqueadoPorCaja()` (que la
  consume, sin cambios) sigue disparando `router.replace("/caja")` solo cuando corresponde.

**Contexto del bug:** `useCajaSinEmpleado` hoy es `emparejado && !empleadoIdSesion` — nunca mira si
hay un dueño (OWNER/ADMIN) logueado. Un dueño con la PC emparejada y sin sesión de empleado por PIN
cae en `bloqueado = true` y `useBloqueadoPorCaja` lo manda a `/caja` en un `useEffect`, así esté
mirando `/panel/agenda` con su login real.

**Carrera a cubrir:** en una recarga dura de `/panel/*` con un JWT ya guardado, `GET /me` (el query de
`usePerfil()`) tarda un tick en resolver. Si el guard decidiera con `perfil` todavía `undefined`,
`dueñoLogueado` daría `false` y expulsaría a un dueño real ANTES de que el perfil llegue — exactamente
la clase de bug que se está arreglando, solo que corriendo una sola vez en vez de siempre. Por eso se
espera explícitamente a que el perfil resuelva cuando hay sesión. El mismo patrón (`haySesion` +
`isPending`) ya existe en `src/app/admin/ofertas/page.tsx:42-64` para el mismo propósito.

- [ ] **Step 1: Editar `useCajaSinEmpleado`**

En `src/lib/permisos.ts`, agregar los imports:

```typescript
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
```

Y reemplazar la función (líneas 41-47) por:

```typescript
export function useCajaSinEmpleado(): boolean {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  const haySesion = useHaySesion();
  const { data: perfil, isPending: perfilPendiente } = usePerfil();
  if (searchParams.get("rol")) return false;
  // Hay JWT guardado pero GET /me todavía no resolvió: no se sabe si es un
  // dueño real o no. Esperar en vez de expulsarlo por una carrera (mismo
  // patrón que admin/ofertas/page.tsx).
  if (haySesion && perfilPendiente) return false;
  const duenoLogueado = perfil?.rol === "OWNER" || perfil?.rol === "ADMIN";
  return emparejado && !empleadoIdSesion && !duenoLogueado;
}
```

Actualizar también el comentario JSDoc de la función (líneas 34-40) para que ya no diga "ni 'dueño' ...
tienen acceso legítimo en ese estado" — ahora sí lo tiene.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .` desde la raíz del repo (`c:\Users\USER\Desktop\saque-front`)
Expected: sin errores nuevos relacionados a `src/lib/permisos.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/permisos.ts
git commit -m "fix(caja): el dueño autenticado ya no cae a /caja por estar la PC emparejada"
```

---

### Task 2: Escape hatch — "Ingresar como dueño" en la pantalla de seleccionar empleado

**Files:**
- Modify: `src/app/caja/page.tsx:141-152` (el `return` final, estado "¿Quién sos?")

**Interfaces:**
- Consumes: `Link` de `next/link` (ya usado con el mismo estilo discreto en
  `src/app/caja/emparejar/page.tsx:116-118`: `text-sm text-white/50 hover:text-white`).
- Produces: nada nuevo — es un link a la ruta ya existente `/ingresar`, que en
  `src/app/ingresar/page.tsx:120` ya manda a `/panel/agenda` cuando `perfil.rol` es `OWNER`/`ADMIN`.

**Dónde va:** solo en el estado final de la pantalla (la lista de nombres, `¿Quién sos?`) — no en los
estados de error/carga/sin-cookie, que ya tienen su propia explicación y acción.

- [ ] **Step 1: Agregar el link**

En `src/app/caja/page.tsx`, agregar el import:

```typescript
import Link from "next/link";
```

Y en el bloque de retorno final (reemplazando el cierre del `<PantallaKiosco>` que hoy termina en
`ListaNombres`):

```tsx
  return (
    <PantallaKiosco>
      {nombreLocal ? (
        <p className="mb-1 text-center text-sm text-[#9DB6D6]">{nombreLocal}</p>
      ) : null}
      <h1 className="mb-8 text-center font-display text-2xl font-bold text-white">¿Quién sos?</h1>
      <ListaNombres
        empleados={empleados.data}
        onElegir={(empleado) => router.push(`/caja/pin/${empleado.id}`)}
      />
      <div className="mt-8 text-center">
        <Link href="/ingresar" className="text-sm text-white/50 hover:text-white">
          Ingresar como dueño
        </Link>
      </div>
    </PantallaKiosco>
  );
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .`
Expected: sin errores nuevos relacionados a `src/app/caja/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/caja/page.tsx
git commit -m "feat(caja): agrega salida a login de dueño desde la pantalla de seleccionar empleado"
```

---

### Task 3: Logout de dueño coherente con el emparejamiento

**Files:**
- Modify: `src/components/panel/sidebar-panel.tsx`

**Interfaces:**
- Consumes: `useLogout()` de `@/hooks/api/use-perfil` (ya definido en
  `src/hooks/api/use-perfil.ts:121-136` — `mutateAsync()` llama a `POST /auth/logout`, borra el token
  en un `finally`, y en `onSettled` limpia el `queryClient`; mismo patrón que
  `src/app/perfil/page.tsx:87-95`). `useEmparejado()` de `@/lib/sesion-caja` (ya importado en este
  archivo el hermano `useEmpleadoIdSesion`).
- Produces: nada que otro archivo consuma — es un botón hoja.

**Contexto:** hoy el sidebar del panel solo tiene un botón de salida para sesión de empleado por PIN
(`salirDeLaCaja`, líneas 108-113): no hay ningún logout para el dueño en `/panel/*` — la única
implementación de logout de dueño vive en la pantalla pública `/perfil`
(`src/app/perfil/page.tsx:87-95`), que nada en el panel enlaza. Este task agrega el botón de dueño
al lado del de empleado (mutuamente excluyentes: nunca hay sesión de dueño Y de empleado PIN a la
vez), con el mismo patrón `mutateAsync().catch(() => {})` que ya usa `/perfil`, pero decidiendo el
destino según `useEmparejado()` en vez de ir siempre a `"/"`.

- [ ] **Step 1: Agregar el logout de dueño**

En `src/components/panel/sidebar-panel.tsx`, actualizar los imports:

```typescript
import { usePerfil, useLogout } from "@/hooks/api/use-perfil";
import { borrarToken } from "@/lib/api/sesion";
import { cerrarSesionEmpleado, useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";
```

Dentro de `SidebarPanel()`, junto a los hooks existentes:

```typescript
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();
  const { data: perfil } = usePerfil();
  const queryClient = useQueryClient();
  const logout = useLogout();
```

Y agregar, junto a `salirDeLaCaja` (después de su cierre):

```typescript
  /**
   * Logout real de dueño: a diferencia de salirDeLaCaja, sí llama a
   * POST /auth/logout (invalida el JWT en el server). El destino depende de si
   * ESTA pc quedó emparejada como caja — nunca se toca el emparejamiento acá,
   * solo se lee.
   */
  async function cerrarSesionDueno() {
    await logout.mutateAsync().catch(() => {});
    router.push(emparejado ? "/caja" : "/ingresar");
  }
```

Y agregar el bloque JSX, como hermano del bloque `{empleadoIdSesion && (...)}` existente (mutuamente
excluyente porque un dueño real nunca tiene `empleadoIdSesion` seteado):

```tsx
      {!empleadoIdSesion && (perfil?.rol === "OWNER" || perfil?.rol === "ADMIN") && (
        <div className="border-t border-white/10 p-3">
          {perfil?.nombre && <p className="truncate px-2.5 pb-2 text-xs text-[#9DB6D6]">{perfil.nombre}</p>}
          <button
            type="button"
            onClick={cerrarSesionDueno}
            disabled={logout.isPending}
            className="flex h-10 w-full items-center gap-2.5 rounded-input pl-2.5 pr-3 text-sm font-semibold text-[#9DB6D6] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
```

Nota: la condición usa `perfil?.rol` directamente (no `useRolPanel()`) a propósito — `useRolPanel()`
en desarrollo sin perfil cae por defecto a `"dueno"`, lo que mostraría este botón sin sesión real.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p .`
Expected: sin errores nuevos relacionados a `src/components/panel/sidebar-panel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/sidebar-panel.tsx
git commit -m "feat(panel): agrega cierre de sesión de dueño coherente con el emparejamiento"
```

---

### Task 4: Verificación manual end-to-end

**Files:** ninguno — solo uso del dev server.

- [ ] **Step 1: Levantar el dev server**

Run: `npm run dev` (dejar corriendo)

- [ ] **Step 2: Dueño en PC emparejada no cae a `/caja`**

Con una PC/perfil de navegador ya emparejada (o simulando `localStorage.saque_caja_emparejado = "1"`
+ `saque_caja_establecimiento`), loguearse como dueño en `/ingresar` y navegar a `/panel/configuracion`
y `/panel/reportes`. Confirmar que se queda ahí — nunca rebota a `/caja`. Refrescar (F5) varias veces
para forzar la carrera de `GET /me` y confirmar que tampoco rebota ahí.

- [ ] **Step 3: Botón "Ingresar como dueño" funciona**

Desde `/caja` (pantalla de nombres), click en "Ingresar como dueño" → cae en `/ingresar` → tras
loguearse con credenciales de dueño, termina en `/panel/agenda`.

- [ ] **Step 4: Empleado / nadie sigue cayendo a `/caja`**

Sin sesión de dueño, con la PC emparejada, entrar a una URL de `/panel/*` directamente → sigue
rebotando a `/caja` como antes. Un empleado que entra con su nombre + PIN sigue llegando a su pantalla
permitida sin rebotar.

- [ ] **Step 5: Logout de dueño coherente**

Logueado como dueño en una PC emparejada, click en "Cerrar sesión" del sidebar → cae en `/caja`. Repetir
en una PC NO emparejada → cae en `/ingresar`. En ambos casos, confirmar que la PC sigue emparejada
después (no hubo que volver a emparejar) revisando `localStorage.saque_caja_emparejado` o simplemente
que `/caja` siga mostrando la lista de nombres y no la pantalla de "no está lista".

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: sin errores nuevos en los tres archivos tocados.
