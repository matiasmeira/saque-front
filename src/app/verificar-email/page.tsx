"use client";

import { Suspense, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { guardarUsuario } from "@/lib/usuario";
import { simularLlamada } from "@/lib/mock-api";
import { esPasswordValida, passwordsCoinciden, POLITICA_PASSWORD_DESCRIPCION } from "@/lib/password";

// TODO backend: código fijo de desarrollo, igual que en /verificar —
// el backend real genera uno y lo manda por mail.
const CODIGO_MOCK = "123456";
const COOLDOWN_REENVIO_SEG = 60;
const CANTIDAD_DIGITOS = 6;

type Rol = "player" | "owner";
type Verificado = { email: string; token: string; rol: Rol };
type Fase = "verificando" | "invalido" | "completar";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Verificación de email del registro CON contraseña — distinto del
 * /verificar existente (OTP passwordless del flujo de reserva, que
 * queda intacto). El backend linkea acá desde el mail de alta de
 * cuenta con contraseña.
 */
export default function VerificarEmail() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-humo" />}>
      <VerificarEmailContenido />
    </Suspense>
  );
}

function VerificarEmailContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenUrl = searchParams.get("token");

  const [fase, setFase] = useState<Fase>(() => (tokenUrl ? "verificando" : "invalido"));
  const [verificado, setVerificado] = useState<Verificado | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [mostrarCodigoManual, setMostrarCodigoManual] = useState(false);

  useEffect(() => {
    // TODO backend: GET /auth/registro/verificar?token= → { email, valido, rol }
    if (!tokenUrl) return;
    let cancelado = false;
    simularLlamada(
      tokenUrl.includes("expirado")
        ? { valido: false as const }
        : { valido: true as const, email: "vos@ejemplo.com", rol: (tokenUrl.includes("owner") ? "owner" : "player") as Rol },
      500,
    ).then((res) => {
      if (cancelado) return;
      if (!res.valido) {
        setFase("invalido");
        return;
      }
      setVerificado({ email: res.email, token: tokenUrl, rol: res.rol });
      setFase("completar");
    });
    return () => {
      cancelado = true;
    };
  }, [tokenUrl]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function reenviar() {
    if (cooldown > 0) return;
    // TODO backend: POST /auth/registro/iniciar
    setCooldown(COOLDOWN_REENVIO_SEG);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/ingresar" />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {fase === "verificando" && (
            <p className="text-center text-sm text-grafito">Verificando tu email...</p>
          )}

          {fase === "invalido" && (
            <div className="text-center">
              <h1 className="font-display text-xl font-bold text-tinta">Ese link ya no es válido</h1>
              <p className="mt-1 text-sm text-grafito">Puede haber expirado o ya haberse usado. Te podemos mandar uno nuevo.</p>
              <button
                type="button"
                onClick={reenviar}
                disabled={cooldown > 0}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
              >
                {cooldown > 0 ? `Reenviar link en ${cooldown}s` : "Reenviar link"}
              </button>
            </div>
          )}

          {fase === "completar" && verificado && (
            <div>
              <p className="text-center text-sm font-semibold text-disponible">Email verificado ✓</p>
              <FormCompletarRegistro
                verificado={verificado}
                onCompletado={(rol) => router.push(rol === "owner" ? "/panel/agenda" : "/")}
              />
            </div>
          )}

          {fase !== "completar" && (
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
                <CodigoManual onVerificado={(verificado) => { setVerificado(verificado); setFase("completar"); }} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CodigoManual({ onVerificado }: { onVerificado: (verificado: Verificado) => void }) {
  const [email, setEmail] = useState("");
  const [digitos, setDigitos] = useState<string[]>(Array(CANTIDAD_DIGITOS).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
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

  function verificar(e: FormEvent) {
    e.preventDefault();
    const codigo = digitos.join("");
    if (!email.trim() || codigo.length < CANTIDAD_DIGITOS) return;

    setVerificando(true);
    // TODO backend: POST /auth/registro/verificar-codigo { email, codigo } → { email, valido, token }
    simularLlamada(
      codigo === CODIGO_MOCK
        ? { valido: true as const, token: `codigo-${email}`, rol: "player" as Rol }
        : { valido: false as const },
      400,
    ).then((res) => {
      if (res.valido) {
        onVerificado({ email: email.trim(), token: res.token, rol: res.rol });
        return;
      }
      setError("Ese código no es correcto. Revisá el mail o pedí uno nuevo.");
      setDigitos(Array(CANTIDAD_DIGITOS).fill(""));
      inputsRef.current[0]?.focus();
      setVerificando(false);
    });
  }

  return (
    <form onSubmit={verificar} className="mt-4 text-left">
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
        className={`${campoClase} mb-4`}
      />

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

      {error && (
        <p className="mt-3 text-center text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={verificando || !email.trim() || digitos.some((d) => !d)}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        {verificando ? "Verificando..." : "Verificar"}
      </button>
    </form>
  );
}

function FormCompletarRegistro({
  verificado,
  onCompletado,
}: {
  verificado: Verificado;
  onCompletado: (rol: Rol) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function completar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError("Falta el nombre.");
    if (!telefono.trim()) return setError("Falta el teléfono.");
    if (!esPasswordValida(password)) return setError(POLITICA_PASSWORD_DESCRIPCION);
    if (!passwordsCoinciden(password, confirmar)) return setError("Las contraseñas no coinciden.");

    setError(null);
    setEnviando(true);
    // TODO backend: POST /auth/registro/completar { token, nombre, telefono, password } → { token JWT }
    simularLlamada({ ok: true }, 500).then(() => {
      guardarUsuario({ email: verificado.email, nombre: nombre.trim(), telefono: telefono.trim() });
      onCompletado(verificado.rol);
    });
  }

  return (
    <form onSubmit={completar} className="mt-4 space-y-4">
      <div>
        <label htmlFor="registro-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre
        </label>
        <input id="registro-nombre" required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campoClase} />
      </div>

      <div>
        <label htmlFor="registro-telefono" className="mb-1 block text-xs font-semibold text-grafito">
          Teléfono
        </label>
        <input
          id="registro-telefono"
          required
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="registro-password" className="mb-1 block text-xs font-semibold text-grafito">
          Contraseña
        </label>
        <input
          id="registro-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={POLITICA_PASSWORD_DESCRIPCION}
          className={campoClase}
        />
      </div>

      <div>
        <label htmlFor="registro-confirmar" className="mb-1 block text-xs font-semibold text-grafito">
          Confirmar contraseña
        </label>
        <input
          id="registro-confirmar"
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
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
