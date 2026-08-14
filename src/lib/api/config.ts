/**
 * El browser le pega directo al Spring Boot: no hay proxy en Next.
 * El back ya permite http://localhost:3000 en app.cors.allowed-origins.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

/**
 * Headers que el CORS del backend acepta (SecurityConfig, allowlist CERRADA):
 * Authorization, Content-Type, Cache-Control, Idempotency-Key.
 * Cualquier header custom que agreguemos hace fallar el preflight.
 */
export const HEADERS_PERMITIDOS = [
  "Authorization",
  "Content-Type",
  "Cache-Control",
  "Idempotency-Key",
] as const;
