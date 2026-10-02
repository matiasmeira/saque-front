# Canche.ar - Frontend

Plataforma de reservas de canchas deportivas para Argentina. En producción en **https://www.canche.ar** (landing para dueños de complejos: `/software-para-clubes`).

Este repo es el frontend. El backend (Java 21 / Spring Boot) está en [matiasmeira/sacaladelangulo](https://github.com/matiasmeira/sacaladelangulo).

## Qué problema resuelve

- **Jugadores**: buscan canchas por deporte y zona, ven la disponibilidad en vivo y reservan sin llamar por teléfono.
- **Complejos**: gestionan en un solo lugar la agenda, los precios, la caja, el buffet, los gastos, los reportes y a sus empleados.

## Funcionalidades

**Lado jugador**
- Búsqueda y ficha pública del complejo renderizadas en el servidor (SSR), con metadata y JSON-LD de schema.org (horarios de atención) para SEO.
- Checkout con seña y pre-reserva que vence: el turno queda retenido con una cuenta regresiva de 10 minutos. Si el reloj local llega a cero antes de que el backend expire la reserva, la pantalla ya lo muestra como vencida.
- Registro en 2 pasos con verificación de email por código, tanto para jugadores como para dueños.

**Lado dueño**
- Wizard de alta de complejo (identidad, canchas, horarios, tarifas, políticas, verificación).
- Panel con agenda en formato timeline, turnos fijos (alta, renovación, cancelación), clientes, precios por franja, caja con apertura y cierre, buffet con stock y ventas, gastos por categoría y reportes con gráficos (Recharts): facturación, ocupación por franja y por cancha, ranking de horarios y clientes top.
- Panel adaptado a celular (drawer y menú móvil).
- **Modo Caja** para el mostrador: la PC se empareja con un código (cookie HttpOnly emitida por el backend) y cada empleado entra con su PIN; los permisos por empleado se reflejan en lo que puede hacer en la agenda.
- Roles `OWNER`, `ADMIN`, `EMPLOYEE` y `PLAYER`. Un área `/admin` de plataforma (verificación de complejos, envío de ofertas).

## Decisiones técnicas

- **Cliente HTTP centralizado** (`src/lib/api/cliente.ts`): un único `apiFetch` que maneja token, `Idempotency-Key`, manejo del 401 y errores tipados con `ApiError` + `mensajeVisible` para mostrar mensajes al usuario.
- **TanStack Query con keys compartidas** entre pantallas (la agenda y la vista previa comparten la disponibilidad). Los datos se transforman con `select`, nunca en el `queryFn`, para no pisar la caché de otra pantalla; las invalidaciones viven en un solo archivo.
- **Lógica de decisión como funciones puras** en `src/lib`, con tests en Vitest: 31 archivos y 253 tests hoy (`npx vitest run`). Ejemplos: `ramaPrereserva`, `destinoSinSesion`, `rolPanel`, `focus-trap`, `registro-body`. Los componentes quedan finos y se verifican en el navegador.
- **Diálogos accesibles** con `useDialogoAccesible`: el foco entra al abrir, Tab queda atrapado, Escape cierra, el foco vuelve a quien abrió y hay una pila para diálogos apilados (sólo reacciona el de arriba).
- **Protección contra open redirect**: `rutaInternaSegura` valida el parámetro de retorno post-login antes de navegar.
- **Guardias de sesión y de rol** que esperan la hidratación: tras una carga dura el primer render puede decir "sin sesión" aunque haya token, así que el guard vuelve a leerlo dentro del efecto antes de redirigir. Sin perfil cargado, el rol cae al más restrictivo (empleado).
- **Render puro**: los efectos se reservan para sistemas externos (fetch, suscripciones); el estado local derivado de props se ajusta durante el render.
- **Sin librerías de formularios ni de UI** (nada de react-hook-form, zod ni shadcn): formularios con `useState` y componentes propios. Es una decisión deliberada para mantener las dependencias al mínimo.

## Stack

Next.js 16 (App Router) · React 19 (con React Compiler) · TypeScript · Tailwind CSS v4 · TanStack Query v5 · Recharts · Leaflet / react-leaflet · Lucide y Tabler Icons · Vitest.

## Estructura

```
src/
  app/          rutas (App Router): buscar, complejo/[slug], reservar, ingresar,
                registro, panel/*, caja, admin, software-para-clubes
  components/   canche (público), panel (dueño), caja (kiosco), landing-clubes, perfil
  hooks/        useDialogoAccesible y hooks de datos en hooks/api (TanStack Query)
  lib/          cliente API, tipos, adaptadores y lógica pura con sus tests
```

## Correrlo en local

Requiere Node LTS y el backend levantado.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL: URL base del backend
npm run dev                  # http://localhost:3000
```

Otros comandos:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npx vitest run      # tests (también: npm test)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) corre en cada push y pull request a `master`: `npm ci`, lint, typecheck, tests y `next build`.
