"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Info, Loader2, LogOut, Mail, Phone, User } from "lucide-react";

import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { EmptyState } from "@/components/saque/empty-state";
import { usuarios } from "@/lib/api/endpoints/auth";
import { keys } from "@/lib/api/keys";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { usePerfil, useLogout } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { borrarUsuario } from "@/lib/usuario";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

const PLANES: Record<string, string> = {
  TRIAL: "Prueba gratuita",
  FREE: "Gratuito",
  PREMIUM: "Premium",
};

/**
 * A10 · Perfil.
 *
 * Los datos salen de GET /api/v1/usuarios/me. Lo que se puede hacer acá está
 * acotado por lo que expone el backend:
 *
 *  - Nombre y email son de SOLO LECTURA: no existe endpoint para editarlos
 *    (/me es GET). Antes había un formulario que "guardaba" en localStorage,
 *    lo que hacía creer que el cambio se persistía.
 *  - Se elimina "eliminar cuenta": no hay endpoint de baja, y lo único que
 *    hacía era borrar el localStorage. Ofrecerlo era mentir sobre algo grave.
 *  - PerfilResponse NO trae el número de teléfono, sólo telefonoVerificado.
 *    Por eso no se puede mostrar el número: sólo si está verificado o no.
 *  - Sí se agrega la verificación de teléfono, que existe en el backend y la
 *    pantalla no exponía.
 */
export default function Perfil() {
  const haySesion = useHaySesion();
  const { data: perfil, isPending, isError, error } = usePerfil();

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8">
        <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">
          Mi perfil
        </h1>

        {!haySesion && (
          <div className="mt-8">
            <EmptyState
              titulo="Ingresá para ver tu perfil"
              descripcion="Necesitás una cuenta para reservar y seguir tus turnos."
              salidas={[{ label: "Ingresar o crear cuenta", href: "/ingresar" }]}
              ctaLabel="Ingresar"
            />
          </div>
        )}

        {haySesion && isPending && (
          <p className="mt-8 text-sm text-grafito">Cargando tu perfil...</p>
        )}

        {haySesion && isError && (
          <p role="alert" className="mt-8 text-sm text-cancelado">
            {error instanceof ApiError ? mensajeVisible(error) : "No pudimos cargar tu perfil."}
          </p>
        )}

        {perfil && <Contenido perfil={perfil} />}
      </main>

      <FooterPublico />
    </div>
  );
}

function Contenido({ perfil }: { perfil: PerfilResponse }) {
  const router = useRouter();
  const logout = useLogout();

  async function cerrarSesion() {
    // POST /auth/logout incrementa tokenVersion en el backend, lo que invalida
    // TODOS los JWT de este usuario al instante, no sólo el de esta pestaña.
    // Si falla igual se limpia el cliente: quedar "logueado" contra un token
    // muerto es peor.
    await logout.mutateAsync().catch(() => {});
    borrarUsuario();
    router.push("/");
  }

  return (
    <>
      <section className="mt-6 rounded-card bg-white p-6 sm:p-8">
        <div className="space-y-5">
          <Dato icono={<User className="size-3.5" aria-hidden />} etiqueta="Nombre">
            {perfil.nombre}
          </Dato>

          <Dato icono={<Mail className="size-3.5" aria-hidden />} etiqueta="Email">
            <span className="flex flex-wrap items-center gap-2">
              {perfil.email}
              {perfil.emailVerified && <Insignia>Verificado</Insignia>}
            </span>
          </Dato>

          <Dato etiqueta="Plan">{PLANES[perfil.planSuscripcion] ?? perfil.planSuscripcion}</Dato>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-input bg-humo p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-azul" aria-hidden />
          <p className="text-sm text-grafito">
            Para cambiar tu nombre o tu email, escribinos. Todavía no se pueden editar desde acá.
          </p>
        </div>
      </section>

      <VerificacionTelefono verificado={perfil.telefonoVerificado} />

      <button
        type="button"
        onClick={cerrarSesion}
        disabled={logout.isPending}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-borde bg-white font-display text-sm font-bold text-grafito transition-colors hover:border-cancelado hover:text-cancelado disabled:opacity-50"
      >
        <LogOut className="size-[18px]" aria-hidden />
        {logout.isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </>
  );
}

/**
 * Verificación de teléfono en dos pasos, contra
 * POST /usuarios/telefono/solicitar-codigo y /verificar-codigo.
 *
 * El número no se puede mostrar después: PerfilResponse sólo expone el flag
 * telefonoVerificado, no el teléfono.
 */
function VerificacionTelefono({ verificado }: { verificado: boolean }) {
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

function Dato({
  icono,
  etiqueta,
  children,
}: {
  icono?: React.ReactNode;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-grafito">
        {icono}
        {etiqueta}
      </p>
      <p className="text-tinta">{children}</p>
    </div>
  );
}

function Insignia({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-disponible-suave px-2 py-0.5 text-xs font-semibold text-disponible">
      <CheckCircle2 className="size-3" aria-hidden />
      {children}
    </span>
  );
}
