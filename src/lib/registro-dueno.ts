import type { RegisterRequest } from "./api/tipos/auth";
import { esPasswordValida, POLITICA_PASSWORD_DESCRIPCION } from "./password";

/**
 * Alta de dueño (POST /auth/register/owner). Espeja RegisterRequest del back:
 * nombre @NotBlank, email @Email + @NotBlank y contraseña @Size(min = 8) +
 * letra y número (ver password.ts, que es la misma regla).
 */
export type ErroresRegistroDueno = {
  nombre?: string;
  email?: string;
  password?: string;
};

export type DatosRegistroDueno = {
  nombre: string;
  email: string;
  password: string;
};

// Chequeo grueso (algo@algo): el formato fino lo valida el back y el input type=email.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+$/;

export function validarRegistroDueno({
  nombre,
  email,
  password,
}: DatosRegistroDueno): ErroresRegistroDueno {
  const errores: ErroresRegistroDueno = {};
  if (nombre.trim() === "") errores.nombre = "Ingresá tu nombre.";
  const emailLimpio = email.trim();
  if (emailLimpio === "") errores.email = "Ingresá tu email.";
  else if (!FORMATO_EMAIL.test(emailLimpio)) errores.email = "Ingresá un email válido.";
  if (!esPasswordValida(password)) errores.password = `${POLITICA_PASSWORD_DESCRIPCION}.`;
  return errores;
}

/** Body del alta. El back también normaliza el email (trim + minúsculas). */
export function armarBodyRegistroDueno({
  nombre,
  email,
  password,
}: DatosRegistroDueno): RegisterRequest {
  return { nombre: nombre.trim(), email: email.trim().toLowerCase(), password };
}
