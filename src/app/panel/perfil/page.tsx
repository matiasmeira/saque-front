"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Mail, Shield, Trash2, User, Wallet } from "lucide-react";

import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { Dato } from "@/components/perfil/dato";
import { Insignia } from "@/components/perfil/insignia";
import { VerificacionTelefono } from "@/components/perfil/verificacion-telefono";
import { PLANES, ROLES } from "@/components/perfil/etiquetas";
import { usuarios } from "@/lib/api/endpoints/auth";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { borrarToken, hayToken } from "@/lib/api/sesion";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import type { PerfilResponse } from "@/lib/api/tipos/auth";

/**
 * Mi perfil, del lado del panel (dueño/admin/empleado). A diferencia de
 * /perfil (jugador), esto vive detrás del panel y suma "Eliminar cuenta":
 * cuando se escribió /perfil el backend no tenía DELETE /me, así que esa
 * pantalla no lo ofrece.
 */
export default function PanelPerfil() {
  const router = useRouter();
  const haySesion = useHaySesion();
  const { data: perfil, isPending, isError, error, refetch } = usePerfil();
  const [cuentaEliminada, setCuentaEliminada] = useState(false);

  // Lee hayToken() en vez de confiar en el haySesion cerrado del render que
  // disparó el efecto: en una navegación dura, useSyncExternalStore rinde
  // false en el primer commit post-hidratación (getServerSnapshot) y recién
  // se corrige en un render posterior — si el efecto confiara en ese false
  // transitorio, redirigiría a /ingresar a una sesión real.
  // cuentaEliminada gana sobre eso: borrar la cuenta también borra el token,
  // y sin este chequeo el mismo efecto nos mandaría a /ingresar antes de
  // mostrar el cartel de confirmación.
  useEffect(() => {
    if (!hayToken() && !cuentaEliminada) router.replace("/ingresar");
  }, [haySesion, cuentaEliminada, router]);

  useEffect(() => {
    if (!cuentaEliminada) return;
    const id = setTimeout(() => router.push("/"), 1500);
    return () => clearTimeout(id);
  }, [cuentaEliminada, router]);

  if (cuentaEliminada) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-humo px-4">
        <div className="w-full max-w-sm rounded-card bg-white p-8 text-center shadow-card">
          <p className="font-display text-lg font-bold text-tinta">Cuenta eliminada</p>
          <p className="mt-2 text-sm text-grafito">Te llevamos al inicio...</p>
        </div>
      </div>
    );
  }

  if (!haySesion) return <div className="min-h-dvh bg-humo" />;

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <div className="mx-auto w-full max-w-2xl">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Mi perfil</h1>

            {isPending && <p className="mt-6 text-sm text-grafito">Cargando tu perfil...</p>}

            {isError && (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-card bg-white py-16 text-center shadow-card">
                <AlertTriangle className="size-8 text-cancelado" aria-hidden />
                <p className="font-semibold text-tinta">
                  {error instanceof ApiError ? mensajeVisible(error) : "No pudimos cargar tu perfil."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
                >
                  Reintentar
                </button>
              </div>
            )}

            {perfil && <Contenido perfil={perfil} onCuentaEliminada={() => setCuentaEliminada(true)} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Contenido({
  perfil,
  onCuentaEliminada,
}: {
  perfil: PerfilResponse;
  onCuentaEliminada: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);

  return (
    <>
      <section className="mt-6 rounded-card bg-white p-6 shadow-card sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-tinta">Tus datos</h2>
          <span title="Próximamente">
            <button
              type="button"
              disabled
              className="h-9 shrink-0 rounded-full border border-borde px-4 text-sm font-semibold text-grafito opacity-50"
            >
              Editar
            </button>
          </span>
        </div>

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

          <Dato icono={<Shield className="size-3.5" aria-hidden />} etiqueta="Rol">
            {ROLES[perfil.rol]}
          </Dato>

          <Dato icono={<Wallet className="size-3.5" aria-hidden />} etiqueta="Plan">
            {PLANES[perfil.planSuscripcion]}
          </Dato>
        </div>
      </section>

      <VerificacionTelefono verificado={perfil.telefonoVerificado} />

      <section className="mt-6 rounded-card bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-tinta">Cuenta</h2>
        <p className="mt-2 text-sm text-grafito">
          Eliminar tu cuenta es permanente: perdés el acceso y no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setEliminando(true)}
          className="mt-5 flex h-11 items-center gap-2 rounded-full border border-cancelado px-5 font-display text-sm font-bold text-cancelado transition-colors hover:bg-cancelado hover:text-white focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          <Trash2 className="size-4" aria-hidden />
          Eliminar cuenta
        </button>
      </section>

      {eliminando && (
        <ModalEliminarCuenta onClose={() => setEliminando(false)} onEliminada={onCuentaEliminada} />
      )}
    </>
  );
}

function ModalEliminarCuenta({
  onClose,
  onEliminada,
}: {
  onClose: () => void;
  onEliminada: () => void;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const eliminar = useMutation({
    mutationFn: (password: string) => usuarios.eliminar({ password }),
    onSuccess: () => {
      borrarToken();
      queryClient.clear();
      onEliminada();
    },
    // 401 = contraseña incorrecta; 400 = guardrail de owner con complejos
    // activos. Los dos mensajes del back son útiles tal cual.
    onError: (e) => setError(e instanceof ApiError ? mensajeVisible(e) : "No pudimos eliminar la cuenta."),
  });

  return (
    <ModalPanel titulo="Eliminar cuenta" subtitulo="Esta acción no se puede deshacer" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-tinta">
          Vas a perder el acceso a tu cuenta y a todo lo asociado a ella. Ingresá tu contraseña para confirmar.
        </p>
        <div>
          <label htmlFor="password-eliminar" className="mb-1 block text-xs font-semibold text-grafito">
            Contraseña actual
          </label>
          <input
            id="password-eliminar"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-cancelado">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => eliminar.mutate(password)}
            disabled={!password || eliminar.isPending}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden />
            {eliminar.isPending ? "Eliminando..." : "Eliminar cuenta"}
          </button>
        </div>
      </div>
    </ModalPanel>
  );
}
