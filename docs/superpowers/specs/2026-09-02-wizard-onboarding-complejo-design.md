# Wizard de onboarding del complejo — Design

**Origen:** conversación de diseño en la que se revisó, pantalla por pantalla, el HTML que generó
Google Stitch para un wizard de 6 pasos (Identidad → Políticas → Horarios → Canchas → Tarifas →
Cobros) contra el código real de `saque-front` y del backend `sacaladelangulo`.

**Hallazgo central que define todo este documento:** el wizard NO es una feature nueva de cero. Casi
toda la lógica de negocio que necesita ya existe, construida y probada, en `panel/configuracion`,
`panel/canchas` y `panel/precios`. El trabajo real es una "cáscara" de navegación por pasos que
reutiliza esos componentes — no una reimplementación de sus reglas de validación.

---

## 1. Decisión arquitectónica central: creación progresiva, no un POST final

El plan original (fuera de esta conversación) asumía un único payload gigante armado a lo largo de
los 6 pasos y enviado recién al final ("Publicar"). Eso no es viable con el contrato real del
backend, por dos razones:

- `POST /api/v1/establecimientos` (`EstablecimientoRequest`) exige `nombre`, `direccion`, `latitud`,
  `longitud`, `requiereSena` y `requiereTelefonoVerificado` — es decir, datos de los pasos 1 **y** 2
  juntos. No se puede crear el establecimiento con menos que eso.
- Fotos, canchas, tarifas y (política de cancelación) son sub-recursos que exigen un
  `establecimientoId` que todavía no existe hasta que ese POST responde.

**Por eso el establecimiento se crea temprano, al confirmar el paso 2**, y cada paso siguiente guarda
sus datos con una llamada real al backend en cuanto el usuario lo confirma (no al final). Esto
también es lo que pidió la spec original con `guardarProgreso(datosParciales)` — acá deja de ser un
hook a medio implementar y pasa a ser, literalmente, la mutación de cada paso.

Consecuencia directa: **`publicarComplejo()` (paso 6) queda muy liviano.** No arma ni envía un
payload grande — todo ya está guardado. En el peor caso hace un refetch final y navega al panel.

`isActive` del establecimiento **no se toca en ningún momento del wizard**: es un flag de
verificación de soporte (confirmado con el usuario), no un draft flag del wizard. Hoy viene forzado a
`true` en el backend (fase de desarrollo) — el wizard no lo lee ni lo escribe.

## 2. Estado del wizard

```ts
type EstadoWizard = {
  pasoActual: 1 | 2 | 3 | 4 | 5 | 6;
  pasosCompletados: Set<number>;
  /** null hasta que se confirma el paso 2 — de ahí en adelante, todo pega contra este id */
  establecimientoId: number | null;

  identidad: {
    nombre: string;
    direccion: string;
    ubicacion: Ubicacion | null;        // de SelectorUbicacion (localidad)
    pinManual: { lat: number; lng: number } | null; // corrección manual del mapa
    servicios: Servicio[];              // los 7 valores reales del enum
    fotosEnCola: File[];                // SOLO hasta que exista establecimientoId
  };

  politicas: {
    requiereSena: boolean;              // forzado true+disabled solo si plan === "FREE"
    requiereTelefonoVerificado: boolean;
    montoSenaDefault: number;           // LOCAL, nunca se envía — prefill de FormCancha en paso 4
    horasCancelacionAntesPartido: number; // default 24
    minutosGraciaCancelacion: number;     // default 30
  };

  horarios: HorarioAtencionDto[];       // vía FormHorariosAtencion + patrón rápido

  canchas: CanchaResponse[];            // ya persistidas (se crean una a una en el paso 4)

  cobros: {
    mercadoPagoConectado: boolean;
    cuenta?: string;
  };
};
```

`slug` **no está en el estado**: no es un dato que el wizard mande, es un preview calculado en el
cliente (ver paso 1). Las tarifas tampoco tienen slot propio: viven dentro de cada `CanchaResponse`
de `canchas[]` y se leen/escriben ahí directamente (paso 5).

## 3. Plan por paso

### Paso 1 — Identidad

| Campo Stitch | Qué es de verdad | Componente a reutilizar |
|---|---|---|
| Nombre | `nombre` | — (input simple) |
| Slug (editable + "Disponible") | **No es editable.** El backend lo genera (`SlugGenerator`, normaliza + sufijo numérico si choca). Se muestra como preview de solo lectura, recalculado en el cliente mientras se tipea el nombre. Sin chequeo de disponibilidad — el backend no puede fallar por colisión. | — (cálculo propio, mismo algoritmo que `SlugGenerator.normalizar`) |
| Dirección + mapa estático | Ubicación real | `SelectorUbicacion` (`src/components/canche/selector-ubicacion.tsx`) + `geocodificarDireccion` (`src/lib/api/georef.ts`) + `MapaUbicacion` (`src/components/canche/mapa-ubicacion.tsx`, pin arrastrable), exactamente como los compone `FormDatosComplejo` (`src/components/panel/form-datos-complejo.tsx:160-206`) |
| Servicios (4 chips) | Enum real tiene 7 | `SERVICIOS` (`src/lib/servicios.ts`) — agrega WiFi, Duchas, Kiosco que Stitch no incluía |
| Fotos (dropzone sin input real) | Sub-recurso que exige `establecimientoId` | Zona de staging local (`File[]` en memoria) hasta que se cree el establecimiento en el paso 2; ahí se sube en cola con `establecimientos.subirFoto` (mismo endpoint que usa `FormFotos`, `src/components/panel/form-fotos.tsx`) |

No hay llamada al backend en este paso — todo queda en `identidad` hasta que el paso 2 dispara la
creación.

### Paso 2 — Políticas (paso que crea el establecimiento)

| Campo Stitch | Qué es de verdad |
|---|---|
| Toggle "Requiere seña" | `requiereSena`. Forzado `true` + deshabilitado **solo si `plan === "FREE"`** (ver §4 — ya no incluye TRIAL, se corrigió durante esta conversación) |
| "Monto de seña por defecto" | **No existe en ningún DTO.** `montoSena` es por cancha (`CanchaRequest.montoSena`). Se guarda solo en `politicas.montoSenaDefault`, local, y se usa para prellenar `FormCancha` cuando se agrega una cancha nueva en el paso 4 |
| Toggle "Requiere teléfono verificado" | `requiereTelefonoVerificado`, 1:1 |
| Horas de anticipación / minutos de gracia | `horasCancelacionAntesPartido` / `minutosGraciaCancelacion`. Sub-recurso propio (`PATCH /establecimientos/{id}/politicas-cancelacion`, ver §4) — no viaja en el POST de creación, se manda aparte una vez que existe el id |

**Al tocar "Continuar" en este paso:**
1. `POST /api/v1/establecimientos` con `nombre`, `direccion`, `latitud`, `longitud`, `requiereSena`,
   `requiereTelefonoVerificado`, `horariosAtencion: []`, `servicios` (del paso 1) → devuelve el
   `establecimientoId` real y el `slug` real.
2. Con el id ya disponible: flush de `identidad.fotosEnCola` (subida en cola, una por una).
3. `PATCH /establecimientos/{id}/politicas-cancelacion` con `horasCancelacionAntesPartido` y
   `minutosGraciaCancelacion`.

### Paso 3 — Horarios

Reutiliza `FormHorariosAtencion` (`src/components/panel/form-horarios-atencion.tsx`) tal cual: modelo
de 7 filas (una por día, con "cerrado" + apertura/cierre), validación ya incluida (`abre != cierre`,
`cierre > abre` — confirmado que ni el componente ni el backend soportan cruce de medianoche).

Se agrega una capa fina encima que Stitch sí mockeó y el componente no tiene: los 3 radios de patrón
rápido ("mismo horario todos los días" / "L-V y fin de semana distinto" / "día por día"), que
pre-cargan las 7 filas con el mismo estado que ya consume `FormHorariosAtencion` — la validación y el
guardado se heredan sin tocarlos.

**Al confirmar:** `PUT /establecimientos/{id}` con el objeto completo (nombre, dirección, políticas,
etc. — el PUT reemplaza TODO, incluido `horariosAtencion`, que no tiene semántica de "no modificar")
más los horarios cargados.

**Excluido a pedido explícito del usuario:** excepciones / días no laborables
(`DiaNoLaborableController`, 100% implementado en el backend pero sin ningún frontend hoy). No entra
en el flujo de creación del establecimiento.

### Paso 4 — Canchas

Reutiliza `FormCancha` (`src/components/panel/form-cancha.tsx`) completo, en un drawer, igual que
`panel/canchas`: nombre, activa, deportes (multi), seña (prellenada con `politicas.montoSenaDefault`
cuando `cancha === null`), duraciones permitidas, precio por duración, inicio a la media hora, y el
sistema de canchas "pool"/compuestas (`canchasFisicas` + `canchasNecesarias`) — un concepto que no
está en ninguna spec ni en Stitch, pero que el formulario ya maneja bien incluso sin canchas
existentes todavía.

Adaptador: `aCanchaRequest`/`aCanchaPanel` (`src/lib/api/adaptadores/canchas.ts`) — sin reescribir la
traducción `preciosBase[] ↔ preciosPorDuracion Record`.

Lista (resumen simplificado, no la tabla completa de `panel/canchas`): nombre, chips de deporte
(`DEPORTES`, `src/lib/deportes.ts` — no un solo ícono adivinado), precio "desde", badge
Activa/Inactiva. "Eliminar" = `desactivarCancha`, **irreversible** — mismo modal de confirmación que
`panel/canchas/page.tsx:248-277` ("no se puede deshacer... vas a tener que crearla de nuevo"), porque
en el wizard la cancha ya está persistida de verdad apenas se agrega.

**Al confirmar:** cada cancha ya se creó individualmente al agregarla (`POST
.../establecimientos/{id}/canchas`); "Continuar" solo valida:
- Al menos una cancha en la lista.
- Si `politicas.requiereSena === true`, al menos una cancha con `montoSena > 0`.

### Paso 5 — Tarifas (opcional)

Reutiliza `PrecioBaseCancha`, `ListaTarifas`, `FormTarifa` (`src/components/panel/`), igual que
`/panel/precios`. Selector por tabs (no el `<select>` del panel — con pocas canchas recién creadas,
tabs es mejor UX acá).

Cambios sobre el mockup de Stitch:
- **Se saca el toggle "Usar tarifas especiales para esta cancha"**: no existe ningún flag así en el
  backend. `ListaTarifas` ya resuelve el mismo caso sin él (vacío → "Todavía no cargaste tarifas
  especiales... rige el precio base"; con tarifas → la lista). Un toggle aparte solo crea un estado
  ambiguo (¿"apagarlo" borra las tarifas o solo las oculta?).
- **Se saca la columna "Precio Base" de la tabla de tarifas**: es un valor derivado (mismo criterio
  que `CanchaRequest.precioBase` — se deriva de la duración más corta en `aTarifasDto`), no algo que
  se cargue aparte. Ya está representado en los chips de precio por duración.
- `PrecioBaseCancha` (el resumen "$X/h" del paso 4) se muestra **read-only** acá, no editable — ya se
  cargó un paso atrás, re-editarlo confundiría.

Bonus de reutilizar `FormTarifa`: valida solapamiento entre tarifas de la misma cancha (mismo día +
horario pisado), algo que ni la spec original ni Stitch contemplaban.

**Al confirmar cada tarifa:** `PUT /establecimientos/{id}/canchas/{canchaId}` con la cancha completa
más `tarifas: aTarifasDto(...)` (no hay endpoint granular de tarifas — viajan dentro de
`CanchaRequest`). Este paso no bloquea "Continuar": es opcional según la spec original.

### Paso 6 — Cobros (MercadoPago)

A pedido explícito del usuario, se construye **como si el backend ya existiera** (está en desarrollo,
es lo próximo que agrega), no como un stub con disclaimer:

```ts
async function iniciarOAuthMercadoPago(establecimientoId: number) {
  // GET /api/v1/establecimientos/{id}/mercadopago/oauth/iniciar -> { urlAutorizacion }
  // El backend arma la URL de MP (client_id + redirect_uri propios); el front solo redirige.
}

async function verificarEstadoMercadoPago(establecimientoId: number) {
  // GET /api/v1/establecimientos/{id}/mercadopago -> { conectado: boolean, cuenta?: string }
  // El intercambio del "code" de OAuth lo hace el backend en su propio callback — el front
  // nunca lo parsea, solo relee el estado (incluso al volver del redirect de MP).
}
```

Estas rutas son una convención propuesta (mismo patrón que fotos/canchas/políticas-cancelación), **a
confirmar** cuando el backend esté listo.

**Gate de "Publicar complejo" — el fix más importante de este paso:**

```
disabled = politicas.requiereSena === true && !cobros.mercadoPagoConectado
```

El mockup de Stitch lo tenía deshabilitado sin condición. Con la regla de negocio de §4 (TRIAL no
fuerza seña, FREE sí), un dueño TRIAL sin seña activada tiene que poder publicar sin conectar nada.
Cuando `requiereSena === false`, la card de conexión se reemplaza por un texto explicando que no hace
falta ("no es necesario... podés conectarlo cuando quieras desde Configuración") en vez de mostrar un
paso que parece obligatorio sin estarlo.

Falta diseñar el estado "Conectado" (cuenta vinculada + botón desconectar) — Stitch solo mockeó
"Desconectado".

### Pantalla de éxito (fuera del conteo de 6 pasos)

Ruta/estado separado, sin barra de progreso. "Ir al panel" navega al panel; "Ver página pública" usa
el `slug` real ya conocido desde el paso 2 (`/complejo/{slug}`). Se descarta el `<div>` de animación
vacío del mockup — no aporta nada al diseño minimalista pedido.

## 4. Reglas de negocio corregidas durante esta conversación

- **`EstablecimientoService.esPlanLimitado`** (`sacaladelangulo/.../establecimiento/service/EstablecimientoService.java`)
  y **`CanchaService.validarMontoSena`** (mismo paquete) forzaban seña obligatoria para `TRIAL` y
  `FREE`. Corregido a **solo `FREE`** — un TRIAL puede optar libremente. Reflejado también en
  `senaForzada` de `form-datos-complejo.tsx` (frontend).
- **Pendiente, en desarrollo aparte por el usuario:** la baja automática de TRIAL a FREE a los 30 días
  no existe — `AvisoFinPruebaService` solo *notifica* (7/3/1 días), nunca cambia `planSuscripcion`. No
  es parte de este wizard, pero el gate del paso 6 asume que esa transición eventualmente va a existir.
- **Política de cancelación:** backend implementado (`PoliticaCancelacionController`, PATCH con
  semántica parcial, valida horas 0–168 y minutos 0–1440, devuelve `reservasFuturasAfectadas`). Sin
  wiring en `panel/configuracion` todavía (sigue mostrando el `SeccionSinEndpoint` stub) — fuera de
  alcance de este wizard, pendiente de decisión del usuario sobre si conectarlo ahora o después.
- **Días no laborables:** backend implementado, cero frontend, excluido explícitamente del flujo de
  creación por pedido del usuario.

## 5. Sistema de diseño: qué se descarta de Stitch

Cada uno de los 6 HTML tenía su propia paleta de colores Material-3 inventada (`tailwind.config`
inline vía CDN), fuente de íconos "Material Symbols Outlined", y una barra de progreso renderizada
distinta en cada pantalla (4 variantes distintas observadas: con/sin etiquetas, 4 vs. 6 puntos, texto
"Paso X de 6" presente o no). Todo eso se descarta a favor de:

- Tokens reales de `globals.css`: `tinta`, `grafito`, `azul`, `azul-oscuro`, `celeste`,
  `celeste-suave`, `humo`, `borde`, `rounded-card`/`rounded-input`, `shadow-card`.
- Un único componente de barra de progreso, parametrizado por `pasoActual`/6, usado por los 6 pasos
  (nunca el markup particular de cada HTML de Stitch).
- Íconos `lucide-react` (y `@tabler/icons-react` para deportes, vía el catálogo `DEPORTES` ya
  existente) — nunca la fuente Material Symbols.
- Errores inline por campo + banner de resumen (`role="alert"`, `text-cancelado`), y manejo de errores
  de red con `ApiError`/`mensajeVisible` (`src/lib/api/errores.ts`), igual que el resto del panel.

## 6. Mapeo de íconos usados en los mockups

| Material Symbol | lucide-react |
|---|---|
| `close` | `X` |
| `check_circle` | `CheckCircle2` |
| `pin_drop` / `location_on` | (se reemplaza por el mapa real, no hace falta el ícono) |
| `wc` | (chip de `SERVICIOS`, ya trae su ícono) |
| `cloud_upload` / `upload` | `Upload` |
| `delete` | `Trash2` |
| `add` | `Plus` |
| `edit` | `Pencil` |
| `payments` | `Banknote` |
| `work` | `Briefcase` |
| `weekend` | `CalendarDays` |
| `stadium` / `sports_tennis` / `sports_soccer` | chips de `DEPORTES` (tabler), no un ícono por card |
| `account_balance_wallet` | `Wallet` |
| `link` | `Link2` |
| `arrow_forward` | `ArrowRight` |
| `open_in_new` | `ExternalLink` |

## 7. Fuera de alcance de este wizard

- Días no laborables / excepciones de horario.
- Downgrade automático TRIAL → FREE (en desarrollo aparte).
- Wiring de política de cancelación en `panel/configuracion` (sub-resource ya existe, no forma parte
  del wizard).
- Implementación real del backend de MercadoPago OAuth (el wizard construye la UI y los hooks
  asumiendo el contrato de §3/Paso 6, a confirmar cuando exista).

## 8. Abierto — necesita una decisión del usuario antes de implementar

1. **Ruta del wizard.** Hoy no existe en el código ningún redirect "OWNER sin establecimiento →
   wizard" (`useEstablecimientoActivo()` simplemente devuelve `establecimientoId: null` y cada pantalla
   del panel decide qué hacer con eso por su cuenta). Falta definir: ¿en qué URL vive el wizard (ej.
   `/panel/bienvenida`, `/onboarding`)? ¿Quién redirige ahí — un guard en `/panel/*`, o se linkea
   manualmente después del registro?
2. **Contrato exacto de los endpoints de MercadoPago** (§3, paso 6) — asumidos por convención con el
   resto de la API, a confirmar contra el backend real cuando esté listo.
3. **Diseño del estado "Conectado"** de MercadoPago — no estaba en el mockup de Stitch, se arma de
   cero.

## 9. Archivos nuevos vs. reutilizados

**Se reutilizan tal cual (sin tocar):** `FormDatosComplejo`, `FormServicios`, `FormFotos`,
`FormHorariosAtencion`, `FormCancha`, `PrecioBaseCancha`, `ListaTarifas`, `FormTarifa`,
`SelectorUbicacion`, `MapaUbicacion`, adaptadores de `src/lib/api/adaptadores/canchas.ts` y
`src/lib/api/tarifas.ts`, catálogos `SERVICIOS`/`DEPORTES`.

**Nuevos, específicos del wizard:**
- Cáscara del wizard (layout, barra de progreso única, navegación Atrás/Continuar, estado global).
- Preview de slug (paso 1).
- Staging local de fotos pre-creación (paso 1).
- Capa de patrones rápidos de horario (paso 3).
- Resumen de lista de canchas simplificado (paso 4, no la tabla completa de `panel/canchas`).
- Card de conexión de MercadoPago con ambos estados (paso 6).
- Pantalla de éxito.
- `PoliticaCancelacionRequest`/`Response` TS + wrapper de endpoint (no existen todavía del lado front).

---

**Próximo paso:** una vez revisado este documento, invocar `writing-plans` para armar el plan de
implementación tarea por tarea.
