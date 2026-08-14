"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import {
  CompletarRegistro,
  TITULOS_REGISTRO,
  type PasoRegistro,
} from "@/components/saque/completar-registro";
import { COMPLEJOS } from "@/mocks/complejos";
import { guardarBooking, urlCheckout, useIntencion } from "@/lib/reserva-intencion";
import { useLogin } from "@/hooks/api/use-perfil";
import { useReenviarCodigo, useSondearEmail, useVerificarCodigo } from "@/hooks/api/use-auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/**
 * A4 — entrada única de sesión y alta de cuenta.
 *
 * Es UNA sola ruta con pasos internos, no varias rutas. El motivo es la
 * contraseña: en el alta se pide en un paso intermedio y recién se manda al
 * final, junto con los datos. Si cada paso fuera su propia ruta habría que
 * persistirla entre navegaciones; acá vive sólo en memoria.
 *
 * Ingreso:  email → (¿tiene cuenta?) → contraseña → adentro
 * Alta:     email → código de 6 dígitos → contraseña → nombre y teléfono → adentro
 *
 * "¿Tiene cuenta?" se resuelve con POST /auth/registro/iniciar, que devuelve
 * 400 si el email ya está registrado y 200 (mandando el mail con el código) si
 * no lo está — ver useSondearEmail para el detalle del rate limit.
 *
 * Los dos últimos pasos del alta viven en <CompletarRegistro> porque se
 * comparten con /verificar, que es donde cae el link del mail.
 */
type Paso = "email" | "password-login" | "codigo" | PasoRegistro;

const LARGO_CODIGO = 6;

export default function Ingresar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intencion = useIntencion();

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  // Token de registro (no es el JWT). Sólo vive mientras dura el alta.
  const [tokenRegistro, setTokenRegistro] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sondear = useSondearEmail();
  const login = useLogin();
  const verificarCodigo = useVerificarCodigo();
  const reenviar = useReenviarCodigo();

  const complejo = searchParams.get("complejo");
  const cancha = searchParams.get("cancha");
  const fecha = searchParams.get("fecha");
  const hora = searchParams.get("hora");
  const tieneParamsDeReserva = Boolean(complejo && cancha && fecha && hora);

  useEffect(() => {
    if (complejo && cancha && fecha && hora) {
      guardarBooking({ complejo, cancha, fecha, hora });
    }
  }, [complejo, cancha, fecha, hora]);

  const modoReserva = Boolean(
    intencion?.complejo && intencion?.cancha && intencion?.fecha && intencion?.hora,
  );
  const complejoNombre = intencion?.complejo
    ? COMPLEJOS.find((c) => c.id === intencion.complejo)?.nombre
    : null;
  const cerrarHacia =
    modoReserva && intencion?.complejo && intencion.cancha && intencion.fecha && intencion.hora
      ? urlCheckout({
          complejo: intencion.complejo,
          cancha: intencion.cancha,
          fecha: intencion.fecha,
          hora: intencion.hora,
        })
      : "/";

  // Igual que antes: si venimos con params de reserva, esperamos a que la
  // intención sincronizada coincida con ESTA reserva antes de mostrar nada.
  if (tieneParamsDeReserva && intencion?.complejo !== complejo) {
    return <div className="min-h-dvh bg-humo" />;
  }

  /** Adónde va el usuario una vez que hay sesión. */
  function entrar(perfil: PerfilResponse) {
    if (modoReserva) {
      router.push(cerrarHacia);
      return;
    }
    router.push(perfil.rol === "OWNER" || perfil.rol === "ADMIN" ? "/panel/agenda" : "/");
  }

  function mensajeDeError(e: unknown, porDefecto: string): string {
    return e instanceof ApiError ? mensajeVisible(e) : porDefecto;
  }

  async function enviarEmail(e: FormEvent) {
    e.preventDefault();
    const limpio = email.trim().toLowerCase();
    if (!limpio) return;
    setError(null);
    setEmail(limpio);
    try {
      const resultado = await sondear.mutateAsync(limpio);
      setPaso(resultado === "tiene-cuenta" ? "password-login" : "codigo");
    } catch (e) {
      setError(mensajeDeError(e, "No pudimos continuar. Intentá de nuevo."));
    }
  }

  async function enviarLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      entrar(await login.mutateAsync({ email, password }));
    } catch (e) {
      setError(mensajeDeError(e, "No pudimos ingresar. Intentá de nuevo."));
    }
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    if (codigo.length !== LARGO_CODIGO) return;
    setError(null);
    try {
      setTokenRegistro(await verificarCodigo.mutateAsync({ email, codigo }));
      setPaso("password");
    } catch (e) {
      setError(mensajeDeError(e, "El código no es válido o venció."));
    }
  }

  function volverAlEmail() {
    setPaso("email");
    setPassword("");
    setCodigo("");
    setError(null);
  }

  const claseInput =
    "w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none";
  const claseBoton =
    "mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito";
  const claseLabel = "mb-1 block text-xs font-semibold text-grafito";

  const titulos: Record<Paso, string> = {
    email: modoReserva ? "Para reservar necesitás una cuenta" : "Ingresá o creá tu cuenta",
    "password-login": "Ingresá tu contraseña",
    codigo: "Revisá tu email",
    ...TITULOS_REGISTRO,
  };

  const enRegistroFinal = paso === "password" || paso === "datos";

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="relative w-full max-w-sm rounded-card bg-white p-8">
          {modoReserva && paso === "email" && (
            <Link
              href={cerrarHacia}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
            >
              <X className="size-5" aria-hidden />
            </Link>
          )}

          {paso !== "email" && (
            <button
              type="button"
              onClick={volverAlEmail}
              aria-label="Volver"
              className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          )}

          <h1 className="text-center font-display text-xl font-bold text-tinta">
            {titulos[paso]}
          </h1>

          {paso === "email" && complejoNombre && (
            <p className="mt-1 text-center text-sm text-grafito">{complejoNombre}</p>
          )}
          {paso !== "email" && (
            <p className="mt-1 text-center text-sm text-grafito">{email}</p>
          )}

          {paso === "email" && (
            <form onSubmit={enviarEmail} className="mt-6">
              <label htmlFor="email" className={claseLabel}>
                Tu email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className={claseInput}
              />
              <button type="submit" disabled={sondear.isPending} className={claseBoton}>
                {sondear.isPending ? "Verificando..." : "Continuar"}
              </button>
              <p className="mt-4 text-center text-sm text-grafito">
                Si ya tenés cuenta, entrás igual con este mismo email.
              </p>
            </form>
          )}

          {paso === "password-login" && (
            <form onSubmit={enviarLogin} className="mt-6">
              <label htmlFor="password" className={claseLabel}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={claseInput}
              />
              <button type="submit" disabled={login.isPending} className={claseBoton}>
                {login.isPending ? "Ingresando..." : "Ingresar"}
              </button>
              <p className="mt-4 text-center text-sm">
                <Link href="/recuperar-password" className="text-azul hover:underline">
                  Olvidé mi contraseña
                </Link>
              </p>
            </form>
          )}

          {paso === "codigo" && (
            <form onSubmit={enviarCodigo} className="mt-6">
              <p className="mb-4 text-center text-sm text-grafito">
                Te mandamos un código de {LARGO_CODIGO} dígitos para crear tu cuenta.
              </p>
              <label htmlFor="codigo" className={claseLabel}>
                Código
              </label>
              <input
                id="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={LARGO_CODIGO}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className={`${claseInput} text-center font-display text-2xl tracking-[0.4em]`}
              />
              <button
                type="submit"
                disabled={verificarCodigo.isPending || codigo.length !== LARGO_CODIGO}
                className={claseBoton}
              >
                {verificarCodigo.isPending ? "Verificando..." : "Continuar"}
              </button>
              <button
                type="button"
                onClick={() => reenviar.mutate(email)}
                disabled={reenviar.isPending}
                className="mt-4 w-full text-center text-sm text-azul hover:underline disabled:text-grafito disabled:no-underline"
              >
                {reenviar.isPending ? "Reenviando..." : "Reenviar código"}
              </button>
              {reenviar.isError && (
                <p role="alert" className="mt-2 text-center text-sm text-cancelado">
                  {mensajeVisible(reenviar.error)}
                </p>
              )}
            </form>
          )}

          {enRegistroFinal && (
            <CompletarRegistro
              tokenRegistro={tokenRegistro}
              paso={paso}
              onPasoChange={setPaso}
              onListo={entrar}
            />
          )}

          {error && !enRegistroFinal && (
            <p role="alert" className="mt-4 text-center text-sm text-cancelado">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
