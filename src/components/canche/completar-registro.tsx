"use client";

import { useState, type FormEvent } from "react";

import { useCompletarRegistro } from "@/hooks/api/use-auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { PerfilResponse } from "@/lib/api/tipos/auth";
import {
  POLITICA_PASSWORD_DESCRIPCION,
  esPasswordValida,
  passwordsCoinciden,
} from "@/lib/password";

/**
 * Los dos últimos pasos del alta de cuenta: contraseña y datos personales.
 *
 * Vive acá porque hay DOS formas de llegar: tipear el código de 6 dígitos en
 * /ingresar, o abrir el link del mail en /verificar?token=. El backend hace que
 * ambas converjan — el código canjea un token equivalente al del link — así que
 * a partir de tener un token de registro el resto es idéntico.
 *
 * La contraseña sólo vive en el estado de este componente: se manda recién en
 * el submit final, junto con los datos, porque CompletarRegistroRequest los
 * pide en un único request. Nunca se persiste.
 */

const claseInput =
  "w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none";
const claseBoton =
  "mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito";
const claseLabel = "mb-1 block text-xs font-semibold text-grafito";

export type PasoRegistro = "password" | "datos";

export const TITULOS_REGISTRO: Record<PasoRegistro, string> = {
  password: "Elegí una contraseña",
  datos: "Contanos quién sos",
};

export function CompletarRegistro({
  tokenRegistro,
  paso,
  onPasoChange,
  onListo,
}: {
  tokenRegistro: string;
  paso: PasoRegistro;
  onPasoChange: (paso: PasoRegistro) => void;
  onListo: (perfil: PerfilResponse) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);

  const completarRegistro = useCompletarRegistro();

  function enviarPassword(e: FormEvent) {
    e.preventDefault();
    if (!esPasswordValida(password)) {
      setError(POLITICA_PASSWORD_DESCRIPCION);
      return;
    }
    if (!passwordsCoinciden(password, confirmar)) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    onPasoChange("datos");
  }

  async function enviarDatos(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError(null);
    try {
      const perfil = await completarRegistro.mutateAsync({
        token: tokenRegistro,
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        password,
      });
      onListo(perfil);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? mensajeVisible(e)
          : "No pudimos crear la cuenta. Intentá de nuevo.",
      );
    }
  }

  return (
    <>
      {paso === "password" && (
        <form onSubmit={enviarPassword} className="mt-6">
          <label htmlFor="password-nueva" className={claseLabel}>
            Contraseña
          </label>
          <input
            id="password-nueva"
            type="password"
            required
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={claseInput}
          />
          <p className="mt-1 text-xs text-grafito">{POLITICA_PASSWORD_DESCRIPCION}</p>

          <label htmlFor="confirmar" className={`${claseLabel} mt-4`}>
            Repetila
          </label>
          <input
            id="confirmar"
            type="password"
            required
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className={claseInput}
          />
          <button type="submit" className={claseBoton}>
            Continuar
          </button>
        </form>
      )}

      {paso === "datos" && (
        <form onSubmit={enviarDatos} className="mt-6">
          <label htmlFor="nombre" className={claseLabel}>
            Nombre y apellido
          </label>
          <input
            id="nombre"
            required
            autoComplete="name"
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseInput}
          />

          <label htmlFor="telefono" className={`${claseLabel} mt-4`}>
            Teléfono <span className="font-normal">(opcional)</span>
          </label>
          <input
            id="telefono"
            type="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="11 2345 6789"
            className={claseInput}
          />

          <button type="submit" disabled={completarRegistro.isPending} className={claseBoton}>
            {completarRegistro.isPending ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-cancelado">
          {error}
        </p>
      )}
    </>
  );
}
