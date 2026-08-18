# Plan de conexión — `saque-front` ↔ `sacaladelangulo`

> Contrato relevado leyendo el código de la branch `test` del backend.
> Última actualización: `ClienteController`, `GET /buffet/ventas` y `servicios` en `EstablecimientoRequest`/`Response` ya implementados y verificados en el código.
> El backend es **solo lectura**: toda corrección se hace en el front.

---

## 1. Resumen ejecutivo

### Estado actual del front

| Dimensión | Estado |
|---|---|
| Llamadas de red | **Cero.** No existe `fetch`, `axios`, ni cliente HTTP. Lo único es `src/lib/mock-api.ts` (9 líneas, un `setTimeout`). |
| Librería de datos | **Ninguna.** No hay TanStack Query, SWR, zustand ni Context. |
| Datos | 19 módulos estáticos en `src/mocks/` importados directo. |
| Auth | Inexistente. `src/lib/rol-panel.ts` devuelve **`"dueno"` por defecto sin credencial**. El PIN de empleado se valida en el cliente contra un array en texto plano. |
| Persistencia | Ninguna: todo `useState` local. Se pierde al navegar o recargar. |
| Pantallas | 36 `page.tsx` (35 de producto + `/estilo`, interna). |
| Marcas `// TODO backend:` | 62 en 47 archivos. |

Cada pantalla del panel ya implementa **un `useQuery` hecho a mano**:

```ts
const clave = `${fecha}|${mockError}|${reintento}`;
const [resuelto, setResuelto] = useState<{clave: string; error: boolean} | null>(null);
const estadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";
useEffect(() => { const id = setTimeout(() => setResuelto({clave, error: false}), 500); return () => clearTimeout(id); }, [clave]);
```

`clave` **es** una `queryKey`. La migración a TanStack Query es casi mecánica y los tres estados de carga ya están cableados en la UI. Ese es el mayor activo del front para esta integración.

### Estrategia

1. **Infra primero, sin tocar pantallas.** Cliente HTTP + capa de tipos + auth + TanStack Query provider. Al terminar la fase 1 el front sigue mostrando mocks y nada se rompió.
2. **Migración pantalla por pantalla**, reemplazando el bloque `clave`/`resuelto` por `useQuery`. Cada mock se borra recién cuando su última pantalla dejó de importarlo.
3. **La lógica de negocio que hoy corre en el cliente se borra**, no se adapta: disponibilidad, pricing, expiración del hold, validación de PIN, saldos de caja. El back ya la resuelve y es la autoridad.
4. **Las pantallas bloqueadas se dejan mockeadas y marcadas**, no se rompen a medias.

### Los cuatro números que ordenan el trabajo

- **13 pantallas** conectan limpio contra endpoints que existen.
- **12 pantallas** conectan con recortes de UI (campos que el DTO no trae).
- **3 pantallas** están bloqueadas total o parcialmente, todas por decisiones de producto ya tomadas (pagos y fotos se abordan más adelante).
- **1 pantalla se reubica**: Ofertas no es del panel del dueño, es del administrador de la plataforma.
- **1 flujo crítico bloqueado**: el jugador **no puede confirmar ni pagar su propia reserva**.

---

## 2. Contrato real del backend

### 2.1 Base

| Concepto | Valor real | Fuente |
|---|---|---|
| Base URL | `http://localhost:8080` — **sin `context-path`** | `application.properties` (no existe `server.servlet.context-path`) |
| Prefijo | Literalmente `/api/v1/...` | — |
| Auth | Header `Authorization: Bearer <jwt>` | `JwtAuthenticationFilter.java:31-40` |
| Sesión | STATELESS, CSRF deshabilitado | `SecurityConfig.java:56,80` |
| CORS origins | `http://localhost:5173`, `http://localhost:3000` | `app.cors.allowed-origins` |
| CORS headers | **Allowlist cerrada**: `Authorization`, `Content-Type`, `Cache-Control`, `Idempotency-Key` | `SecurityConfig.java:94` |
| CORS credentials | `allowCredentials(true)` | `SecurityConfig.java:96` |
| Expiración JWT | 3600000 ms (**1 h**); empleado 900000 ms (**15 min**) | `application.properties` |
| Fechas | Jackson por defecto, **sin zona ni offset** | No hay `spring.jackson.*` ni `@JsonFormat` en todo el proyecto |
| IDs | **`Long`** en todas las entidades. Cero UUID. | Todas las `@Entity` |
| Swagger | **Apagado** salvo profile `dev` | `springdoc.api-docs.enabled=false` |

**Serialización de fechas** (crítico, es la fuente de errores más común):

| Tipo Java | JSON |
|---|---|
| `LocalDateTime` | `"2026-08-11T18:30:00"` — **sin `Z`, sin offset** |
| `LocalDate` | `"2026-08-11"` |
| `LocalTime` | `"18:30:00"` |
| `DayOfWeek` | `"MONDAY"` … `"SUNDAY"` |
| `BigDecimal` | número JSON: `15000.00` |

> `new Date("2026-08-11T18:30:00")` en JS lo interpreta como **hora local**, que es lo que queremos. Pero `.toISOString()` lo convierte a UTC y le mete la `Z` — **nunca usar `toISOString()` para mandar fechas al back.**

### 2.2 Enums — valores exactos

| Enum | Valores |
|---|---|
| `Role` | `ADMIN`, `OWNER`, `EMPLOYEE`, `PLAYER` |
| `PlanSuscripcion` | `TRIAL`, `FREE`, `PREMIUM` |
| `EstadoReserva` | `PENDIENTE_SENA`, `CONFIRMADA`, `CANCELADA`, `CANCELADA_PRERESERVA`, `FINALIZADA`, `AUSENTE` |
| `MetodoPago` | `EFECTIVO`, `TRANSFERENCIA`, `MERCADO_PAGO`, `TARJETA_DEBITO`, `TARJETA_CREDITO` |
| `Deporte` | `FUTBOL`, `PADEL`, `TENIS`, `HOCKEY`, `BASQUET`, `VOLEY` |
| `Servicio` | `PARRILLA`, `VESTUARIOS`, `ESTACIONAMIENTO`, `BUFFET`, `WIFI`, `DUCHAS`, `KIOSCO` |
| `PermisoEmpleado` | `CREAR_RESERVA_MANUAL`, `FINALIZAR_RESERVA`, `CANCELAR_RESERVA`, `MARCAR_AUSENTE`, `REGISTRAR_VENTA_BUFFET`, `FIJAR_COMENTARIO_DESTACADO`, `OPERAR_CAJA` |
| `CategoriaGasto` | `ALQUILER`, `SERVICIOS`, `SUELDOS`, `INSUMOS`, `MANTENIMIENTO`, `IMPUESTOS`, `MARKETING`, `OTROS` |
| `EstadoVenta` | `CONFIRMADA`, `CANCELADA` |
| `EstadoTurnoCaja` | `ABIERTO`, `CERRADO` |
| `TipoMovimientoCaja` | `INGRESO`, `EGRESO` |
| `OrigenMovimientoCaja` | `RESERVA`, `VENTA_BUFFET`, `GASTO`, `MANUAL` |
| `FranjaHoraria` | `MANANA` (06–13), `TARDE` (13–19), `NOCHE` (19–24) |

Strings de valor cerrado que **no** son enum: `CierreCajaResponse.resultado` → `"SOBRANTE" \| "FALTANTE" \| "EXACTO"`.

> **Trampa de tipado:** en `ReservaResponse`, `VentaResponse`, `GastoResponse`, `MovimientoCajaResponse` y `TurnoCajaResponse` los enums se serializan como **`String`** (el mapper llama `.name()`). En los DTOs de **reportes** van tipados. El JSON es idéntico; solo cambia la firma Java. En TS conviene tiparlos siempre como el union type.

### 2.3 Endpoints

Leyenda de auth: 🌐 público · 🔒 autenticado · rol = `@PreAuthorize`.

#### Zona pública — `ComplejoPublicoController`, base `/api/v1/publico/complejos`
> Todo `GET /api/v1/publico/**` es `permitAll` (`SecurityConfig.java:66`).

| Método | Path | Params | Respuesta |
|---|---|---|---|
| 🌐 `GET` | `` | `lat`, `lng` (opcionales pero **obligatorios juntos**), `distanciaKm` (opc., default 10, **clamp a 100**), `deporte` (opc., `Deporte`), `fecha` (opc., ISO date), `hora` (opc., ISO time), `page`/`size`/`sort` (default `size=20`) | `Page<ComplejoCardResponse>` |
| 🌐 `GET` | `/{slug}` | `slug` (String) | `ComplejoDetalleResponse` |
| 🌐 `GET` | `/{slug}/disponibilidad` | `fecha` (**required**), `fechaFin` (opc.) | `DisponibilidadEstablecimientoResponse` |

Semántica del listado (`ComplejoPublicoService.buscarComplejos`):
- **Sin `lat`/`lng`** → todos los activos, **ordenados por `promedioCalificacion` desc**. Sirve al home.
- **Con `lat`/`lng`** → filtro geo, **ordenados por `distanciaKm` asc**. `distanciaKm` viene calculado en el DTO.
- `lat` sin `lng` (o al revés) → **400** `{"error":"lat y lng deben proveerse juntos"}`.
- `fecha` + `hora` juntos → filtra a complejos con al menos una cancha libre en una **ventana fija de 60 minutos** desde `hora`. Si mandás solo `fecha` o solo `hora`, **el filtro no se aplica**.

```java
ComplejoCardResponse(String slug, String nombre, String direccion, String fotoPrincipal,
                     Set<Deporte> deportes, BigDecimal precioDesde, Boolean requiereSena,
                     BigDecimal senaDesde, Double distanciaKm,
                     Double promedioCalificacion, Long cantidadCalificaciones)

ComplejoDetalleResponse(String slug, String nombre, String direccion, Double latitud, Double longitud,
                        Set<Deporte> deportes, Set<Servicio> servicios, List<String> fotos,
                        List<HorarioAtencionDto> horariosAtencion, List<CanchaPublicaDto> canchas,
                        BigDecimal precioDesde, Boolean requiereSena, BigDecimal senaDesde,
                        Double promedioCalificacion, Long cantidadCalificaciones,
                        FeedbackDestacadoDto comentarioDestacado)

CanchaPublicaDto(Long id, String nombre, Set<Deporte> deportes, BigDecimal precioDesde)
HorarioAtencionDto(DayOfWeek diaSemana, LocalTime horaApertura, LocalTime horaCierre)
FeedbackDestacadoDto(Long feedbackId, Integer puntuacion, String comentario, String jugadorNombre, LocalDateTime fechaCreacion)
```

#### Auth — `AuthController`, base `/api/v1/auth`

| Método | Path | Body | Respuesta | Notas |
|---|---|---|---|---|
| 🌐 `POST` | `/login` | `AuthRequest(email, password)` | `AuthResponse(token)` 200 | Rate limit 15/5min por IP, 8/5min por email |
| 🌐 `POST` | `/register/owner` | `RegisterRequest(email, password, nombre)` | `AuthResponse` **201** | 5/10min IP, 3/15min email |
| 🌐 `POST` | `/register/player` | — | **410 GONE siempre** | Dado de baja |
| 🔒 `POST` | `/logout` | — | **204** | Incrementa `tokenVersion` → invalida todos los JWT del usuario |
| 🌐 `POST` | `/registro/iniciar` | `IniciarRegistroRequest(email)` | 200 vacío | |
| 🌐 `GET` | `/registro/verificar` | query `token` | `VerificarTokenResponse(email, verificado)` | |
| 🌐 `POST` | `/registro/verificar-codigo` | `VerificarCodigoRegistroRequest(email, codigo)` | `VerificarCodigoRegistroResponse(token)` | |
| 🌐 `POST` | `/registro/completar` | `CompletarRegistroRequest(token, nombre, telefono?, password)` | `AuthResponse` **201** | |
| 🌐 `POST` | `/password/recuperar` | `SolicitarRecuperacionPasswordRequest(email)` | **200 siempre** | No revela si el email existe |
| 🌐 `POST` | `/password/reset` | `ResetPasswordRequest(token?, email?, codigo?, nuevaPassword)` | 200 | `token` **XOR** (`email`+`codigo`) |
| 🌐 `POST` | `/empleados/login` | `EmpleadoLoginRequest(establecimientoId?, nombre, pin)` | `AuthResponse` | **Exige cookie `saque_caja_device`.** Token de 15 min con claim `empleadoId` |

**`AuthResponse` es literalmente `{"token": "..."}`.** No trae rol, ni id, ni nombre, ni expiración.

**Claims del JWT** (`JwtService.java`): `sub` = email, `iat`, `exp`, `tokenVersion` (int) y `empleadoId` **solo** en el token de empleado. **El rol NO viaja en el token.**

Política de password (3 endpoints): ≥ 8 caracteres, al menos una letra **y** un número — `@Pattern("^(?=.*[A-Za-z])(?=.*\\d).+$")`.

#### Usuario — `UsuarioController`, base `/api/v1/usuarios`

| Método | Path | Body | Respuesta |
|---|---|---|---|
| 🔒 `GET` | `/me` | — | `PerfilResponse` |
| 🔒 `POST` | `/telefono/solicitar-codigo` | `SolicitarCodigoRequest(telefono)` | 200 |
| 🔒 `POST` | `/telefono/verificar-codigo` | `VerificarCodigoRequest(codigo)` | 200 |

```java
PerfilResponse(Long id, String email, String nombre, Role rol, PlanSuscripcion planSuscripcion,
               Boolean emailVerified, Boolean telefonoVerificado,
               Long establecimientoId,           // solo para EMPLOYEE; null para el resto
               Set<PermisoEmpleado> permisos)    // solo para EMPLOYEE; vacío para el resto
```

> `/me` resuelve el rol, pero **para un `OWNER` devuelve `establecimientoId: null`**. El owner obtiene su establecimiento con `GET /api/v1/establecimientos`.

#### Reservas — `ReservaController`, base `/api/v1/reservas`

| Método | Path | Rol | Body / Params | Respuesta |
|---|---|---|---|---|
| `POST` | `` | PLAYER, OWNER, ADMIN | `ReservaRequest` | `ReservaResponse` **201** |
| `POST` | `/manual` | OWNER, ADMIN, EMPLOYEE | `ReservaManualRequest` | `ReservaResponse` **201** |
| `POST` | `/semanal` | OWNER, ADMIN | `ReservaSemanalRequest` | **`List<ReservaResponse>`** 201 |
| `PUT` | `/{id}/confirmar` | **OWNER, ADMIN** | — | `ReservaResponse` |
| `PUT` | `/{id}/cancelar` | PLAYER, OWNER, ADMIN, EMPLOYEE | — | `ReservaResponse` |
| `PATCH` | `/{id}/finalizar` | OWNER, ADMIN, EMPLOYEE | **`FinalizarReservaRequest(metodoPago)`** | `ReservaResponse` |
| `PATCH` | `/{id}/ausente` | OWNER, ADMIN, EMPLOYEE | — | `ReservaResponse` |
| `PATCH` | `/{id}/revertir-ausencia` | OWNER, ADMIN | — | `ReservaResponse` |
| `PUT` | `/{id}/mover-cancha` | OWNER, ADMIN | `MoverReservaRequest(nuevaCanchaId)` | `ReservaResponse` |
| `GET` | `/cancha/{canchaId}` | OWNER, ADMIN | `fecha` (**req.**), `incluirCanceladas` (default `false`), `page`/`size` | `Page<ReservaResponse>` (size 10) |
| `GET` | `/establecimiento/{estId}` | OWNER, ADMIN | ídem | `Page<ReservaResponse>` (size 10) |
| `GET` | `/mis-reservas` | **PLAYER** | `estado` (opc., `EstadoReserva`), `page`/`size`/`sort` | `Page<ReservaResponse>` (size 10, `sort=fechaHoraInicio,desc`) |

> **No existe `GET /api/v1/reservas/{id}`.** No se puede releer una reserva individual por id.

```java
ReservaRequest(Long canchaId, LocalDateTime fechaHoraInicio, LocalDateTime fechaHoraFin, Deporte deporteSeleccionado)
ReservaManualRequest(Long canchaId, LocalDateTime fechaHoraInicio, LocalDateTime fechaHoraFin,
                     Deporte deporteSeleccionado, String nombreCliente, String telefonoCliente?, Boolean senaFisicaRecibida?)
ReservaSemanalRequest(Long canchaId, LocalDate fechaInicioPeriodo, LocalDate fechaFinPeriodo,
                      DayOfWeek diaSemana, LocalTime horaInicio, LocalTime horaFin,
                      Deporte deporteSeleccionado, Long jugadorId?, String nombreClienteManual?, String telefonoClienteManual?)
FinalizarReservaRequest(MetodoPago metodoPago)   // @NotNull
MoverReservaRequest(Long nuevaCanchaId)

ReservaResponse(Long id, Long jugadorId, String jugadorNombre, Long canchaId, String canchaNombre,
                LocalDateTime fechaHoraInicio, LocalDateTime fechaHoraFin,
                String estado, BigDecimal precioTotal, BigDecimal senaPagada,
                String nombreClienteManual, String telefonoClienteManual,
                Deporte deporteSeleccionado, LocalDateTime expiraEn, String metodoPago)
```

Reglas de negocio que la UI tiene que respetar (`ReservaService.java`):
- `POST /reservas` nace en **`PENDIENTE_SENA`** con **`expiraEn = now + 10 min`**. Si nadie confirma, un job la pasa a `CANCELADA_PRERESERVA`.
- `/manual` y `/semanal` nacen en **`CONFIRMADA`** con `expiraEn = null`.
- Anticipación máxima **31 días** (las semanales están exentas).
- Inicios solo `:00` o `:30`; solo `:00` si `permiteInicioMediaHora = false`.
- La duración debe estar en `cancha.duracionesPermitidas`.
- `ausente` solo desde `CONFIRMADA` y **solo si el turno ya empezó**.
- `finalizar` falla si está en `PENDIENTE_SENA`.
- Cancelación del PLAYER: se valida contra `Establecimiento.horasCancelacionAntesPartido` (default 24 h) con gracia `minutosGraciaCancelacion` (default 30 min desde que la creó). **Ninguno de los dos campos se expone en un DTO.**
- Los listados excluyen `CANCELADA` y `CANCELADA_PRERESERVA` salvo `incluirCanceladas=true`.
- Doble booking → constraint de exclusión en Postgres → **409**.

#### Establecimientos y canchas

| Método | Path | Rol | Body | Respuesta |
|---|---|---|---|---|
| `POST` | `/api/v1/establecimientos` | OWNER, ADMIN | `EstablecimientoRequest` | `EstablecimientoResponse` 201 |
| `GET` | `/api/v1/establecimientos` | OWNER, ADMIN | — | `List<EstablecimientoResponse>` |
| `PUT` | `/api/v1/establecimientos/{id}` | OWNER, ADMIN | `EstablecimientoRequest` | `EstablecimientoResponse` |
| `GET` | `/api/v1/establecimientos/{estId}/disponibilidad` | PLAYER, OWNER, ADMIN, EMPLOYEE | `fecha` (**req.**), `fechaFin` (opc.) | `DisponibilidadEstablecimientoResponse` |
| `POST` | `…/{estId}/canchas` | OWNER, ADMIN | `CanchaRequest` | `CanchaResponse` 201 |
| `GET` | `…/{estId}/canchas` | OWNER, ADMIN | — | `List<CanchaResponse>` |
| `PUT` | `…/{estId}/canchas/{canchaId}` | OWNER, ADMIN | `CanchaRequest` | `CanchaResponse` |
| `DELETE` | `…/{estId}/canchas/{canchaId}` | OWNER, ADMIN | — | **204** (desactiva, no borra) |

> `GET /api/v1/establecimientos/buscar` **ya no existe** — fue reemplazado por la zona pública.

> **`servicios` es semántico en tres estados** (`EstablecimientoService.java:61,88`): `null` = **no modificar** (deja los existentes intactos), `[]` = **borrar todos**, lista con valores = reemplazar. Como el panel hace `PUT` por sección, **omitir la clave es lo correcto** cuando se está editando otra cosa. Mandar `[]` sin querer le borra los servicios al complejo.

```java
EstablecimientoRequest(String nombre, String direccion, Double latitud, Double longitud,
                       Boolean requiereSena, List<HorarioAtencionDto> horariosAtencion,
                       Set<Servicio> servicios)
// ↑ NO acepta: slug, fotos, telefono, cuit, deportes,
//   horasCancelacionAntesPartido, minutosGraciaCancelacion

EstablecimientoResponse(Long id, String nombre, String direccion, Double latitud, Double longitud,
                        Boolean requiereSena, Boolean isActive, Long duenoId,
                        List<HorarioAtencionDto> horariosAtencion,
                        Set<Servicio> servicios,
                        Double promedioCalificacion, Long cantidadCalificaciones,
                        FeedbackDestacadoDto comentarioDestacado)

CanchaRequest(String nombre, Set<Deporte> deportes, Integer capacidad,
              BigDecimal precioBase, BigDecimal montoSena,
              List<Integer> duracionesPermitidas,
              Map<Integer,BigDecimal> preciosPorDuracion,     // {60: 15000, 90: 21000}
              Boolean permiteInicioMediaHora, List<TarifaDto> tarifas,
              List<Long> canchasFisicasIds, Integer cantidadCanchasNecesarias)

CanchaResponse(Long id, String nombre, Set<Deporte> deportes, Integer capacidad, Boolean isActive,
               Long establecimientoId, BigDecimal precioBase, BigDecimal montoSena,
               List<Integer> duracionesPermitidas, Map<Integer,BigDecimal> preciosPorDuracion,
               Boolean permiteInicioMediaHora, List<TarifaDto> tarifas,
               List<Long> canchasFisicasIds, Integer cantidadCanchasNecesarias)

TarifaDto(DayOfWeek diaSemana,        // ← UN día, no una lista
          LocalTime horaInicio, LocalTime horaFin, BigDecimal precio,
          Map<Integer,BigDecimal> preciosPorDuracion)
```

#### Disponibilidad

```java
DisponibilidadEstablecimientoResponse(Long establecimientoId, LocalDate fechaInicio, LocalDate fechaFin,
                                      List<DisponibilidadDiaResponse> dias)
DisponibilidadDiaResponse(LocalDate fecha, Boolean abierto, String motivoCierre,
                          List<DisponibilidadCanchaResponse> canchas)
DisponibilidadCanchaResponse(Long canchaId, String canchaNombre, Set<Deporte> deportes,
                             List<DisponibilidadDuracionResponse> opcionesDuracion)
DisponibilidadDuracionResponse(Integer duracionMinutos, List<SlotDisponibleResponse> slotsLibres)
SlotDisponibleResponse(LocalDateTime inicio, LocalDateTime fin)
```

Ya viene cruzado contra horarios de atención, días no laborables, bloqueos y reservas. Excluye slots pasados. Rango máximo **31 días**. Si `abierto = false`, `canchas` viene `[]` y `motivoCierre` explica.

> **Cada `SlotDisponibleResponse` trae `inicio` **y** `fin`.** Son exactamente los dos campos que pide `ReservaRequest`: hay que pasarlos tal cual, sin recalcular la duración en el front.

#### Bloqueos, días no laborables, jugadores bloqueados

| Método | Path | Rol | Notas |
|---|---|---|---|
| `POST`/`DELETE`/`GET` | `/api/v1/establecimientos/{estId}/canchas/{canchaId}/bloqueos[/{bloqueoId}]` | OWNER, ADMIN | `BloqueoCanchaRequest(fechaInicio, fechaFin, motivo)` |
| `GET` | `/api/v1/establecimientos/{estId}/bloqueos` | PLAYER, OWNER, ADMIN, EMPLOYEE | `fecha` (**req.**). `motivo` se oculta si consulta un PLAYER |
| `POST`/`DELETE`/`GET` | `…/{estId}/dias-no-laborables[/{id}]` | OWNER, ADMIN | `DiaNoLaborableRequest(fecha, motivo?)` |
| `POST`/`DELETE`/`GET` | `…/{estId}/jugadores-bloqueados[/{jugadorId}]` | OWNER, ADMIN | `BloqueoJugadorRequest(jugadorId, motivo?)` |

`BloqueoCanchaResponse` incluye `reservasAfectadas: List<ReservaAfectadaResponse>`, y cada una trae `canchasAlternativasDisponibles` — insumo directo para un flujo de "mover reserva".

#### Clientes — `ClienteController`, base `/api/v1/establecimientos/{establecimientoId}/clientes`
Todos `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")`.

| Método | Path | Params | Respuesta |
|---|---|---|---|
| `GET` | `` | `buscar` (String, opc.), `soloBloqueados` (Boolean, opc.), `page`/`size`/`sort` (default `size=20`) | `Page<ClienteResponse>` |
| `GET` | `/{jugadorId}` | — | `ClienteDetalleResponse` (**404** si ese jugador nunca reservó acá) |
| `GET` | `/{jugadorId}/reservas` | `page`/`size`/`sort` (default `size=20`, `sort=fechaHoraInicio,desc`) | `Page<ReservaResponse>` |

```java
ClienteResponse(Long jugadorId, String nombre, String telefono, String email,
                long reservasTotales, LocalDateTime ultimaReserva, long ausencias,
                BigDecimal totalGastado, Boolean bloqueado)

ClienteDetalleResponse(ClienteResponse cliente, String motivoBloqueo, LocalDateTime fechaPrimeraReserva)
```

**Semántica exacta** (`ReservaRepository`, queries del padrón):

- **Quién integra el padrón:** cualquier jugador con **al menos una reserva de cualquier estado** en el establecimiento. Un jugador con solo una `CONFIRMADA` futura ya es cliente conocido.
- **`reservasTotales`, `totalGastado`, `ultimaReserva`:** cuentan **solo `FINALIZADA`** — mismo criterio que los reportes, así que los números cierran entre pantallas.
- **`ausencias`:** cuenta solo `AUSENTE`.
- **Las reservas manuales quedan fuera** (todas las queries filtran `r.jugador IS NOT NULL`). Un cliente de mostrador sin cuenta no aparece en el padrón.
- `/{jugadorId}/reservas` lista **todos los estados**, sin filtrar — es el historial completo.

⚠️ **`sort` soporta solo 4 campos**: `nombre`, `ultimaReserva`, `reservasTotales`, `ausencias`. Cualquier otro lanza `IllegalArgumentException` → **400** `{"error":"Propiedad de orden no soportada: X"}`. **`totalGastado` NO es ordenable.** Sin `sort`, ordena por `nombre` case-insensitive.

> El filtrado, orden y paginación ocurren **en memoria** sobre todos los clientes del establecimiento (`ClienteService.listarClientes`). Funcionalmente es transparente para el front; solo importa saber que `buscar` sí ve el conjunto completo, no la página actual.

#### Buffet

| Método | Path | Rol | Body |
|---|---|---|---|
| `POST`/`PUT`/`DELETE`/`GET` | `…/{estId}/productos-buffet[/{productoId}]` | OWNER, ADMIN | `ProductoBuffetRequest(nombre, descripcion, precio, stock)` — **`stock` se ignora en el PUT** |
| `PATCH` | `…/{estId}/productos-buffet/{productoId}/stock` | OWNER, ADMIN | `AjustarStockRequest(cantidad)` — delta, admite negativo |
| `POST` | `/api/v1/buffet/ventas` | OWNER, ADMIN, EMPLOYEE | `VentaRequest` |
| `PUT` | `/api/v1/buffet/ventas/{id}/cancelar` | OWNER, ADMIN | — |
| `GET` | `/api/v1/buffet/ventas/metricas` | OWNER, ADMIN | query `establecimientoId` (**req.**), `desde`, `hasta` |
| `GET` | `/api/v1/buffet/ventas` | OWNER, ADMIN | query `establecimientoId` (**req.**), `desde`/`hasta` (**req.**, ISO.DATE), `estado` (opc., `EstadoVenta`), `page`/`size`/`sort` (default `size=20`, `sort=fechaHora,id desc`) → `Page<VentaResumenResponse>` |

```java
ProductoBuffetResponse(Long id, String nombre, String descripcion, BigDecimal precio, Integer stock, Long establecimientoId)
// ↑ NO tiene umbralAlerta

VentaRequest(Long establecimientoId, Long reservaId?, MetodoPago metodoPago, List<DetalleVentaRequest> detalles)
DetalleVentaRequest(Long productoId, Integer cantidad)
VentaResponse(Long id, LocalDateTime fechaHora, BigDecimal total, String estado, String metodoPago,
              Long establecimientoId, Long reservaId, List<DetalleVentaResponse> detalles)
DetalleVentaResponse(Long id, Long productoId, String productoNombre, Integer cantidad,
                     BigDecimal precioUnitario, BigDecimal subtotal)

// Listado: DTO liviano, SIN desglose de ítems
VentaResumenResponse(Long id, LocalDateTime fechaHora, BigDecimal total,
                     String estado, String metodoPago, Long reservaId)
```

> `VentaBuffetController` **no** está anidado bajo establecimiento: el `establecimientoId` va en el body o como query param. Rompe la convención del resto de la API.
> El listado **sin `estado` trae `CONFIRMADA` y `CANCELADA`**; con `estado` filtra. El sort default incluye `id` como desempate para que la paginación sea estable.
> El listado **no trae `detalles[]`**. Si alguna vista necesita el desglose por ítem, no hay endpoint de detalle de venta.

#### Caja y dispositivos

| Método | Path | Rol |
|---|---|---|
| `POST` | `…/{estId}/caja/abrir` | OWNER, ADMIN, EMPLOYEE |
| `GET` | `…/{estId}/caja/abierta` | OWNER, ADMIN, EMPLOYEE |
| `POST` | `…/{estId}/caja/movimientos` | OWNER, ADMIN, EMPLOYEE |
| `POST` | `…/{estId}/caja/{turnoId}/cerrar` | OWNER, ADMIN, EMPLOYEE |
| `GET` | `…/{estId}/caja/turnos` | **OWNER, ADMIN** |
| `GET` | `…/{estId}/caja/turnos/{turnoId}` | **OWNER, ADMIN** |
| `POST` | `…/{estId}/caja/dispositivos/activar-local` | OWNER, ADMIN — setea cookie |
| `POST` | `…/{estId}/caja/dispositivos/emparejar` | OWNER, ADMIN — devuelve el código crudo |
| `GET`/`DELETE` | `…/{estId}/caja/dispositivos[/{dispositivoId}]` | OWNER, ADMIN |
| 🌐 `POST` | `/api/v1/caja/emparejar` | público — setea cookie |

```java
AbrirCajaRequest(BigDecimal fondoInicial, Long dispositivoId?)
CerrarCajaRequest(BigDecimal saldoRealContado, String observaciones?)
MovimientoManualRequest(TipoMovimientoCaja tipo, BigDecimal monto, String descripcion)
   // ← sin metodoPago: los movimientos manuales SIEMPRE son EFECTIVO

CajaAbiertaResponse(TurnoCajaResponse turno, BigDecimal saldoTeoricoEfectivo,
                    Map<MetodoPago,BigDecimal> totalIngresosPorMetodoPago,
                    Map<MetodoPago,BigDecimal> totalEgresosPorMetodoPago)
   // ← NO incluye la lista de movimientos

TurnoCajaDetalleResponse(TurnoCajaResponse turno, List<MovimientoCajaResponse> movimientos)
CierreCajaResponse(Long turnoId, Long establecimientoId, LocalDateTime fechaCierre,
                   BigDecimal fondoInicial, BigDecimal saldoTeoricoEfectivo, BigDecimal saldoRealContado,
                   BigDecimal diferencia, String resultado, String observaciones)
ConsumirCodigoResponse(Long establecimientoId, String label)
EmparejarResponse(String codigo, LocalDateTime expiraEn, String urlEmparejamiento)
```

**Cookie de dispositivo** (`DispositivoCajaGate.java`): nombre `saque_caja_device`, `HttpOnly; Secure; SameSite=None; Path=/; Max-Age=90 días`.
→ **Exige HTTPS y `credentials: 'include'`.** En `http://localhost` el browser puede rechazar una cookie `Secure`.
La exigen `POST /auth/empleados/login` y `GET /establecimientos/{id}/empleados/activos`.

#### Empleados, gastos, feedback, auditoría, mails

| Método | Path | Rol | Body |
|---|---|---|---|
| `POST`/`GET` | `…/{estId}/empleados` | OWNER, ADMIN | `EmpleadoRequest(nombre, pin, permisos?)` |
| `GET` | `…/{estId}/empleados/activos` | **cookie de dispositivo** | → `List<EmpleadoNombreResponse(id, nombre)>` |
| `PUT` | `…/{estId}/empleados/{empleadoId}/permisos` | OWNER, ADMIN | `ActualizarPermisosRequest(permisos)` |
| `PUT` | `…/{estId}/empleados/{empleadoId}/pin` | OWNER, ADMIN | `CambiarPinRequest(pin)` — `\d{4}` |
| `DELETE` | `…/{estId}/empleados/{empleadoId}` | OWNER, ADMIN | 204 |
| `POST`/`PUT`/`DELETE`/`GET` | `…/{estId}/gastos[/{gastoId}]` | OWNER, ADMIN | `GastoRequest(fecha, monto, categoria, descripcion, metodoPago, comprobanteUrl?)`; GET acepta `desde`, `hasta`, `categoria`, paginado size 20 |
| `GET` | `…/{estId}/registro-auditoria` | OWNER, ADMIN | `Page<RegistroAuditoriaResponse>` size 20 |
| `POST` | `/api/v1/reservas/{reservaId}/feedback` | PLAYER | `FeedbackRequest(puntuacion 1-5, comentario?)` |
| `PUT`/`DELETE` | `/api/v1/feedback/{feedbackId}` | PLAYER | |
| `GET` | `/api/v1/establecimientos/{estId}/feedback` | OWNER, ADMIN, EMPLOYEE | `Page<FeedbackResponse>` size 10 |
| `PUT` | `/api/v1/feedback/{id}/destacar` · `/quitar-destacado` | OWNER, ADMIN, EMPLOYEE | |
| 🌐 `POST` | `/api/v1/mails/baja` | público | `BajaMarketingRequest(token)` → 204 |
| 🔒 `POST` | `/api/v1/admin/mails/oferta` | **ADMIN** (validado en el service) | `EnviarOfertaRequest(asunto, cuerpoHtml)` → **202, body vacío** |

> `EmpleadoRequest` **no tiene campo de contraseña**: solo `nombre` + `pin` de 4 dígitos.
> `EmpleadoResponse` usa **`activo`**, no `isActive` como el resto de la API.
> El comentario de `FeedbackRequest` **no se sanitiza server-side** (decisión consciente y documentada) → el front debe hacer output-encoding.

#### Reportes — base `/api/v1/establecimientos/{estId}/reportes`
Todos OWNER/ADMIN, todos con `desde` y `hasta` requeridos (ISO date, ambos inclusive).

| Path | Params extra | Respuesta |
|---|---|---|
| `/facturacion` | — | `FacturacionReporteResponse` |
| `/ocupacion` | — | `OcupacionReporteResponse` |
| `/horarios-pedidos` | `topN` (default 10) | `HorariosPedidosReporteResponse` |
| `/clientes` | `topN` (default 10) | `ClientesReporteResponse` |
| `/gastos` | — | `GastosReporteResponse` |
| `/resultado` | — | `ResultadoReporteResponse` |
| `/cierres-caja` | — | `CierreCajaReporteResponse` |

```java
Comparativo<T>(T actual, T anterior)     // JSON: {"actual": X, "anterior": Y}
RangoFechas(LocalDate desde, LocalDate hasta)

FacturacionReporteResponse(RangoFechas periodoActual, RangoFechas periodoAnterior,
                           Comparativo<BigDecimal> totalFacturado,
                           List<DesglosePorMetodoPagoDto> desglosePorMetodoPago,
                           List<PuntoFacturacionDiariaDto> serieTemporal)
DesglosePorMetodoPagoDto(MetodoPago metodoPago, Comparativo<BigDecimal> monto, Comparativo<Long> cantidadReservas)
PuntoFacturacionDiariaDto(int diaIndice, LocalDate fechaActual, BigDecimal montoActual,
                          LocalDate fechaAnterior, BigDecimal montoAnterior)   // ← punto PAREADO

OcupacionReporteResponse(RangoFechas periodoActual, RangoFechas periodoAnterior,
                         Comparativo<BigDecimal> porcentajeOcupacionGeneral,
                         List<OcupacionPorFranjaDto> ocupacionPorFranja,
                         List<OcupacionPorCanchaDto> ocupacionPorCancha, String notaMetodologica)
OcupacionPorFranjaDto(FranjaHoraria franja, Comparativo<BigDecimal> porcentajeOcupacion,
                      Comparativo<BigDecimal> horasReservadas, Comparativo<BigDecimal> horasDisponibles)

HorariosPedidosReporteResponse(RangoFechas periodo, List<HorarioPedidoDto> ranking)
HorarioPedidoDto(DayOfWeek diaSemana, int hora, long cantidadReservas)

ClientesReporteResponse(RangoFechas periodoActual, RangoFechas periodoAnterior,
                        Comparativo<Long> clientesNuevos, AusenciasInfo ausencias, List<TopClienteDto> topClientes)
AusenciasInfo(boolean disponible, Long total, String motivoNoDisponible)
TopClienteDto(Long jugadorId, String nombre, long cantidadReservas, long ausencias)

ResultadoReporteResponse(RangoFechas periodoActual, RangoFechas periodoAnterior,
                         Comparativo<BigDecimal> totalFacturado, Comparativo<BigDecimal> totalGastos,
                         Comparativo<BigDecimal> neto)
```

> **El `Comparativo<T>` está al nivel de CADA MÉTRICA**, no al nivel del reporte. El front hoy lo tiene al revés (`Comparativo<FacturacionReporteResponse>`).
> Facturación, ocupación, horarios y clientes cuentan **solo reservas `FINALIZADA`**.

### 2.4 Paginación

`Pageable` estándar de Spring Data, sin configuración custom → query params **`page`** (0-indexed), **`size`**, **`sort`** (`sort=campo,direccion`, repetible).

**Tope duro de `size` = 100** (`ReservaService.capPageSize`). Si pedís más, lo recorta en silencio.

Forma del `Page<T>`:
```json
{ "content": [...], "totalPages": 3, "totalElements": 27, "size": 10, "number": 0,
  "first": true, "last": false, "numberOfElements": 10, "empty": false, "sort": {...}, "pageable": {...} }
```

### 2.5 Formas de error — **son tres, y son incompatibles entre sí**

**Forma A — la común:** `{"error": "<mensaje>"}`

| Excepción | HTTP |
|---|---|
| `EntityNotFoundException` | 404 |
| `IllegalArgumentException` (la mayoría de las validaciones de negocio) | 400 |
| `BadCredentialsException` | 401 `{"error":"Credenciales inválidas"}` |
| `AccessDeniedException` | 403 |
| `JugadorBloqueadoException` | 403 |
| `TokenExpiradoException`, `ReservaExpiradaException` | **410 GONE** |
| `RateLimitExceededException` | 429 |
| Catch-all | 500 |
| Sin token / token inválido (filter chain) | 401 `{"error":"No autenticado"}` |
| Autenticado sin rol (filter chain) | 403 `{"error":"No autorizado"}` |

**Forma B — bean validation (`MethodArgumentNotValidException`, 400): NO tiene clave `error`.** Es un mapa plano campo → mensaje:
```json
{ "canchaId": "El ID de la cancha es obligatorio",
  "fechaHoraInicio": "La fecha y hora de inicio es obligatoria" }
```

**Forma C — conflictos (409): dos claves.**
```json
{ "error": "Conflicto de concurrencia",
  "message": "La cancha acaba de ser reservada o modificada por otro usuario. Por favor, actualiza la disponibilidad e intenta nuevamente." }
```
También `{"error":"Conflicto de integridad","message":"…"}`.

**El parser de errores del cliente HTTP tiene que cubrir las tres.** Es el detalle que más silenciosamente rompe la UI.

### 2.6 Idempotencia y rate limiting

**Header `Idempotency-Key`** (opt-in, ya está en la allowlist de CORS). Solo aplica a **POST** en 4 rutas: `/api/v1/reservas`, `/reservas/manual`, `/reservas/semanal`, `/buffet/ventas`.
- Replay exitoso → status/body originales + header `Idempotency-Replayed: true`
- Misma clave, otro body → **422**
- Solicitud en curso → **409**
- Máx. 255 caracteres. Retención 24 h. Los 5xx no se cachean.

**Rate limits** (429):

| Ruta | Por IP | Por identidad |
|---|---|---|
| `/auth/login` | 15 / 5 min | 8 / 5 min por email |
| `/auth/empleados/login` | 30 / 5 min | 5 / 5 min por (estId, nombre) |
| `/auth/register/owner` | 5 / 10 min | 3 / 15 min por email |
| `/caja/emparejar` | 10 / 5 min | — |

---

## 3. Arquitectura propuesta para el front

### 3.1 Estructura de archivos

```
src/lib/api/
  config.ts        # BASE_URL desde NEXT_PUBLIC_API_URL
  errores.ts       # ApiError + parseo de las 3 formas
  cliente.ts       # apiFetch<T>() — la única función que llama fetch()
  sesion.ts        # token, PerfilResponse, establecimientoId activo
  keys.ts          # todas las query keys en un solo lugar
  tipos/
    comunes.ts     # Page<T>, Comparativo<T>, RangoFechas, enums
    auth.ts  reservas.ts  establecimientos.ts  disponibilidad.ts
    buffet.ts  caja.ts  gastos.ts  empleados.ts  reportes.ts  publico.ts
  endpoints/
    auth.ts  reservas.ts  publico.ts  …   # una función por endpoint, tipada
src/hooks/api/
  use-perfil.ts  use-agenda.ts  use-disponibilidad.ts  …
src/app/providers.tsx   # QueryClientProvider (client component)
```

### 3.2 Cliente HTTP — `src/lib/api/cliente.ts`

**Responsabilidades (y solo estas):**

1. **Base URL.** `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`). Un `.env.local` nuevo — hoy el proyecto no tiene ninguno.
2. **Token JWT.** Adjunta `Authorization: Bearer <token>` si hay sesión. Nunca lo adjunta a rutas `/api/v1/publico/**` ni a `/auth/login|register|registro|password`.
3. **Parseo de errores → `ApiError`.** Las tres formas de §2.5 colapsan en un único tipo:
   ```ts
   export class ApiError extends Error {
     status: number;
     mensaje: string;                                // para mostrar al usuario
     camposInvalidos?: Record<string, string>;       // forma B → resaltar inputs
     detalle?: string;                               // forma C → clave "message"
   }
   ```
   Heurística de parseo: si el body tiene `error` → forma A o C (`message` va a `detalle`); si no tiene `error` y todos los valores son strings → forma B.
4. **401 → cierre de sesión.** El back invalida todos los JWT vía `tokenVersion` en cada logout/cambio de password. Un 401 significa sesión muerta: limpiar y redirigir a `/ingresar`. **No intentar refresh** — no existe endpoint de refresh.
5. **`credentials: 'include'`** solo en las rutas de caja (las que usan la cookie `saque_caja_device`). En el resto se omite.
6. **`Idempotency-Key`** opcional por parámetro, generado con `crypto.randomUUID()`, en las 4 rutas que lo aceptan.

**Lo que el cliente NO hace:** cache, reintentos, deduplicación. Eso es de TanStack Query.

> **Restricción de CORS:** la allowlist de headers del back es cerrada (`Authorization`, `Content-Type`, `Cache-Control`, `Idempotency-Key`). Cualquier header custom que agreguemos hace fallar el preflight.

### 3.3 Capa de tipos

Escritos a mano en `src/lib/api/tipos/`, espejando los records Java **campo por campo, con el mismo nombre**. Sin renombrar a "más lindo": si el DTO dice `cantidadCanchasNecesarias`, el tipo TS dice `cantidadCanchasNecesarias`. El renombrado, si hace falta, ocurre en el componente.

Convenciones:

| Java | TypeScript |
|---|---|
| `Long`, `Integer` | `number` |
| `BigDecimal` | `number` |
| `LocalDate` | `string` — alias `type FechaISO = string` |
| `LocalDateTime` | `string` — alias `type FechaHoraISO = string` |
| `LocalTime` | `string` — alias `type HoraISO = string` |
| `DayOfWeek` | `type DiaSemanaBack = "MONDAY" \| … \| "SUNDAY"` |
| enum | union type de literales |
| `Set<X>` / `List<X>` | `X[]` |
| `Map<Integer,BigDecimal>` | `Record<string, number>` — **ojo: en JSON las claves son strings** |
| campo opcional | `\| null` (no `?`) — el back manda `null`, no omite la clave |

`Page<T>` y `Comparativo<T>` van en `comunes.ts` como genéricos.

### 3.4 TanStack Query

Agregar `@tanstack/react-query@^5`. Crear `src/app/providers.tsx` (client component) y envolver `{children}` en `src/app/layout.tsx:31-33` — hoy no hay ningún provider en el árbol.

**Defaults del QueryClient:**
```ts
{ queries: {
    staleTime: 30_000,
    retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
    refetchOnWindowFocus: false,
} }
```
No reintentar 4xx: un 403 o un 400 de validación no mejora reintentando, y el rate limit del back (8 logins por email cada 5 min) castiga los reintentos ciegos.

**Query keys** — todas centralizadas en `src/lib/api/keys.ts`, jerárquicas para poder invalidar por prefijo:

```ts
export const keys = {
  perfil: () => ["perfil"] as const,
  publico: {
    complejos: (f: FiltrosBusqueda) => ["publico", "complejos", f] as const,
    detalle:   (slug: string)       => ["publico", "complejo", slug] as const,
    disponibilidad: (slug: string, fecha: string, fechaFin?: string) =>
      ["publico", "complejo", slug, "disponibilidad", fecha, fechaFin ?? null] as const,
  },
  reservas: {
    mias:  (estado?: EstadoReserva, page = 0) => ["reservas", "mias", estado ?? null, page] as const,
    porEstablecimiento: (estId: number, fecha: string, incluirCanceladas = false) =>
      ["reservas", "establecimiento", estId, fecha, incluirCanceladas] as const,
  },
  canchas: (estId: number) => ["canchas", estId] as const,
  caja: { abierta: (estId: number) => ["caja", estId, "abierta"] as const, /* … */ },
  reportes: (estId: number, tipo: string, desde: string, hasta: string) =>
    ["reportes", estId, tipo, desde, hasta] as const,
};
```

**Convención de hooks** — `src/hooks/api/use-<recurso>.ts`, nombres en español como el resto del código:

```ts
// lecturas
export function useAgenda(estId: number, fecha: string) {
  return useQuery({
    queryKey: keys.reservas.porEstablecimiento(estId, fecha),
    queryFn: () => endpoints.reservas.porEstablecimiento(estId, fecha),
    enabled: Number.isFinite(estId),
  });
}

// mutaciones: invalidan por prefijo
export function useFinalizarReserva(estId: number, fecha: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, metodoPago }: { id: number; metodoPago: MetodoPago }) =>
      endpoints.reservas.finalizar(id, { metodoPago }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: keys.caja.abierta(estId) });  // finalizar mueve la caja
    },
  });
}
```

### 3.5 Sesión y autorización

Reemplazar `src/lib/rol-panel.ts` y `src/lib/permisos.ts` (que hoy resuelven todo contra mocks y por defecto dan `"dueno"`).

**Flujo de login:**
```
POST /api/v1/auth/login {email, password}  →  { token }
   ↓ guardar token
GET  /api/v1/usuarios/me                   →  PerfilResponse { rol, permisos, establecimientoId, … }
   ↓ sembrar en el cache con queryKey ["perfil"]
```

- **`useRolPanel()`** pasa a leer `perfil.rol` (`OWNER` / `EMPLOYEE` / `PLAYER` / `ADMIN`). Se elimina el default `"dueno"`.
- **`usePermisos()`** pasa a leer `perfil.permisos` (`PermisoEmpleado[]`). Para `OWNER`/`ADMIN` devuelve `true` siempre — el back hace lo mismo.
- **`establecimientoId` activo**: `/me` lo devuelve solo para `EMPLOYEE`. Para un `OWNER` sale de `GET /api/v1/establecimientos` (`[0].id`). Guardarlo en el cache y exponerlo con `useEstablecimientoActivo()` — **casi todos los endpoints del panel lo necesitan en el path**.
- **Storage del token**: `localStorage` bajo `saque:token`, siguiendo la convención de prefijo `saque:` que ya usa `usuario.ts`. En el logout, llamar `POST /auth/logout` **antes** de borrarlo.
- `src/lib/usuario.ts` (`Usuario = {email, nombre, telefono}`) se reemplaza por `PerfilResponse`. El patrón `useSyncExternalStore` se puede conservar para el token; el perfil vive en el cache de Query.

> **La autorización del cliente es solo para UX.** El back valida con `@PreAuthorize` en cada endpoint. Los guards del front evitan pantallas vacías y 403 innecesarios; no son la barrera de seguridad.

### 3.6 Estrategia de migración incremental

**Regla:** ninguna pantalla queda a medias en un commit. El orden por pantalla es siempre:

1. Escribir el tipo del DTO en `tipos/` y la función en `endpoints/`.
2. Escribir el hook en `hooks/api/`.
3. En la page: reemplazar el bloque `clave`/`resuelto` por el hook. `estadoCarga` se deriva:
   ```ts
   const estadoCarga: EstadoCarga = isPending ? "cargando" : isError ? "error" : "listo";
   ```
   Los tres estados y sus skeletons ya existen: **no se toca JSX de carga/error**.
4. Reemplazar las mutaciones `setState` por `useMutation`.
5. Borrar del mock lo que dejó de usarse. Si otra pantalla todavía lo importa, el mock se queda hasta que esa también migre.

**Sobre los flags de simulación** (`?mockError=1`, `?mockVacio=1`, `?mockPago=`): están en 15+ pantallas y son la herramienta de QA del proyecto. **Conservarlos** como override en la capa `endpoints/`: si el flag está presente, la función lanza un `ApiError` sintético o devuelve `[]` en vez de llamar a la red. Cuesta poco y mantiene la UI de error/vacío testeable sin backend.

**Lógica de negocio a borrar** (no adaptar — el back es la autoridad):

| Archivo | Qué se borra | Lo reemplaza |
|---|---|---|
| `src/lib/disponibilidad.ts` | `segmentosDelDia`, `horariosLibres`, `ocupadoConVariacion` | `GET …/disponibilidad` |
| `src/mocks/tarifas.ts` | `calcularPrecio` | `ReservaResponse.precioTotal` |
| `src/lib/reserva-intencion.ts` | `DURACION_BLOQUEO_MS`, `asegurarReservaCongelada` | `ReservaResponse.expiraEn` |
| `src/mocks/caja.ts` | `calcularSaldoTeorico`, `calcularTotalesPorMetodo`, `calcularDiferencia` | `CajaAbiertaResponse`, `CierreCajaResponse` |
| `src/app/caja/pin/[empleadoId]` | validación del PIN contra el array | `POST /auth/empleados/login` |
| `src/mocks/reservas-jugador.ts` | `puedeCancelarse` | El back valida; manejar el 400 |
| `src/mocks/gastos.ts` | `totalGastos`, `gastosPorCategoria` | `GET /reportes/gastos` |

Se conservan tal cual: `src/lib/fecha.ts`, `src/lib/formato.ts`, `src/lib/hora-actual.ts`, `src/lib/password.ts` (su regla coincide con la del back).

---

## 4. Plan por pantalla

Estado: ✅ conecta limpio · ⚠️ conecta con recortes · ⛔ bloqueada · 🔀 se reubica.

### 4.1 Marketplace público

| Pantalla | Mock actual | Endpoint(s) | Op. | Cambios | Riesgo |
|---|---|---|---|---|---|
| ✅ `/` | `COMPLEJOS` (indirecto) | `GET /publico/complejos` sin `lat`/`lng` (orden por rating) | R | Home es casi todo copy estático; opcionalmente sumar destacados | Bajo |
| ⚠️ `/buscar` | `COMPLEJOS`, `DEPORTES`, `ZONAS`, `FRANJAS` | `GET /publico/complejos?lat&lng&distanciaKm&deporte&fecha&hora&page&size` | R | Ver detalle ↓ | **Alto** |
| ⚠️ `/complejo/[slug]` | `COMPLEJOS`, `SERVICIOS` | `GET /publico/complejos/{slug}` + `/{slug}/disponibilidad?fecha&fechaFin` | R | Ver detalle ↓ | Medio |

**`/buscar` en detalle.** El filtrado y ordenamiento hoy corren en el cliente (`buscar/page.tsx:42-47`) y **`zona` y `franja` se ignoran por completo en el filtro**; solo alimentan el copy. Al conectar:

- `zona` → el back pide `lat`/`lng`, no una zona. Mapear cada valor de `ZONAS` a un centroide lat/lng hardcodeado en el front; para `"cerca"` usar `navigator.geolocation` con fallback al centroide de José C. Paz. **`lat` y `lng` deben ir juntos o el back tira 400.**
- `franja` (`manana` 6–12 / `tarde` 12–18 / `noche` 18–24) → el back toma una **`hora`** puntual y filtra una ventana de 60 min. No son equivalentes. Recomendación: mandar la hora de inicio de la franja como aproximación y ajustar el copy ("desde las 18:00"), o quitar el filtro de la query y filtrar contra `/disponibilidad` en el detalle.
- El filtro de disponibilidad **solo se aplica si mandás `fecha` Y `hora`**. Con una sola de las dos, el back devuelve todo.
- **`VenueCard` muestra chips de horarios libres (`complejo.horarios[]`) y `ComplejoCardResponse` no los trae.** Traerlos implicaría un `GET /{slug}/disponibilidad` por card (N+1). Recomendación: **quitar los chips de la card** y dejar el CTA hacia el detalle, que sí tiene la grilla real.
- Bonus: esto arregla el bug donde la card linkea a `/reservar/{id}?fecha&hora` **sin `cancha`** y el checkout lo rechaza (`venue-card.tsx:84`).
- La paginación pasa a ser real (`Page`, size 20) — hoy no existe.
- **Ganancias:** `distanciaKm`, `precioDesde`, `senaDesde`, `deportes`, `fotoPrincipal` y `promedioCalificacion` ahora vienen del back. `formatearDistancia` se mantiene.

**`/complejo/[slug]` en detalle.**
- `slug` ahora es real: se elimina `buscarComplejo(slug)` sobre el array.
- **Se borra el parser de `horarioAtencion` string** (`"09 a 24"` → apertura/cierre en `grilla-disponibilidad.tsx`). Llega `HorarioAtencionDto{diaSemana, horaApertura, horaCierre}` estructurado. También hay que rehacer el `openingHoursSpecification` del JSON-LD sobre el nuevo shape.
- **`GrillaDisponibilidad` se reescribe**: `ocupadoConVariacion` + `segmentosDelDia` desaparecen; se consume `/{slug}/disponibilidad?fecha&fechaFin` (hasta 31 días, alcanza para la navegación de 7 días).
- `fotos` pasa de `string[]` de etiquetas a `string[]` de **URLs reales** → `GaleriaFotos` ahora renderiza `<img>`.
- `servicios` pasa a `Servicio[]`: remapear el mock `SERVICIOS` (`vestuario` → `VESTUARIOS`) y agregar `DUCHAS` y `KIOSCO`.
- **`reglas` no existe en `ComplejoDetalleResponse`** → quitar el bloque.
- El JSON-LD hardcodea `addressLocality: "José C. Paz"`; con `direccion` real hay que derivarlo o quitarlo.

### 4.2 Ciclo del jugador

| Pantalla | Mock actual | Endpoint(s) | Op. | Cambios | Riesgo |
|---|---|---|---|---|---|
| ⛔ `/reservar/[id]` | `COMPLEJOS`, `reserva-intencion` | `POST /api/v1/reservas` | C | Ver ↓ | **Crítico** |
| ⚠️ `/reservar/[id]/ok` | `COMPLEJOS` | — (usa el `ReservaResponse` del POST) | — | No hay `GET /reservas/{id}` | Medio |
| ⚠️ `/mis-reservas` | `RESERVAS_JUGADOR` | `GET /reservas/mis-reservas` + `PUT /{id}/cancelar` | R + U | Ver ↓ | Medio |
| ⚠️ `/perfil` | `PERFIL_MOCK`, `usuario.ts` | `GET /usuarios/me`, `POST /usuarios/telefono/*`, `POST /auth/logout` | R + U | Edición bloqueada | Medio |

**`/reservar/[id]` — el checkout.**
- `POST /api/v1/reservas` con `{canchaId, fechaHoraInicio, fechaHoraFin, deporteSeleccionado}` + header `Idempotency-Key`.
- **Pasar el `SlotDisponibleResponse` completo** (`inicio` + `fin`) desde la grilla. No recalcular `fin` a partir de `duracionMin`: el back valida que la duración esté en `duracionesPermitidas` y que el inicio caiga en `:00`/`:30`.
- El query param `cancha` debe pasar a ser el **`canchaId: number`** real.
- **El contador de 10 minutos pasa a ser real**: viene en `ReservaResponse.expiraEn`. `CountdownBadge` se alimenta de ahí y `DURACION_BLOQUEO_MS` de `reserva-intencion.ts` se borra.
- Errores a manejar explícitamente: **409** (doble booking, mostrar "el turno se acaba de ocupar" y refrescar disponibilidad), **403** `JugadorBloqueadoException`, **400** (fuera de los 31 días de anticipación), **410** `ReservaExpiradaException`.
- ⛔ **El pago no se puede completar.** Detalle en §6.

**`/mis-reservas`.**
- `GET /reservas/mis-reservas?estado&page&size&sort` — **solo rol `PLAYER`**. Un `OWNER` recibe 403.
- Tabs "próximas"/"anteriores": derivarlas de `fechaHoraInicio` vs. ahora sobre una sola query, o hacer dos queries filtrando por `estado`.
- **Faltan en `ReservaResponse`**: nombre y dirección del establecimiento (solo trae `canchaNombre`), y `horasLimiteCancelacion`. Ver §5 y §6.
- `puedeCancelarse()` se borra: el front no tiene los datos para calcularlo. Mostrar siempre el botón y manejar el 400 con el mensaje del back.
- La cancelación pasa de `setState` local a `PUT /{id}/cancelar` + `invalidateQueries`.

**`/perfil`.**
- Lectura: `GET /usuarios/me` cubre `nombre`, `email`, `emailVerified`, `telefonoVerificado`. `PERFIL_MOCK` se borra.
- ⛔ **Guardar `nombre`/`telefono` no tiene endpoint** (`/me` es GET). Ver §6.
- ⛔ **Eliminar cuenta no tiene endpoint.** Hoy `confirmarEliminar()` solo hace `borrarUsuario()` (borra localStorage), lo cual es engañoso.
- "Cerrar sesión" → `POST /auth/logout` + limpiar token + `queryClient.clear()`.
- Se puede **sumar** el flujo de verificación de teléfono (`POST /usuarios/telefono/solicitar-codigo` + `/verificar-codigo`), que hoy el front no expone.

### 4.3 Auth

| Pantalla | Endpoint(s) | Cambios | Riesgo |
|---|---|---|---|
| ⚠️ `/ingresar` | `POST /auth/login` | **Rediseño**: hoy pide solo email (passwordless); el back exige email+password | **Alto** |
| ⚠️ `/verificar` | `POST /auth/registro/verificar-codigo` | Se recicla como paso de registro, no de login | Medio |
| ⚠️ `/completar-perfil` | `POST /auth/registro/completar` | **Agregar campo password** (obligatorio en el DTO) | Medio |
| ✅ `/verificar-email` | `GET /auth/registro/verificar`, `POST /registro/verificar-codigo`, `/registro/completar` | Ya está alineado; quitar el mock de tokens `"expirado"`/`"owner"` | Bajo |
| ✅ `/recuperar-password` | `POST /auth/password/recuperar` | Match 1:1 | Bajo |
| ✅ `/restablecer` | `POST /auth/password/reset` | Match 1:1 (soporta token **y** email+código) | Bajo |
| ✅ `/baja-mails` | `POST /api/v1/mails/baja` | Match 1:1 | Bajo |

**El funnel `/ingresar` → `/verificar` → `/completar-perfil` no existe en el back.** Hoy es passwordless por OTP; el back tiene **login con contraseña** y un **registro en 3 pasos** distinto:

```
Login:      POST /auth/login {email, password} → {token}

Registro:   POST /auth/registro/iniciar {email}                     → 200, manda mail
            POST /auth/registro/verificar-codigo {email, codigo}    → {token}  (token de registro, NO el JWT)
            POST /auth/registro/completar {token, nombre, telefono?, password} → {token} (JWT)
```

Corrección en el front: `/ingresar` se convierte en login email+password con un link a registro; `/verificar` se recicla como el paso de código del registro (la UI de OTP de 6 dígitos ya está hecha y sirve); `/completar-perfil` suma los campos password + confirmación, reutilizando `esPasswordValida` de `src/lib/password.ts` (su regla ya coincide con la del back: ≥8 y al menos un número — conviene ajustar el copy porque el back además exige al menos una letra).

`CODIGO_MOCK = "123456"` (`verificar/page.tsx:11`) se borra.

### 4.4 Kiosco de caja

| Pantalla | Endpoint(s) | Cambios | Riesgo |
|---|---|---|---|
| ⚠️ `/caja/emparejar/[token]` | `POST /api/v1/caja/emparejar {codigo}` | Público. Setea la cookie. **Requiere HTTPS** | **Alto** |
| ⚠️ `/caja` | `GET /establecimientos/{id}/empleados/activos` | Requiere la cookie. `establecimientoId` sale de `ConsumirCodigoResponse` | Medio |
| ✅ `/caja/pin/[empleadoId]` | `POST /auth/empleados/login {establecimientoId, nombre, pin}` | **El PIN se valida en el server** | Medio |

- El param de ruta es `[empleadoId]` pero **el back pide `nombre`**, no el id. `EmpleadoNombreResponse` trae `{id, nombre}`: usar el id para la ruta y mandar el `nombre` en el body.
- **Se borra la validación de PIN del cliente** (`caja/pin/[empleadoId]/page.tsx:69-80`) — hoy compara contra `PANEL_EMPLEADOS[].pin` en texto plano. También se borra el rate limit simulado: el back ya impone 30/5min por IP y 5/5min por (establecimiento, nombre).
- El token de empleado dura **15 minutos**. La UI del kiosco tiene que manejar la expiración volviendo a la lista de nombres, no quedándose colgada en un 401.
- `sesion-caja.ts` conserva las claves de UI (`saque_caja_nombre_local`, etc.) pero **`saque_caja_emparejado` deja de ser la fuente de verdad**: el emparejamiento real es la cookie `HttpOnly`, que el JS no puede leer. El estado "emparejado" se infiere de que `GET /empleados/activos` responda 200 y no 403.
- ⚠️ **La cookie es `SameSite=None; Secure`** → en `http://localhost` el browser puede rechazarla. Para desarrollo hace falta HTTPS local (`next dev --experimental-https`) o el flag de Chrome para cookies inseguras. **Verificar esto antes de empezar la fase de caja.**

### 4.5 Panel

| Pantalla | Mock actual | Endpoint(s) | Op. | Riesgo |
|---|---|---|---|---|
| ⚠️ `/panel/agenda` | `turnosDelDia`, `bloqueosDelDia`, `PANEL_CANCHAS` | `GET /reservas/establecimiento/{id}?fecha` · `GET /{id}/bloqueos?fecha` · `POST /reservas/manual` · `PUT /{id}/cancelar` · `PATCH /{id}/finalizar` · `PATCH /{id}/ausente` · `PATCH /{id}/revertir-ausencia` · `PUT /{id}/mover-cancha` | RC­UD | **Alto** |
| ⚠️ `/panel/canchas` | `PANEL_CANCHAS` | `GET/POST/PUT/DELETE …/canchas` + endpoints de bloqueos | CRUD | Medio |
| ⚠️ `/panel/precios` | `PANEL_TARIFAS` | `PUT …/canchas/{id}` (las tarifas van dentro de `CanchaRequest`) | U | Medio |
| ⚠️ `/panel/clientes` | `PANEL_CLIENTES` | `GET …/clientes?buscar&soloBloqueados` | R | Bajo |
| ⚠️ `/panel/clientes/[id]` | `PANEL_HISTORIAL` | `GET …/clientes/{jugadorId}` · `…/{jugadorId}/reservas` · `POST`/`DELETE …/jugadores-bloqueados` | R+U | Medio |
| ⚠️ `/panel/buffet/productos` | `PANEL_PRODUCTOS_BUFFET` | `GET/POST/PUT/DELETE …/productos-buffet` · `PATCH /{id}/stock` | CRUD | Bajo |
| ✅ `/panel/buffet/vender` | `PANEL_PRODUCTOS_BUFFET` | `POST /api/v1/buffet/ventas` | C | Bajo |
| ⚠️ `/panel/caja` | `estado-caja.ts` | `GET …/caja/abierta` · `POST …/caja/abrir` · `POST …/caja/movimientos` | R+C | Medio |
| ✅ `/panel/caja/cerrar` | `estado-caja.ts` | `POST …/caja/{turnoId}/cerrar` | U | Bajo |
| ⚠️ `/panel/caja/cerrado/[turnoId]` | `buscarTurnoCerradoPorId` | `GET …/caja/turnos/{turnoId}` | R | Medio |
| ✅ `/panel/caja/historial` | `PANEL_HISTORIAL_CAJA` | `GET …/caja/turnos` | R | Bajo |
| ✅ `/panel/caja/historial/[turnoId]` | `PANEL_HISTORIAL_CAJA` | `GET …/caja/turnos/{turnoId}` | R | Bajo |
| ⚠️ `/panel/pagos` | `PANEL_PAGOS`, `PANEL_VENTAS` | `GET /reportes/facturacion` + `GET /buffet/ventas` + `/metricas` + `PUT /ventas/{id}/cancelar` | R+U | — |
| ✅ `/panel/gastos` | `PANEL_GASTOS` | `GET/POST/PUT/DELETE …/gastos` | CRUD | Bajo |
| ⚠️ `/panel/reportes` | `generarReporte()` | 5 endpoints de `/reportes/*` | R | **Alto** |
| ⚠️ `/panel/configuracion` | 5 mocks de `config.ts` | `PUT /establecimientos/{id}` (datos + horarios + **servicios** ✅) + dispositivos ✅ | U | Medio |
| ⚠️ `/panel/configuracion/empleados` | `PANEL_EMPLEADOS` | `GET/POST …/empleados` · `PUT /{id}/permisos` · `PUT /{id}/pin` · `DELETE /{id}` | CRUD | **Alto** |
| 🔀 `/panel/configuracion/ofertas` | `simularLlamada` | `POST /admin/mails/oferta` — **se mueve a `/admin/ofertas`** | C | — |
| — `/estilo` | `COMPLEJOS` | — | — | Herramienta interna, no se conecta |

**`/panel/agenda` — la pantalla más compleja.**
- Un `Turno` del mock ≠ un `ReservaResponse`. El cliente está anidado (`cliente: {nombre, telefono}`) mientras el back lo devuelve plano y en **dos pares de campos según el origen**: `jugadorId`/`jugadorNombre` (reserva de jugador, sin teléfono) o `nombreClienteManual`/`telefonoClienteManual` (reserva manual). Hace falta un normalizador en el front.
- **`marcarPagado` mapea a `PATCH /{id}/finalizar`, que exige `metodoPago` (`@NotNull`). La agenda no tiene selector de método de pago** → hay que agregarlo. Ver §5.
- La vista semanal necesita **7 requests** (`fecha` es un único día y requerido). Emitirlas en paralelo con `useQueries`.
- Subir `size` explícitamente: el default es 10 y un día con 8 canchas lo supera fácil. **Tope 100.**
- `repiteSemanal` no existe en `ReservaResponse` → quitar el badge. `POST /reservas/semanal` sigue creando series, pero devuelve `List<ReservaResponse>` sin marca de pertenencia a la serie.
- `EstadoTurno` (4 valores) → `EstadoReserva` (6). Ver §5.
- 409 en el alta manual (doble booking) → refrescar la agenda y mostrar el mensaje del back.

**`/panel/canchas` y `/panel/precios`.**
- Renombres: `preciosBase: PrecioPorDuracion[]` → `preciosPorDuracion: Record<string, number>`; `canchasFisicas` → `canchasFisicasIds`; `canchasNecesarias` → `cantidadCanchasNecesarias`; `mantenimientos` → endpoints separados de bloqueos.
- `CanchaRequest` exige `precioBase` (`@NotNull @Positive`) además del map por duración. El front hoy solo maneja precios por duración → agregar el campo o derivarlo de la duración más chica.
- **`TarifaDto` tiene UN `diaSemana`**, mientras el front modela `Tarifa.dias: DiaSemana[]`. Una tarifa del front con 5 días = **5 `TarifaDto`**. Hay que expandir al enviar y agrupar al recibir.
- Las tarifas viajan dentro de `CanchaRequest` → editar una tarifa es un **`PUT` completo de la cancha**. Leer la cancha, mutar el array, reenviar entera. No hay endpoint granular de tarifas.
- La validación de solapes de `form-tarifa.tsx` se conserva (evita un 400 innecesario), pero el back es la autoridad.
- `calcularPrecio` y `VistaPreviaPrecio`: la calculadora no tiene endpoint. O se conserva la lógica client-side aceptando que puede desincronizarse, o se quita el bloque. **Recomendación: quitarlo** — es la clase de duplicación que después miente.

**`/panel/clientes` y `/panel/clientes/[id]`.**
- El listado conecta contra `GET …/clientes` y **el `buscar` es server-side**: se borra el filtro client-side de `tabla-clientes.tsx` y se pasa el término como query param con debounce.
- El orden también pasa al back, pero **solo acepta `nombre`, `ultimaReserva`, `reservasTotales` y `ausencias`**. `ColumnaOrdenable` del front ya coincide con esos 4 — **no agregar `totalGastado` como columna ordenable**, devuelve 400.
- **`esFrecuente` no existe en el back.** Derivarlo en el front desde `reservasTotales >= N` y **borrar `alternarFrecuente()`**, que hoy es un toggle sin destino.
- **Borrar `registrarAusencia()`** de la ficha: es un artefacto del mock. Las ausencias se marcan sobre una reserva concreta con `PATCH /reservas/{id}/ausente` desde la agenda; la ficha solo lee el contador.
- `alternarBloqueado` sí conecta: `POST`/`DELETE …/jugadores-bloqueados`. `ClienteResponse.bloqueado` ya trae el flag, así que no hace falta pedir la lista aparte. El `motivoBloqueo` llega en el detalle.
- El historial (`historialDeClienteId`) pasa a `GET …/clientes/{jugadorId}/reservas` → `Page<ReservaResponse>`, con todos los estados. `totalGastado` viene calculado: se borra la función homónima del mock.
- **Los clientes de mostrador no aparecen**: el padrón filtra `jugador IS NOT NULL`, así que las reservas manuales quedan fuera. Vale un renglón de copy aclarando que la tabla lista clientes con cuenta.
- El export CSV se sigue generando en el front con `Blob`. Pedir `size` grande, **tope 100**.
- `AUSENCIAS_ALTAS = 3` se conserva como umbral de presentación del front.

**`/panel/caja`.**
- `CajaAbiertaResponse` da `turno`, `saldoTeoricoEfectivo` y los totales por método, pero **no la lista de movimientos**. Esa lista solo está en `GET /caja/turnos/{turnoId}`, que es **OWNER/ADMIN**. Un empleado con `OPERAR_CAJA` puede operar la caja pero **no puede ver la tabla de movimientos**. Ver §5.
- `calcularSaldoTeorico` / `calcularTotalesPorMetodo` / `calcularDiferencia` se borran.
- `MovimientoManualRequest` no tiene `metodoPago` (siempre EFECTIVO) — coincide con `form-movimiento-caja.tsx`, que tampoco lo pide. ✅
- `estado-caja.ts` (store en memoria) se elimina entero; su rol lo toma el cache de Query.
- Mismo problema de rol en `/panel/caja/cerrado/[turnoId]`: el empleado cierra la caja (`CierreCajaResponse` llega en la respuesta del POST) pero no puede **releer** el ticket. Renderizarlo con la respuesta de la mutación, no con un GET.

**`/panel/reportes`.**
- 5 requests independientes en paralelo (`useQueries`), no uno.
- **La forma cambia de raíz**: hoy `Comparativo<FacturacionReporteResponse>`; en el back `FacturacionReporteResponse` contiene `Comparativo<BigDecimal> totalFacturado`. El `Comparativo` está por métrica.
- Renombres: `facturacionTotal` → `totalFacturado`, `desglosePorMetodo` → `desglosePorMetodoPago`, `serieFacturacion` → `serieTemporal`, `ocupacionGeneral` → `porcentajeOcupacionGeneral`, `totalAusencias` → `ausencias: AusenciasInfo`, `TopCliente.reservas` → `cantidadReservas`.
- **`PuntoSerie {fecha, monto}` → `PuntoFacturacionDiariaDto {diaIndice, fechaActual, montoActual, fechaAnterior, montoAnterior}`**: es un punto **pareado** que ya trae ambos períodos. Los gráficos de Recharts se simplifican bastante (una sola serie de datos con dos claves).
- `Franja "Mañana"` → `FranjaHoraria "MANANA"`.
- `AusenciasInfo` trae `disponible: boolean` y `motivoNoDisponible` → la UI necesita una rama para "métrica no disponible" que hoy no existe.
- `calcularVariacion(actual, anterior)` de `metrica-comparada.tsx` se conserva: aplica igual sobre cada `Comparativo`.

**Hecho** (verificado con las cinco requests reales contra el back). Lo que la corrida en vivo agregó al análisis de arriba:
- **`ausencias` NO es un `Comparativo`** — es un `AusenciasInfo` suelto. La KPI de ausencias pierde el "% vs. período anterior": no hay dato anterior que mostrar. `disponible` hoy llega siempre en `true` (el service lo construye fijo), pero la rama de "no disponible" quedó implementada porque el campo sigue en el contrato.
- **`clientesNuevos` y `topClientes` cuentan SOLO jugadores registrados**: las dos queries filtran `r.jugador IS NOT NULL` (`ReservaRepository`). Un complejo que carga todo a mano desde el mostrador ve `clientesNuevos: 0` y `topClientes: []` con la agenda llena. Está dicho en la pantalla, en las dos partes donde aparece.
- **`desglosePorMetodoPago` sólo trae los métodos con movimiento**, no los cinco con ceros.
- **`diaIndice` es 0-based**; el eje del gráfico muestra `diaIndice + 1`.
- **`HorarioPedidoDto.hora` es un `int` y agrupa por hora entera**: un turno de 21:30 cae en el bucket `21`. La etiqueta nombra la franja, no el minuto de inicio.
- Los porcentajes vienen en escala 0–100 con dos decimales. Redondear a entero convertía un 0,46% real en "0%" — dos turnos sobre 434 horas de atención dan exactamente eso. `formatearPorcentaje` en `src/lib/formato.ts` muestra un decimal por debajo de 10.
- Las cinco requests son independientes: si fallan todas va el error de pantalla completa; si falla una, el resto se muestra y ese bloque avisa solo. Antes un único fallo dejaba la pantalla en blanco.
- Se borró `src/mocks/reportes.ts` entero (tipos, `generarReporte` y el generador determinístico).

**`/panel/configuracion/empleados`.**
- **Los dos modelos de permisos son conjuntos distintos**, no un renombre. Ver §5.
- `EmpleadoRequest` **no tiene contraseña**: solo `nombre` + `pin` (`\d{4}`). Quitar el campo contraseña de `form-ficha-empleado.tsx` (hoy pide mínimo 6 caracteres).
- Cambiar PIN es un endpoint aparte (`PUT /{empleadoId}/pin`), no parte de la edición.
- `EmpleadoResponse.activo` (no `isActive`). `DELETE` desactiva, no borra — coincide con el comportamiento del mock. ✅

---

## 5. Inconsistencias front↔back y su corrección **en el front**

### 5.1 IDs: `string` en el front, `Long` en el back

Los mocks usan ids string heterogéneos: `res-N` (reservas de jugador), `${canchaId}-${fecha}-${inicioMin}` (turnos generados), `hist-${clienteId}-${i}`, `manual-…-${Date.now()}`, `emp-1`, y slugs como `arena-sport-club` para complejos.

**Corrección:** todo id pasa a `number`, salvo el identificador público del complejo, que pasa a ser el **`slug: string`** real del back.

| Entidad | Front hoy | Debe ser |
|---|---|---|
| Complejo (público) | `id: string` + `slug: string` | **`slug: string`** (el back no expone el id en la zona pública) |
| Establecimiento (panel) | — | `id: number` |
| Cancha (marketplace) | `id: string` | `id: number` |
| Cancha (panel) | `id: number` ✅ | `id: number` |
| Reserva / Turno | `id: string` | `id: number` |
| Cliente | `id: number` ✅ | `id: number` (`jugadorId`) |
| Empleado | `id: string` (`emp-1`) | `id: number` |
| Producto buffet | `id: number` ✅ | `id: number` |
| Turno de caja | `id: string` | `id: number` |
| Gasto | `id: number` ✅ | `id: number` |

Puntos de contacto: los params de ruta `[id]`, `[empleadoId]`, `[turnoId]` (`useParams` devuelve string → `Number(...)` con validación), los query params del checkout (`?cancha=`), `Pago.reservaId` y `Venta.reservaId` (hoy `string`, deben ser `number`).

> **Trampa:** `[slug]` en `/complejo/[slug]` se queda como string. Es el único caso donde el string es correcto.

### 5.2 Estados de reserva: 4 en el front, 6 en el back

El front tiene **tres** enums de estado distintos y ninguno cubre el del back:

```ts
EstadoReserva  = "confirmada" | "pendiente" | "cancelada" | "jugada"          // mocks/reservas-jugador.ts
EstadoTurno    = "ocupado" | "pendiente" | "cancelado" | "ausente"            // mocks/agenda.ts
Estado         = "disponible" | "ocupado" | "pendiente" | "cancelado" | "ausente"  // status-badge.tsx
```

**Mapeo completo contra `EstadoReserva` del back:**

| Back | Semántica | Badge | Jugador (`/mis-reservas`) | Panel (`/panel/agenda`) |
|---|---|---|---|---|
| `PENDIENTE_SENA` | Prereserva, expira en 10 min | `pendiente` | "Pendiente de pago" + countdown con `expiraEn` | "Pendiente de seña" |
| `CONFIRMADA` | Seña pagada | `ocupado` | "Confirmada" | "Ocupado" |
| `CANCELADA` | Cancelación explícita | `cancelado` | "Cancelada" | "Cancelado" |
| `CANCELADA_PRERESERVA` | **Expiró sin confirmar** | `cancelado` | **"Expirada"** ← copy distinto | "Expiró sin confirmar" |
| `FINALIZADA` | Turno jugado y cobrado | `ocupado` (atenuado) | "Jugada" | "Finalizado" |
| `AUSENTE` | No-show | `ausente` | **falta UI** | "Ausente" ✅ |

**Correcciones:**
1. Un único `type EstadoReserva` en `src/lib/api/tipos/reservas.ts` con los 6 valores en mayúsculas. Se borran los tres enums locales.
2. **`AUSENTE` no tiene UI del lado del jugador.** `/mis-reservas` no lo contempla: una reserva marcada como no-show hoy no se distingue de una jugada. Agregar la variante en `reserva-card.tsx` y en el filtro de tabs (`esProxima` devuelve `false` para `AUSENTE`, así que cae en "anteriores" — correcto, pero sin etiquetar).
3. **`CANCELADA_PRERESERVA` no existe en el front.** Necesita copy propio ("expiró sin confirmar") para no confundir un abandono con una cancelación del usuario.
4. El badge `disponible` no es un estado de reserva: es un slot libre de la grilla. Mantenerlo separado del union type de reserva.
5. `StatusBadge` recibe el estado del back y hace el mapeo internamente, en un único lugar (`status-badge.tsx`), en vez de repetirlo en cada consumidor.

### 5.3 Fechas: `fecha` + `hora` separados vs. `LocalDateTime`

El front separa `fecha: "2026-08-11"` y `hora: "20:00"` en todos lados. El back:

| Contexto | Tipo del back | Ejemplo |
|---|---|---|
| `ReservaRequest.fechaHoraInicio` / `Fin` | `LocalDateTime` | `"2026-08-11T20:00:00"` |
| `ReservaResponse.fechaHoraInicio` / `Fin` / `expiraEn` | `LocalDateTime` | ídem |
| Query `fecha`, `desde`, `hasta`, `fechaFin` | `LocalDate` | `"2026-08-11"` |
| Query `hora` (zona pública) | `LocalTime` | `"20:00:00"` |
| `HorarioAtencionDto.horaApertura` / `Cierre`, `TarifaDto.horaInicio` / `Fin` | `LocalTime` | `"09:00:00"` |
| `GastoRequest.fecha`, `DiaNoLaborableRequest.fecha` | `LocalDate` | `"2026-08-11"` |
| `BloqueoCanchaRequest.fechaInicio` / `Fin` | `LocalDateTime` | `"2026-08-11T14:00:00"` |
| `diaSemana` | `DayOfWeek` | `"MONDAY"` |

**Corrección: la conversión ocurre en un único lugar** — `src/lib/api/tipos/comunes.ts`, junto a los tipos:

```ts
export const aFechaHora = (fecha: string, hora: string): FechaHoraISO =>
  `${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`;

export const partirFechaHora = (fh: FechaHoraISO): { fecha: FechaISO; hora: string } =>
  ({ fecha: fh.slice(0, 10), hora: fh.slice(11, 16) });

export const aHoraBack = (hhmm: string): HoraISO => `${hhmm}:00`;
```

**Reglas duras:**
- **Nunca `Date.prototype.toISOString()`** para enviar al back: agrega la `Z` y convierte a UTC. El back parsea `LocalDateTime` sin zona y rechaza el offset.
- Los componentes de UI siguen trabajando con `fecha` + `hora` separados (`fechaLarga`, `etiquetaTurno`, `TimeChip` no se tocan). La conversión vive **solo en la capa `endpoints/`**.
- `DayOfWeek`: el front usa `DiaSemana = "lun" | "mar" | …`. Agregar `DIA_SEMANA_A_BACK` / `DIA_SEMANA_DESDE_BACK` en `src/mocks/tarifas.ts` → mover a `src/lib/api/tipos/comunes.ts`. `diaSemanaDeFecha()` se conserva.
- **En el checkout, no reconstruir la fecha-hora**: `SlotDisponibleResponse` ya trae `inicio` y `fin` en el formato exacto que pide `ReservaRequest`. Pasarlos tal cual.

### 5.4 Método de pago: el front no tiene selector donde el back lo exige

`MetodoPago` coincide **exactamente** entre front (`mocks/pagos.ts`) y back (`core/pago/MetodoPago.java`): `EFECTIVO`, `TRANSFERENCIA`, `MERCADO_PAGO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`. ✅ El union type y `METODOS_PAGO` se conservan tal cual.

Dónde lo pide el back:

| Endpoint | Campo | ¿El front lo tiene? |
|---|---|---|
| `PATCH /reservas/{id}/finalizar` | `FinalizarReservaRequest.metodoPago` **@NotNull** | ❌ **No.** `marcarPagado` en `/panel/agenda` no pide método |
| `POST /buffet/ventas` | `VentaRequest.metodoPago` **@NotNull** | ✅ Sí, `ticket-buffet.tsx` |
| `POST/PUT …/gastos` | `GastoRequest.metodoPago` **@NotNull** | ✅ Sí, `form-ficha-gasto.tsx` |
| `POST …/caja/movimientos` | — (siempre EFECTIVO) | ✅ Coincide: el form no lo pide |

**Corrección:** agregar un selector de método de pago al flujo de cobro de la agenda. Resuelto en `detalle-turno.tsx`; `form-registrar-cobro.tsx` se borró junto con el resto de `/panel/pagos` (exponía `generoComision`, que no existe en el back — §5.5).

### 5.5 Campos que el front muestra y el DTO real no trae

Auditoría campo por campo:

| Campo del front | Dónde | ¿Existe en el back? | Corrección en el front |
|---|---|---|---|
| `senia` / `montoSena` | Checkout, cards, agenda | ✅ `Cancha.montoSena`, `senaDesde`, `ReservaResponse.senaPagada` | Renombrar a los nombres del DTO |
| `horasLimiteCancelacion` | `/mis-reservas`, modal | ❌ `Establecimiento.horasCancelacionAntesPartido` existe en la entidad pero **no se expone en ningún DTO** | Quitar el número del copy. Texto genérico y manejar el 400 del back |
| `PoliticaCancelacion.horasLimite` | `/panel/configuracion` | ❌ `EstablecimientoRequest` no lo acepta | Deshabilitar la sección (§6) |
| Tarifa dinámica / `calcularPrecio` | `/panel/precios`, `form-turno-rapido` | ⚠️ `TarifaDto` existe dentro de `CanchaRequest`, pero **no hay endpoint de cálculo** | `precioTotal` sale de `ReservaResponse`. Quitar la calculadora |
| `Pago.generoComision`, `comision`, `COMISION_FIJA = 450` | `/panel/pagos`, checkout | ❌ **No existe nada de comisiones en el back** | Quitar. El TODO de `pagos.ts:122-126` queda respondido: **no existe** |
| `EstadoLiquidacion` | `/panel/pagos` | ❌ | Quitar |
| `ProductoBuffet.umbralAlerta` | `/panel/buffet/productos` | ❌ `ProductoBuffetResponse` no lo tiene | Constante del front (ej. 5) para el badge "stock bajo", documentado como heurística de UI |
| `Venta.metodoPago` | `/panel/buffet/vender` | ✅ **Sí existe** en `VentaRequest` y `VentaResponse` | El TODO de `buffet.ts:105-107` está **desactualizado**: borrarlo |
| `Turno.repiteSemanal` | `/panel/agenda` | ❌ `ReservaResponse` no lo trae | Quitar el badge |
| `Complejo.reglas` | `/complejo/[slug]`, `/reservar/ok` | ❌ No está en `ComplejoDetalleResponse` | Quitar el bloque |
| `Complejo.fotos` (etiquetas) | Galería | ✅ `List<String>` de **URLs reales** | Cambiar `FotoComplejo{id, etiqueta}` por `string[]` |
| `DatosComplejo.telefono`, `cuit`, `cuitVerificado` | `/panel/configuracion` | ❌ No existen en la entidad ni en el DTO | Quitar la sección |
| `PANEL_COMPLEJO.diasRestantesTrial`, `plan` | Header del panel | ⚠️ `PerfilResponse.planSuscripcion` ✅; `Usuario.fechaFinPrueba` existe en la entidad pero **no se expone** | Mostrar el plan; quitar el contador de días |
| `Cliente.telefono` / `email` / `ultimaReserva` / `totalGastado` | `/panel/clientes` | ✅ Ahora en `ClienteResponse` | Conecta directo |
| `Cliente.esFrecuente` | `/panel/clientes` | ❌ No existe el concepto en el back | **Borrado** (estrella incluida). Derivarlo de `reservasTotales >= N` sería inventar un umbral y presentarlo como un dato del dueño; la columna Reservas ya está a la vista y ordena |
| `Complejo.servicios` | `/panel/configuracion`, `/complejo/[slug]` | ✅ Ahora en `EstablecimientoRequest`/`Response` y en `ComplejoDetalleResponse` | Remapear al enum `Servicio` (7 valores) |
| `CuentaMercadoPago` | `/panel/configuracion` | ❌ Sin integración | Quitar la sección |

### 5.6 Deportes: 7 en el front, 6 en el back, y no son los mismos

```
Front (mocks/deportes.ts): futbol-5, futbol-7, futbol-11, padel, tenis, basquet, voley
Back  (Deporte.java):      FUTBOL, PADEL, TENIS, HOCKEY, BASQUET, VOLEY
```

El front subdivide fútbol por cantidad de jugadores; el back tiene un único `FUTBOL` y agrega `HOCKEY`.

**Corrección:** `Deporte` pasa a ser el union type del back. Los tres valores de fútbol colapsan en `FUTBOL` para filtrar y reservar; la variante (5/7/11) se muestra derivándola de **`CanchaResponse.capacidad`**, que ya existe. Agregar `HOCKEY` al catálogo de etiquetas y abreviaturas. `DEPORTES` deja de ser un mock y pasa a `src/lib/api/tipos/comunes.ts` como catálogo de presentación.

### 5.7 Permisos de empleado: dos conjuntos distintos

```
Front (mocks/empleados.ts): ver_agenda, cobrar_turnos, cancelar_turnos, ver_clientes,
                            vender_buffet, ver_stock_buffet, gestionar_caja
Back  (PermisoEmpleado):    CREAR_RESERVA_MANUAL, FINALIZAR_RESERVA, CANCELAR_RESERVA,
                            MARCAR_AUSENTE, REGISTRAR_VENTA_BUFFET,
                            FIJAR_COMENTARIO_DESTACADO, OPERAR_CAJA
```

Son **7 y 7 pero no se corresponden**: el front modela permisos de *pantalla*, el back permisos de *acción*.

| Front | Back | Nota |
|---|---|---|
| `ver_agenda` | — | **No tiene equivalente.** La agenda es visible para todo el que pueda operar |
| `cobrar_turnos` | `FINALIZAR_RESERVA` | |
| `cancelar_turnos` | `CANCELAR_RESERVA` | |
| — | `CREAR_RESERVA_MANUAL` | **Falta en el front** |
| — | `MARCAR_AUSENTE` | **Falta en el front** (hoy el botón se muestra sin gate de permiso) |
| — | `FIJAR_COMENTARIO_DESTACADO` | **Falta en el front** (no hay pantalla de feedback) |
| `ver_clientes` | — | Sin equivalente (y la pantalla está bloqueada) |
| `vender_buffet` | `REGISTRAR_VENTA_BUFFET` | |
| `ver_stock_buffet` | — | Sin equivalente |
| `gestionar_caja` | `OPERAR_CAJA` | |

**Corrección:** `type Permiso = PermisoEmpleado` (los 7 valores del back). Hay que reescribir:
- El mapa de navegación de `sidebar-panel.tsx:20-54` — los ítems que dependen de `ver_agenda`/`ver_clientes`/`ver_stock_buffet` necesitan otra regla (visibles para cualquier `EMPLOYEE` autenticado, o solo para `OWNER`).
- Los guards por página, que hoy repiten `usePermisos()` en cada `page.tsx`.
- `form-ficha-empleado.tsx`: los checkboxes pasan a los 7 permisos del back, con etiquetas nuevas para los 3 que faltaban.

> El gate del front es solo UX. El back valida con `@PreAuthorize` + chequeo de permiso dentro del service.

### 5.8 Otras inconsistencias de nombre

| Front | Back | Dónde |
|---|---|---|
| `preciosBase: PrecioPorDuracion[]` | `preciosPorDuracion: Map<Integer,BigDecimal>` | Cancha |
| `canchasFisicas: number[]` | `canchasFisicasIds: List<Long>` | Cancha |
| `canchasNecesarias` | `cantidadCanchasNecesarias` | `CanchaRequest`/`Response` (la **entidad** se llama `canchasNecesarias` — irrelevante para el front) |
| `Tarifa.dias: DiaSemana[]` | `TarifaDto.diaSemana: DayOfWeek` (uno) | Expandir 1→N |
| `Tarifa.horaDesde` / `horaHasta` | `horaInicio` / `horaFin` | |
| `Empleado.estado: "activo"\|"inactivo"` | `EmpleadoResponse.activo: Boolean` | |
| `MovimientoCaja.hora: "HH:mm"` | `MovimientoCajaResponse.fechaHora: LocalDateTime` | |
| `TurnoCaja.abiertoPor` / `cerradoPor` (nombres) | `usuarioAperturaId` + `usuarioAperturaNombre` (par id+nombre) | |
| `TurnoCaja.saldoReal` | `saldoRealContado` | |
| `OrigenMovimiento`: `APERTURA`, `COBRO_TURNO` | `OrigenMovimientoCaja`: `RESERVA`, `VENTA_BUFFET`, `GASTO`, `MANUAL` | **`APERTURA` no existe**; `COBRO_TURNO` → `RESERVA` |
| `DetalleVenta.productoBuffetId` | `DetalleVentaResponse.productoId` | |
| `EnviarOferta → {ok, cantidad}` | `POST /admin/mails/oferta` → **202 sin body** | No se puede mostrar "412 enviados" |

---

## 6. Pantallas bloqueadas

> Qué falta exactamente, sin proponer cambios al backend. La decisión de qué hacer con cada una es del dueño del producto.

### ⛔ B1 — Pago de la reserva por el jugador (`/reservar/[id]`) · **el bloqueo más grave**

El jugador puede **crear** la reserva (`POST /api/v1/reservas` → `PENDIENTE_SENA`, `expiraEn = +10 min`) pero **no puede confirmarla ni pagarla**:

- `PUT /api/v1/reservas/{id}/confirmar` es **`@PreAuthorize("hasAnyRole('OWNER','ADMIN')")`** (`ReservaController.java:100`). Un PLAYER recibe 403.
- **No existe ninguna integración de pagos.** `grep -rli "mercadopago|preference"` sobre `src/main` solo encuentra el enum `MetodoPago` y un DTO de reportes. No hay creación de preferencias, ni webhook de pago, ni Split.

**Consecuencia:** una reserva creada por un jugador queda en `PENDIENTE_SENA` y a los 10 minutos un job la pasa a `CANCELADA_PRERESERVA`, salvo que el dueño la confirme a mano desde el panel.

**Falta:** un endpoint que permita al PLAYER confirmar/pagar su propia prereserva, y/o la integración de cobro que dispare esa confirmación.

**Alcance:** `/reservar/[id]` (todo el estado `EstadoPago` y las ramas `mockPago=rechazado|pendiente`), `/reservar/[id]/ok`, y el bloque de "seña" del checkout.

### ✅ B2 — `/panel/clientes` y `/panel/clientes/[id]` — **RESUELTO**

`ClienteController` fue implementado. Los tres endpoints están en §2.3 y el plan de pantalla en §4.5. Queda un único recorte, y no es de backend: **`esFrecuente` no existe como concepto** — se deriva en el front desde `reservasTotales`.

### ⛔ B3 — `/panel/pagos` (parcialmente)

**No existe `PagoController`**, ni el concepto de comisión, liquidación o Split.

Sin cobertura: `Pago.generoComision`, `comision` (`COMISION_FIJA = 450`), `EstadoLiquidacion` (`acreditado`/`en_camino`/`pendiente`), `fechaAcreditacion`.

✅ **La tabla de ventas de buffet ya no está bloqueada**: `GET /api/v1/buffet/ventas` devuelve `Page<VentaResumenResponse>` con rango de fechas y filtro por estado.

**Sustitutos parciales para la parte de pagos:** `GET …/reportes/facturacion` (totales y desglose por método, con comparativo) y `GET /reservas/establecimiento/{id}?fecha` filtrando `FINALIZADA` (cada `ReservaResponse` trae `metodoPago` y `precioTotal`), día por día.

**Falta:** listado de pagos por reserva con estado de liquidación y el flag `generoComision`/`pasoPorSplit`.

> Esto responde el TODO abierto en `mocks/pagos.ts:122-126`: el flag **no existe** en el back.
> Fuera de alcance por decisión del dueño del producto: pagos y comisiones se abordan más adelante.
> **Resuelto en el front:** `mocks/pagos.ts` se borró entero. La pantalla se llama **Cobros** y muestra sólo lo que existe — facturación de turnos, ventas de buffet y su ranking. `METODOS_PAGO` sobrevivió como catálogo de presentación en `src/lib/metodos-pago.ts`.

### ⛔ B4 — `/panel/configuracion` (parcialmente)

`PUT /api/v1/establecimientos/{id}` acepta `nombre`, `direccion`, `latitud`, `longitud`, `requiereSena`, `horariosAtencion` y **`servicios`**.

| Sección de la pantalla | Estado |
|---|---|
| Datos del complejo | ⚠️ Parcial: `nombre` y `direccion` ✅. **`telefono`, `cuit`, `cuitVerificado`, `deportes` no existen** ni en la entidad ni en el DTO |
| Horarios de atención | ✅ Conecta bien (`HorarioAtencionDto`) |
| **Servicios** | ✅ **Resuelto.** `EstablecimientoRequest`/`Response` lo aceptan y devuelven. Ojo con la semántica de `null` vs `[]` (§2.3) |
| Fotos | ⛔ La entidad **tiene** `fotos: List<String>` y la zona pública las expone, pero `EstablecimientoRequest` **no las acepta**. No hay endpoint de subida |
| Política de cancelación | ⛔ `horasCancelacionAntesPartido` y `minutosGraciaCancelacion` están en la entidad con defaults 24 h / 30 min, **no se exponen ni para leer ni para escribir** |
| MercadoPago | ⛔ Sin integración |
| Dispositivos de caja | ✅ Conecta completo (`…/caja/dispositivos` + `/activar-local` + `/emparejar`) |

**Falta:** que `EstablecimientoRequest`/`Response` incluyan fotos y la política de cancelación; un endpoint de subida de imágenes; y los campos de contacto/fiscales.

> Fuera de alcance por decisión del dueño del producto: fotos se aborda más adelante.

**Hecho** — datos, horarios, servicios y dispositivos conectados; fotos, política y MercadoPago quedan como secciones que explican qué falta en vez de simular un formulario. Lo que salió de la verificación en vivo:

- **`horariosAtencion` NO tiene semántica de "no modificar": un PUT que lo omita BORRA los horarios.** El service hace `getHorariosAtencion().clear()` y recarga lo que venga en el request. `servicios`, en cambio, sí distingue (`null` = no tocar, `[]` = borrar todos). Verificado: un PUT sin ninguno de los dos campos dejó los horarios en 0 y los servicios intactos. Por eso **cada sección manda el establecimiento completo** con su parte cambiada — un formulario por sección que mande sólo lo suyo se lleva puesta la disponibilidad del complejo.
- **`requiereSena` se fuerza a `true` en TRIAL y FREE**: `esPlanLimitado(plan) || request.requiereSena()`. Verificado mandando `false` con plan TRIAL: vuelve `true`. El checkbox se deshabilita y lo explica, en vez de dejar que alguien lo destilde, guarde, y lo vea encenderse solo.
- **`latitud`/`longitud` son `@NotNull`**: el PUT no pasa sin ellas, así que la sección de datos tuvo que ganar un selector de ubicación. Reutiliza el `SelectorUbicacion` de `/buscar` (georef-ar-api + "usar mi ubicación"). La dirección es texto libre y el backend no la geocodifica.
- **Se fueron `telefono`, `cuit` y `deportes`** del formulario: los dos primeros no existen en ningún lado, y los deportes son de la cancha (`CanchaRequest.deportes`), no del establecimiento — el marketplace los deriva de las canchas activas.
- Validaciones confirmadas: día duplicado → 400 `"No puede haber más de un horario de atención para el MONDAY"`; apertura == cierre → 400; nombre vacío → 400 en **forma B** (`{"nombre":"El nombre es obligatorio"}`); servicio fuera del enum → 400 `"Cuerpo de la petición inválido o mal formado"`.
- El catálogo de los 7 `Servicio` se movió a `src/lib/servicios.ts`: lo usan las dos puntas (el dueño los tilda, el jugador los ve en la ficha) y definirlo dos veces era arriesgar que el chip no fuera el mismo.

### 🔀 B5 — `/panel/configuracion/ofertas` — **no es un gap del back, la pantalla está mal ubicada**

`POST /api/v1/admin/mails/oferta` funciona correctamente. El problema es de qué producto es esta pantalla.

`OfertaMarketingService` exige `Role.ADMIN` y `OfertaMarketingBatchSender` pagina sobre **`usuarioRepository.findByAceptaMarketingTrue(pageable)`**: envía a **todos los usuarios de la plataforma** con opt-in de marketing, sin filtrar por establecimiento. Es un broadcast del administrador de Saque, **no una herramienta del dueño de un complejo**.

Hoy la pantalla vive en el panel del complejo, gateada por `esDueno` → un OWNER recibe 403, y el copy le sugiere que le escribe a *sus* clientes.

**Corrección en el front:**
1. Mover la pantalla a `/admin/ofertas`, gateada por `perfil.rol === "ADMIN"`.
2. Sacar el ítem "Enviar ofertas" del sidebar del panel (`sidebar-panel.tsx`).
3. Reescribir el copy: el alcance es toda la base de usuarios con opt-in.
4. El form manda `cuerpo`; el DTO pide **`cuerpoHtml`**.
5. El endpoint devuelve **202 sin body** (el envío es `@Async`). El front espera `{ok, cantidad}` para mostrar "412 destinatarios" — ese número **no está disponible**, solo queda en un `log.info` del sender. Cambiar a un mensaje tipo "Envío en curso".

> **Depende de la Fase 2**: el gate de ADMIN necesita `/me` y la resolución de rol real. No ejecutar antes.

### ⚠️ B6 — Bloqueos parciales, no de pantalla completa

| Caso | Detalle |
|---|---|
| **Editar perfil** (`/perfil`) | `/usuarios/me` es **GET**. No hay `PUT` para `nombre`/`telefono`, ni endpoint de baja de cuenta. Hoy "eliminar cuenta" solo borra localStorage |
| **Movimientos de caja para el empleado** (`/panel/caja`) | `CajaAbiertaResponse` no incluye `movimientos`. La lista está solo en `GET …/caja/turnos/{turnoId}`, que es **OWNER/ADMIN**. Un empleado con `OPERAR_CAJA` opera la caja pero no ve la tabla |
| **Ticket de cierre** (`/panel/caja/cerrado/[turnoId]`) | Mismo problema: el empleado cierra pero no puede releer el ticket. Mitigación: renderizarlo con el `CierreCajaResponse` de la mutación, sin GET |
| **Establecimiento por id** | No hay `GET /api/v1/establecimientos/{id}`. El owner obtiene el suyo con `GET /api/v1/establecimientos` (lista) |
| **Reserva por id** | No hay `GET /api/v1/reservas/{id}`. Impacta a `/reservar/[id]/ok`, que debe usar la respuesta del POST |
| **Nombre del complejo en `/mis-reservas`** | `ReservaResponse` trae `canchaNombre` pero **no** el establecimiento ni su dirección. Las cards de reserva pierden el "dónde" y el link a Google Maps |
| **Cookie de caja en desarrollo** | `saque_caja_device` es `SameSite=None; Secure` → **exige HTTPS**. En `http://localhost` el browser puede rechazarla y toda la zona `/caja` queda inutilizable en dev |

### ✅ B7 — El empleado no podía LEER casi nada aunque tuviera el permiso de la ACCIÓN — **RESUELTO**

Es el bloqueo más grande que queda después de B1, y no se ve leyendo los permisos: se ve leyendo los `@PreAuthorize` de los **listados**.

`PermisoEmpleado` habilita acciones. Pero para ejercer casi cualquiera de ellas hay que leer algo antes, y ese algo es OWNER/ADMIN. Probado con un empleado real con **los siete permisos** tildados:

| Request | EMPLOYEE |
|---|---|
| `GET /reservas/establecimiento/{id}?fecha` — la agenda | **403** |
| `GET …/productos-buffet` — catálogo para vender | **403** |
| `GET …/canchas` | **403** |
| `GET …/clientes` | **403** |
| `GET …/caja/turnos` — historial | **403** |
| `GET …/reportes/*` | **403** |
| `GET …/disponibilidad?fecha` | 200 |
| `GET …/bloqueos?fecha` | 200 |
| `GET …/feedback` | 200 |
| `GET …/caja/abierta` · `POST /abrir` · `/movimientos` · `/cerrar` | ✅ |

**Consecuencia:** de los 7 permisos, sólo `OPERAR_CAJA` es ejercible desde el panel.

- `FINALIZAR_RESERVA`, `CANCELAR_RESERVA`, `MARCAR_AUSENTE` necesitan el id de una reserva, y el único listado que lo da es 403.
- `REGISTRAR_VENTA_BUFFET` puede hacer el POST de la venta, pero no puede listar los productos para armarla.
- `CREAR_RESERVA_MANUAL` es el único borde: `/disponibilidad` (200) trae `canchaId` y `canchaNombre`, así que **se podría** armar un alta de turno sin tocar `/canchas`. Hoy `/panel/agenda` no está construida así.
- `FIJAR_COMENTARIO_DESTACADO` sí es alcanzable (`/feedback` responde 200) pero no hay pantalla de feedback en el panel.

**Resuelto en el backend** (autorizado por el dueño del producto). No hubo que escribir lógica nueva: `AutorizacionEmpleadoService` ya sabía resolver "dueño, admin o empleado con este permiso" (`validarAccion`) — los listados simplemente llamaban al otro método, `validarPropietarioOAdmin`. El cambio fue:

| Listado | Ahora lo lee | Dónde |
|---|---|---|
| Agenda del día | dueño, admin, o empleado con alguno de los 4 permisos de reserva | `ReservaController` + `ReservaService` |
| Canchas | el **mismo** conjunto que la agenda | `CanchaController` + `CanchaService` |
| Productos de buffet | dueño, admin, o empleado con `REGISTRAR_VENTA_BUFFET` | `ProductoBuffetController` + `ProductoBuffetService` |

Dos decisiones que vale la pena registrar:

- **Se agregó `validarLectura(establecimiento, email, Set<PermisoEmpleado>)`**, porque `validarAccion` pide UN permiso y una pantalla no le pertenece a una sola acción: quien cobra, quien cancela y quien marca ausencias necesitan la misma agenda. La lectura se habilita si el empleado puede hacer al menos una de las cosas que se hacen desde ahí.
- **Las canchas van en el mismo conjunto que la agenda, no sólo en `CREAR_RESERVA_MANUAL`.** La agenda se dibuja POR cancha: sin ese listado no renderiza, aunque la persona sólo vaya a cobrar. Atarlo al permiso "correcto" habría dejado la agenda rota para tres de los cuatro permisos.

**Lo que sigue cerrado, a propósito:** clientes, empleados, historial de caja, reportes y todas las MUTACIONES de canchas y productos. Un empleado con los 7 permisos sigue recibiendo 403 ahí — está cubierto por un test.

`FIJAR_COMENTARIO_DESTACADO` sigue sin pantalla en el panel: es lo único de los 7 que no se puede ejercer, y es un gap del front, no del back.

Cobertura nueva: `LecturaOperativaEmpleadoTest` (9 casos — con permiso ve, sin permiso no, empleado de otro local no, y las lecturas que siguen siendo del dueño). Suite completa del back: 546 verdes.

---

## 7. Orden de ejecución en fases

### Fase 0 — Preparación (no toca pantallas)
1. `npm i @tanstack/react-query` (v5).
2. Crear `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:8080`.
3. Verificar que el back levanta y que CORS acepta `http://localhost:3000` (ya está en el default de `app.cors.allowed-origins`).
4. Levantar el back con `SPRING_PROFILES_ACTIVE=dev` para tener **Swagger en `/swagger-ui.html`** (apagado en el resto de los profiles) y contrastar los tipos mientras se escriben.

**Verificación:** `curl "http://localhost:8080/api/v1/publico/complejos?size=1"` devuelve un `Page` sin token.

### Fase 1 — Infraestructura
5. `src/lib/api/`: `config.ts`, `errores.ts` (**las 3 formas**), `cliente.ts`, `keys.ts`.
6. `src/lib/api/tipos/comunes.ts`: `Page<T>`, `Comparativo<T>`, `RangoFechas`, todos los enums, los helpers de fecha de §5.3.
7. `src/app/providers.tsx` + envolver `{children}` en `src/app/layout.tsx:31-33`.
8. Auth: `sesion.ts`, `endpoints/auth.ts`, `use-perfil.ts`, `useEstablecimientoActivo()`.
9. Reescribir `rol-panel.ts` y `permisos.ts` sobre `PerfilResponse` (elimina el default `"dueno"`).

**Verificación:** login manual desde la consola, `/me` responde, el rol se refleja en el sidebar. **Ninguna pantalla cambió todavía.**

### Fase 2 — Auth de verdad
10. `/ingresar` → login email+password (§4.3, es un rediseño).
11. `/verificar` + `/completar-perfil` → los 3 pasos del registro real.
12. `/recuperar-password`, `/restablecer`, `/baja-mails`, `/verificar-email` → match casi 1:1.
13. Logout real (`POST /auth/logout` + `queryClient.clear()`).

**Verificación:** registrarse de cero, cerrar sesión, volver a entrar, recuperar contraseña.

### Fase 3 — Ciclo crítico del jugador
14. `/buscar` → `GET /publico/complejos` (mapeo de zona→lat/lng y franja→hora).
15. `/complejo/[slug]` → detalle + disponibilidad real. **Se borra `src/lib/disponibilidad.ts`.**
16. `/reservar/[id]` → `POST /reservas` con `Idempotency-Key`; countdown sobre `expiraEn`; **marcar el bloqueo B1 en la UI**.
17. `/mis-reservas` → listado + cancelar.
18. `/perfil` → `/me` + logout; deshabilitar edición (B6).

**Verificación end-to-end:** buscar un complejo → abrir el detalle → elegir un slot libre → crear la reserva → verla en `/mis-reservas` en `PENDIENTE_SENA` con el countdown → cancelarla. Este es el recorrido que valida toda la fase.

### Fase 4 — Panel: núcleo operativo
19. `/panel/canchas` (CRUD + bloqueos) — es la base de datos del resto del panel.
20. `/panel/agenda` — la más compleja. **Agregar el selector de método de pago** (§5.4).
21. `/panel/precios` — tarifas vía `PUT` completo de cancha.
22. `/panel/gastos` — match 1:1, la más simple del panel. Buen sanity check.

**Verificación:** crear una cancha, verla en la agenda, cargar un turno manual, finalizarlo con método de pago, registrar un gasto.

### Fase 5 — Panel: buffet y caja
23. `/panel/buffet/productos` + `/panel/buffet/vender`.
24. `/panel/caja`, `/cerrar`, `/cerrado/[turnoId]`, `/historial`, `/historial/[turnoId]`. **Se borra `src/lib/estado-caja.ts`.**
25. **Antes de empezar:** validar el problema de la cookie `Secure` en dev (B6). Si bloquea, `/caja/*` se pospone.
26. Kiosco: `/caja/emparejar/[token]`, `/caja`, `/caja/pin/[empleadoId]`. **Se borra la validación de PIN del cliente.**

**Verificación:** abrir caja, registrar una venta de buffet, ver el movimiento reflejado, cerrar caja y ver el ticket.

### Fase 6 — Panel: administración
27. ~~`/panel/clientes` + `/panel/clientes/[id]` — `ClienteController`. Borrar `esFrecuente` y `registrarAusencia` (§4.5).~~ ✅

**Hecho** (verificado en vivo: padrón, ficha, historial, bloqueo y desbloqueo). Lo que agregó la corrida real:
- **El padrón son jugadores REGISTRADOS**, no la libreta de contactos del complejo: `jugadorIdsDelEstablecimiento` filtra `r.jugador IS NOT NULL`. Un complejo que carga todo a mano desde la agenda ve la pantalla vacía para siempre. El vacío lo explica en vez de decir "todavía no tenés clientes" a secas.
- **Buscar, ordenar y paginar son del SERVER.** Filtrar en el cliente sólo miraría la página actual: "no encontrado" podría significar "está en la página 3". La búsqueda va con debounce de 400 ms y matchea nombre, teléfono **o email**.
- **El `sort` sólo acepta cuatro campos** (`nombre`, `ultimaReserva`, `reservasTotales`, `ausencias`); cualquier otro es un **400** (`{"error":"Propiedad de orden no soportada: totalGastado"}`, verificado). Por eso "Total gastado" se muestra pero no es una columna ordenable.
- **`telefono` puede ser null** — sale del `Usuario` y el registro no lo exige. La tabla cae al email, que sí es obligatorio; la ficha dice "Sin teléfono cargado".
- **`ultimaReserva` es null** hasta que haya una reserva FINALIZADA. Las tres métricas cuentan sólo `FINALIZADA` (y sólo `AUSENTE` las ausencias), pero el **historial trae todos los estados, canceladas incluidas**: los números no coinciden con el largo de la lista, y la pantalla lo aclara.
- **Bloquear exige que el target sea PLAYER**: un OWNER que reservó en su propio complejo aparece en el padrón pero bloquearlo da **400** (`"El usuario indicado no corresponde a un jugador (rol PLAYER)"`). El mensaje del back se muestra tal cual.
- Bloquear funciona de verdad: el jugador bloqueado recibe **403** al intentar reservar. Desbloquear sobre alguien no bloqueado es **404**.
- Se borraron los dos botones que no se guardaban en ningún lado: "Marcar como frecuente" (`esFrecuente` no existe en el back) y "Registrar ausencia" (las ausencias se marcan sobre UNA reserva desde la agenda, no a mano sobre el cliente).
- El gate pasó de `ver_clientes` al **rol**: el `ClienteController` entero es OWNER/ADMIN y no hay ningún `PermisoEmpleado` que lo habilite. El ítem del sidebar también.
28. ~~`/panel/reportes` — 5 queries en paralelo y reestructuración del `Comparativo` (§4.5).~~ ✅
29. ~~`/panel/configuracion` — datos básicos + horarios + **servicios** + dispositivos; fotos, política y MercadoPago deshabilitados (B4).~~ ✅
30. ~~`/panel/configuracion/empleados` — **remapeo completo de permisos** (§5.7) y actualización del sidebar.~~ ✅ Ver **B7**: el remapeo dejó a la vista que un empleado sólo puede leer la caja.
31. ~~`/panel/pagos` — solo la tabla de ventas de buffet (`GET /buffet/ventas`); el bloque de pagos/comisiones queda deshabilitado (B3).~~ ✅ La pantalla pasó a llamarse **Cobros** en el sidebar: sin comisiones ni liquidaciones, lo que muestra son las dos fuentes de ingreso reales.
32. **Mover Ofertas a `/admin/ofertas`** con gate de ADMIN y sacarla del sidebar del panel (B5).

### Fase 7 — Limpieza
33. Borrar los mocks sin consumidores. Los que sobrevivan quedan solo como catálogos de presentación (`deportes`, `zonas`, `franjas`, `servicios`).
34. Barrer las 62 marcas `// TODO backend:` — cerrar las resueltas, reescribir las que ahora apuntan a un bloqueo de §6.
35. Documentar los flags `?mockError` / `?mockVacio` que se conservaron.

---

## 8. Checklist final de pantallas

### Marketplace público
- [ ] `/` — `GET /publico/complejos` (sin lat/lng, orden por rating)
- [ ] `/buscar` — `GET /publico/complejos` · ⚠️ mapear zona→lat/lng y franja→hora · quitar chips de horarios de la card
- [ ] `/complejo/[slug]` — `GET /publico/complejos/{slug}` + `/{slug}/disponibilidad` · ⚠️ quitar `reglas` · fotos pasan a URLs

### Ciclo del jugador
- [ ] `/reservar/[id]` — `POST /reservas` · ⛔ **B1: no se puede confirmar ni pagar**
- [ ] `/reservar/[id]/ok` — usa la respuesta del POST (no hay `GET /reservas/{id}`)
- [ ] `/mis-reservas` — `GET /reservas/mis-reservas` + `PUT /{id}/cancelar` · ⚠️ sin nombre de complejo · agregar UI de `AUSENTE`
- [ ] `/perfil` — `GET /usuarios/me` + `POST /auth/logout` · ⛔ edición y baja sin endpoint

### Auth
- [ ] `/ingresar` — `POST /auth/login` · ⚠️ **rediseño a email+password**
- [ ] `/verificar` — `POST /auth/registro/verificar-codigo` (pasa a ser paso de registro)
- [ ] `/completar-perfil` — `POST /auth/registro/completar` · ⚠️ agregar campo password
- [ ] `/verificar-email` — 3 endpoints de `/auth/registro/*` · ya alineado
- [ ] `/recuperar-password` — `POST /auth/password/recuperar`
- [ ] `/restablecer` — `POST /auth/password/reset`
- [ ] `/baja-mails` — `POST /api/v1/mails/baja`

### Kiosco de caja
- [x] `/caja/emparejar?codigo=` — `POST /api/v1/caja/emparejar` · la ruta pasó de path param a QUERY param (el back arma el link así) · la cookie `Secure` SÍ se acepta en `http://localhost`, verificado
- [x] `/caja` — `GET …/empleados/activos` (con cookie) · el estado "emparejado" se infiere del 200/403, no de localStorage
- [x] `/caja/pin/[empleadoId]` — `POST /auth/empleados/login` · **el PIN se valida en el server**; el rate limit simulado se borró
- [x] `/panel/configuracion` → sección Dispositivos — `POST /emparejar`, `POST /activar-local`, `GET`, `DELETE` · el resto de esa pantalla sigue en Fase 6

### Panel — gestión
- [ ] `/panel/agenda` — 8 endpoints · ⚠️ **agregar selector de método de pago** · 7 requests en vista semanal
- [ ] `/panel/canchas` — CRUD de canchas + bloqueos · ⚠️ renombres de campos
- [ ] `/panel/precios` — `PUT …/canchas/{id}` · ⚠️ 1 tarifa del front = N `TarifaDto`
- [x] `/panel/clientes` — `GET …/clientes?buscar&soloBloqueados` server-side · `sort` solo 4 campos (el resto es 400) · sin `esFrecuente`
- [x] `/panel/clientes/[id]` — ficha + historial paginado + bloquear/desbloquear · sin `registrarAusencia`

### Panel — buffet
- [ ] `/panel/buffet/productos` — CRUD + `PATCH /stock` · ⚠️ `umbralAlerta` es del front
- [ ] `/panel/buffet/vender` — `POST /buffet/ventas` · ✅ match completo

### Panel — caja
- [ ] `/panel/caja` — `GET /caja/abierta` + abrir + movimientos · ⚠️ **sin lista de movimientos para el empleado**
- [ ] `/panel/caja/cerrar` — `POST /caja/{turnoId}/cerrar`
- [ ] `/panel/caja/cerrado/[turnoId]` — renderizar con la respuesta de la mutación
- [ ] `/panel/caja/historial` — `GET /caja/turnos`
- [ ] `/panel/caja/historial/[turnoId]` — `GET /caja/turnos/{turnoId}`

### Panel — administración
- [x] `/panel/pagos` ("Cobros") — `GET /reportes/facturacion` + `GET /buffet/ventas` + `/metricas` · cancelar venta devuelve stock · ⛔ **B3**: sin comisiones ni liquidación
- [ ] `/panel/gastos` — CRUD completo · ✅ match 1:1
- [x] `/panel/reportes` — 5 endpoints en paralelo · `Comparativo` por métrica · ausencias sin comparativo · clientes sólo registrados
- [x] `/panel/configuracion` — datos + horarios + **servicios** + dispositivos · ⚠️ el PUT va SIEMPRE con los horarios (omitirlos los borra) · `requiereSena` forzada en TRIAL/FREE · ⛔ **B4**: fotos, política y MercadoPago
- [x] `/panel/configuracion/empleados` — CRUD + cambiar PIN + baja · permisos = los 7 del back · ⛔ **B7**: sólo `OPERAR_CAJA` es ejercible
- [ ] `/panel/configuracion/ofertas` — 🔀 **B5: mover a `/admin/ofertas` con gate ADMIN** (post Fase 2)

### Fuera de alcance
- [ ] `/estilo` — guía de estilo interna, no se conecta

---

## Anexo — Referencias de código

**Backend** (`sacaladelangulo`, branch `test`, commit `915df29`)

| Tema | Archivo |
|---|---|
| Seguridad, CORS, rutas públicas | `core/config/security/SecurityConfig.java` |
| Formas de error | `core/exception/GlobalExceptionHandler.java` |
| Claims del JWT | `auth/service/JwtService.java` |
| Zona pública | `publico/controller/ComplejoPublicoController.java`, `publico/service/ComplejoPublicoService.java` |
| Perfil | `auth/controller/UsuarioController.java`, `auth/dto/PerfilResponse.java` |
| Reglas de reserva | `reserva/service/ReservaService.java` |
| Estados | `reserva/model/EstadoReserva.java` |
| Idempotencia | `core/idempotencia/IdempotencyFilter.java` |
| Rate limiting | `core/ratelimit/RateLimitFilter.java`, `auth/service/AuthService.java` |
| Cookie de caja | `caja/service/DispositivoCajaGate.java` |

**Frontend** (`saque-front`)

| Tema | Archivo |
|---|---|
| Patrón `clave`/`resuelto` | cualquier `src/app/panel/*/page.tsx` |
| Sesión del jugador | `src/lib/usuario.ts` |
| Rol por defecto `"dueno"` | `src/lib/rol-panel.ts:29` |
| Permisos client-side | `src/lib/permisos.ts` |
| Mapa de navegación | `src/components/panel/sidebar-panel.tsx:20-54` |
| Matemática de disponibilidad | `src/lib/disponibilidad.ts` |
| Pricing client-side | `src/mocks/tarifas.ts` (`calcularPrecio`) |
| Hold de 10 min | `src/lib/reserva-intencion.ts` |
| Validación de PIN en el cliente | `src/app/caja/pin/[empleadoId]/page.tsx:69-80` |
| Único "cliente HTTP" | `src/lib/mock-api.ts` |
