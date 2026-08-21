"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";

import { usuarios } from "@/lib/api/endpoints/auth";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { Insignia } from "@/components/perfil/insignia";

/**
 * Verificación de teléfono en dos pasos, contra
 * POST /usuarios/telefono/solicitar-codigo y /verificar-codigo.
 *
 * El número no se puede mostrar después: PerfilResponse sólo expone el flag
 * telefonoVerificado, no el teléfono.
 */
export function VerificacionTelefono({ verificado }: { verificado: boolean }) {
  const queryClient = useQueryClient();
  const [paso, setPaso] = useState<"inicial" | "telefono" | "codigo">("inicial");
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const solicitar = useMutation({
    mutationFn: (telefono: string) => usuarios.solicitarCodigoTelefono({ telefono }),
  });
  const verificar = useMutation({
    mutationFn: (codigo: string) => usuarios.verificarCodigoTelefono({ codigo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.perfil() }),
  });

  function fallo(e: unknown, porDefecto: string) {
    setError(e instanceof ApiError ? mensajeVisible(e) : porDefecto);
  }

  async function enviarTelefono(e: FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) return;
    setError(null);
    try {
      await solicitar.mutateAsync(telefono.trim());
      setPaso("codigo");
    } catch (e) {
      fallo(e, "No pudimos enviar el código.");
    }
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    if (codigo.length !== 6) return;
    setError(null);
    try {
      await verificar.mutateAsync(codigo);
      setPaso("inicial");
    } catch (e) {
      fallo(e, "El código no es válido.");
    }
  }

  const claseInput =
    "w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none";

  return (
    <section className="mt-6 rounded-card bg-white p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-tinta">
        <Phone className="size-[18px] text-azul" aria-hidden />
        Teléfono
      </h2>

      {verificado ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-grafito">
          Tu teléfono está verificado <Insignia>Verificado</Insignia>
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-grafito">
            Verificá tu teléfono para que el complejo pueda contactarte por tu turno.
          </p>

          {paso === "inicial" && (
            <button
              type="button"
              onClick={() => setPaso("telefono")}
              className="mt-4 h-11 rounded-full border border-azul px-5 text-sm font-semibold text-azul transition-colors hover:bg-azul hover:text-white"
            >
              Verificar mi teléfono
            </button>
          )}

          {paso === "telefono" && (
            <form onSubmit={enviarTelefono} className="mt-4">
              <label htmlFor="telefono" className="mb-1 block text-xs font-semibold text-grafito">
                Tu número
              </label>
              <input
                id="telefono"
                type="tel"
                autoComplete="tel"
                autoFocus
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="11 2345 6789"
                className={claseInput}
              />
              <button
                type="submit"
                disabled={solicitar.isPending}
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-azul px-5 text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:bg-borde disabled:text-grafito"
              >
                {solicitar.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {solicitar.isPending ? "Enviando..." : "Enviarme el código"}
              </button>
            </form>
          )}

          {paso === "codigo" && (
            <form onSubmit={enviarCodigo} className="mt-4">
              <label htmlFor="codigo-tel" className="mb-1 block text-xs font-semibold text-grafito">
                Código de 6 dígitos
              </label>
              <input
                id="codigo-tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className={`${claseInput} text-center font-display text-xl tracking-[0.3em]`}
              />
              <button
                type="submit"
                disabled={verificar.isPending || codigo.length !== 6}
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-azul px-5 text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:bg-borde disabled:text-grafito"
              >
                {verificar.isPending ? "Verificando..." : "Verificar"}
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm text-cancelado">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
