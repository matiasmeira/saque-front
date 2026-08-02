"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { actualizarIntencion, useIntencion } from "@/lib/reserva-intencion";

// TODO backend: código fijo de desarrollo. El backend genera uno de
// verdad y lo manda por mail junto con el magic link — acá solo
// validamos contra este valor mientras no hay API.
const CODIGO_MOCK = "123456";
const COOLDOWN_REENVIO_SEG = 60;
const CANTIDAD_DIGITOS = 6;

/**
 * A4, paso 2. Acepta el código tipeado en ESTA pestaña — no depende
 * de que se abra el link del mail en otro lado, que es justo la
 * trampa que hunde la conversión (Parte 9, A4).
 */
export default function Verificar() {
  const router = useRouter();
  const intencion = useIntencion();

  const [digitos, setDigitos] = useState<string[]>(Array(CANTIDAD_DIGITOS).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!intencion?.email) {
      router.replace("/ingresar");
    }
  }, [intencion, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (!intencion?.email) return <div className="min-h-dvh bg-humo" />;

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
    if (codigo.length < CANTIDAD_DIGITOS) return;

    setVerificando(true);
    setTimeout(() => {
      if (codigo === CODIGO_MOCK) {
        actualizarIntencion({ verificado: true });
        router.push("/completar-perfil");
        return;
      }
      setError("Ese código no es correcto. Revisá el mail o pedí uno nuevo.");
      setDigitos(Array(CANTIDAD_DIGITOS).fill(""));
      inputsRef.current[0]?.focus();
      setVerificando(false);
    }, 400);
  }

  function reenviar() {
    if (cooldown > 0) return;
    // TODO backend: reenviar el mail con un código nuevo.
    setCooldown(COOLDOWN_REENVIO_SEG);
    setError(null);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo volver="/ingresar" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-xl font-bold text-tinta">Verificá tu identidad</h1>
          <p className="mt-1 text-sm text-grafito">
            Te mandamos un mail a <span className="font-semibold text-tinta">{intencion.email}</span>
          </p>

          <form onSubmit={verificar} className="mt-6">
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
              <p className="mt-3 text-sm text-cancelado" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={verificando || digitos.some((d) => !d)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
            >
              {verificando ? "Verificando..." : "Verificar"}
            </button>
          </form>

          <button
            type="button"
            onClick={reenviar}
            disabled={cooldown > 0}
            className="mt-4 text-sm font-semibold text-azul transition-colors hover:text-azul-oscuro disabled:cursor-not-allowed disabled:text-grafito"
          >
            {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
          </button>
        </div>
      </main>
    </div>
  );
}
