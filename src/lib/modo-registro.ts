/** Modo de /ingresar: alta de jugador (por defecto) o de dueño (?tipo=dueno). */
export type ModoRegistro = "jugador" | "dueno";

export function modoDesdeParam(tipo: string | null | undefined): ModoRegistro {
  return tipo === "dueno" ? "dueno" : "jugador";
}

export type TextosModo = {
  tituloEmail: string;
  parrafoCodigo: string;
  /** null = el paso email no lleva pie. */
  pieEmail: string | null;
  /** null = sin aviso arriba de la contraseña. */
  avisoCuentaExistente: string | null;
};

export function textosModo(modo: ModoRegistro, largoCodigo: number): TextosModo {
  if (modo === "dueno") {
    return {
      tituloEmail: "Creá tu cuenta de dueño",
      parrafoCodigo: `Te mandamos un código de ${largoCodigo} dígitos para crear tu cuenta de dueño.`,
      pieEmail: null,
      avisoCuentaExistente: "Ya tenés una cuenta con este email. Ingresá con tu contraseña.",
    };
  }
  return {
    tituloEmail: "Ingresá o creá tu cuenta",
    parrafoCodigo: `Te mandamos un código de ${largoCodigo} dígitos para crear tu cuenta.`,
    pieEmail: "Si ya tenés cuenta, entrás igual con este mismo email.",
    avisoCuentaExistente: null,
  };
}
