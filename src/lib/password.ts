/**
 * Política de contraseña compartida entre el alta de cuenta
 * (<CompletarRegistro>, usada por /ingresar y /verificar) y
 * /restablecer, para que todos los formularios validen y muestren el
 * mismo mensaje de error. No reemplaza el min-length-6 de la
 * contraseña inicial de empleados (form-ficha-empleado.tsx) — ese es
 * un flujo interno distinto con su propia regla, más simple.
 */
/**
 * Espeja la regla real del backend, que valida con
 * `@Size(min = 8)` + `@Pattern("^(?=.*[A-Za-z])(?=.*\\d).+$")`
 * en RegisterRequest, CompletarRegistroRequest y ResetPasswordRequest.
 * Exige letra Y número: validar solo el número dejaba pasar contraseñas
 * que el back rechazaba con un 400 de bean validation.
 */
export const POLITICA_PASSWORD_DESCRIPCION =
  "Mínimo 8 caracteres, con al menos una letra y un número";

export function esPasswordValida(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function passwordsCoinciden(a: string, b: string): boolean {
  return a === b;
}
