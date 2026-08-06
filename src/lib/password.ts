/**
 * Política de contraseña compartida entre /verificar-email y
 * /restablecer, para que ambos formularios validen y muestren el
 * mismo mensaje de error. No reemplaza el min-length-6 de la
 * contraseña inicial de empleados (form-ficha-empleado.tsx) — ese es
 * un flujo interno distinto con su propia regla, más simple.
 */
export const POLITICA_PASSWORD_DESCRIPCION = "Mínimo 8 caracteres y al menos un número";

export function esPasswordValida(password: string): boolean {
  return password.length >= 8 && /\d/.test(password);
}

export function passwordsCoinciden(a: string, b: string): boolean {
  return a === b;
}
