"use client";

import { Suspense, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { auth } from "@/lib/api/endpoints/auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { esPasswordValida, passwordsCoinciden, POLITICA_PASSWORD_DESCRIPCION } from "@/lib/password";

const COOLDOWN_REENVIO_SEG = 60;
const CANTIDAD_DIGITOS = 6;

/**
 * No existe "verificando": el backend no expone forma de validar un token de
 * reset antes de usarlo — POST /auth/password/reset lo consume y falla si no
 * sirve. Antes esta pantalla simulaba esa validación mirando si el token
 * contenía la palabra "expirado"; ahora se muestra el formulario directamente
 * y el error real aparece al enviarlo.
 */
type Fase = "invalido" | "restablecer" | "listo";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/** Nueva contraseña — llega acá desde el link de /recuperar-password. */
export default function Restablecer() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <RestablecerContenido />
    </Suspense>
  );
}

function RestablecerContenido() {
  const searchParams = useSearchParams();
  const tokenUrl = searchParams.get("token");

  const [fase, setFase] = useState<Fase>(() => (tokenUrl ? "restablecer" : "invalido"));
  const [cooldown, setCooldown] = useState(0);
  const [mostrarCodigoManual, setMostrarCodigoManual] = useState(false);
  const [emailReenvio, setEmailReenvio] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /**
   * Reenviar exige el email: el link no lo trae y el backend identifica al
   * usuario por el token opaco, no por una sesión. El cooldown se arranca
   * igual haya funcionado o no, para no habilitar un botón de reintento
   * instantáneo contra un endpoint con rate limit.
   */
  function reenviar() {
    if (cooldown > 0) return;
    const limpio = emailReenvio.trim().toLowerCase();
    if (!limpio) return;
    setCooldown(COOLDOWN_REENVIO_SEG);
    void auth.recuperarPassword({ email: limpio }).catch(() => {});
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/ingresar" />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {fase === "invalido" && (
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-tinta">Ese link ya no es válido</h1>
              <p className="mt-1 text-sm text-grafito">Puede haber expirado o ya haberse usado. Pedí uno nuevo.</p>
              <input
                type="email"
                autoComplete="email"
                value={emailReenvio}
                onChange={(e) => setEmailReenvio(e.target.value)}
                placeholder="nombre@ejemplo.com"
                aria-label="Tu email"
                className={`${campoClase} mt-4`}
              />
              <button
                type="button"
                onClick={reenviar}
                disabled={cooldown > 0 || !emailReenvio.trim()}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
              >
                {cooldown > 0 ? `Reenviar link en ${cooldown}s` : "Reenviar link"}
              </button>
            </div>
          )}

          {fase === "restablecer" && tokenUrl && (
            <FormNuevaPassword token={tokenUrl} onListo={() => setFase("listo")} />
          )}

          {fase === "listo" && (
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-tinta">Contraseña actualizada</h1>
              <p className="mt-1 text-sm text-grafito">Ya podés ingresar con tu nueva contraseña.</p>
              <Link
                href="/ingresar"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Ir a ingresar
              </Link>
            </div>
          )}

          {fase === "invalido" && (
            <div className="mt-6 border-t border-borde pt-5 text-center">
              {!mostrarCodigoManual ? (
                <button
                  type="button"
                  onClick={() => setMostrarCodigoManual(true)}
                  className="text-sm font-semibold text-azul transition-colors hover:text-azul-oscuro"
                >
                  ¿No te llegó el link? Ingresá el código
                </button>
              ) : (
                <FormCodigoManual onListo={() => setFase("listo")} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FormNuevaPassword({ token, onListo }: { token: string; onListo: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function restablecer(e: FormEvent) {
    e.preventDefault();
    if (!esPasswordValida(password)) return setError(POLITICA_PASSWORD_DESCRIPCION);
    if (!passwordsCoinciden(password, confirmar)) return setError("Las contraseñas no coinciden.");

    setError(null);
    setEnviando(true);
    try {
      await auth.resetPassword({ token, nuevaPassword: password });
      onListo();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? mensajeVisible(e)
          : "No pudimos cambiar la contraseña. Intentá de nuevo.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={restablecer} className="space-y-4 text-left">
      <h1 className="text-center font-display text-xl font-bold text-tinta">Elegí tu nueva contraseña</h1>

      <div>
        <label htmlFor="nueva-password" className="mb-1 block text-xs font-semibold text-grafito">
          Nueva contraseña
        </label>
        <input
          id="nueva-password"
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={POLITICA_PASSWORD_DESCRIPCION}
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="confirmar-password" className="mb-1 block text-xs font-semibold text-grafito">
          Confirmar contraseña
        </label>
        <input
          id="confirmar-password"
          type="password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={campoClase}
        />
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        {enviando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}

function FormCodigoManual({ onListo }: { onListo: () => void }) {
  const [email, setEmail] = useState("");
  const [digitos, setDigitos] = useState<string[]>(Array(CANTIDAD_DIGITOS).fill(""));
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function cambiarDigito(indice: number, valor: string) {
    const limpio = valor.replace(/\D/g, "").slice(-1);
    setDigitos((prev) => prev.map((d, i) => (i === indice ? limpio : d)));
    setError(null);
    if (limpio && indice < CANTIDAD_DIGITOS - 1) inputsRef.current[indice + 1]?.focus();
  }

  function onKeyDown(indice: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[indice] && indice > 0) {
      inputsRef.current[indice - 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CANTIDAD_DIGITOS);
    if (!texto) return;
    e.preventDefault();
    setDigitos((prev) => prev.map((d, i) => texto[i] ?? d));
    inputsRef.current[Math.min(texto.length, CANTIDAD_DIGITOS - 1)]?.focus();
  }

  async function restablecer(e: FormEvent) {
    e.preventDefault();
    const codigo = digitos.join("");
    if (!email.trim() || codigo.length < CANTIDAD_DIGITOS) return;
    if (!esPasswordValida(password)) return setError(POLITICA_PASSWORD_DESCRIPCION);
    if (!passwordsCoinciden(password, confirmar)) return setError("Las contraseñas no coinciden.");

    setError(null);
    setEnviando(true);
    try {
      // El backend acepta token XOR (email + codigo); esta es la segunda vía.
      await auth.resetPassword({
        email: email.trim().toLowerCase(),
        codigo,
        nuevaPassword: password,
      });
      onListo();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? mensajeVisible(err)
          : "No pudimos cambiar la contraseña. Intentá de nuevo.",
      );
      setDigitos(Array(CANTIDAD_DIGITOS).fill(""));
      inputsRef.current[0]?.focus();
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={restablecer} className="mt-4 space-y-4 text-left">
      <div>
        <label htmlFor="codigo-manual-email" className="mb-1 block text-xs font-semibold text-grafito">
          Tu email
        </label>
        <input
          id="codigo-manual-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@ejemplo.com"
          className={campoClase}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-grafito">Código de 6 dígitos</p>
        <div className="flex justify-center gap-2" onPaste={onPaste}>
          {digitos.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={d}
              onChange={(e) => cambiarDigito(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`Dígito ${i + 1} de ${CANTIDAD_DIGITOS}`}
              className="h-14 w-11 rounded-input border border-borde bg-white text-center font-display text-xl font-bold text-tinta focus:border-azul focus:outline-none"
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="codigo-manual-password" className="mb-1 block text-xs font-semibold text-grafito">
          Nueva contraseña
        </label>
        <input
          id="codigo-manual-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={POLITICA_PASSWORD_DESCRIPCION}
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="codigo-manual-confirmar" className="mb-1 block text-xs font-semibold text-grafito">
          Confirmar contraseña
        </label>
        <input
          id="codigo-manual-confirmar"
          type="password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={campoClase}
        />
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !email.trim() || digitos.some((d) => !d)}
        className="flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        {enviando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
