"use client";

import { useRouter } from "next/navigation";
import { Info, LogOut, Mail, User } from "lucide-react";

import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { EmptyState } from "@/components/saque/empty-state";
import { Dato } from "@/components/perfil/dato";
import { Insignia } from "@/components/perfil/insignia";
import { VerificacionTelefono } from "@/components/perfil/verificacion-telefono";
import { PLANES } from "@/components/perfil/etiquetas";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { usePerfil, useLogout } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { borrarUsuario } from "@/lib/usuario";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

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

