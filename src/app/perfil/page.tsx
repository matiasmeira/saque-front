"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { HeaderPublico } from "@/components/saque/header-publico";
import { FooterPublico } from "@/components/saque/footer-publico";
import { EmptyState } from "@/components/saque/empty-state";
import { borrarUsuario, useUsuario, guardarUsuario, type Usuario } from "@/lib/usuario";
import { useLogout } from "@/hooks/api/use-perfil";
import { PERFIL_MOCK } from "@/mocks/perfil";

type EstadoCarga = "cargando" | "error" | "listo";

/**
 * Formulario propiamente dicho — separado del resto de la pantalla
 * porque solo se monta una vez que ya está resuelto que hay sesión
 * (estadoCarga === "listo" && usuario), así el estado local de los
 * inputs se inicializa directo desde "usuario" sin necesitar un
 * efecto de sincronización.
 */
function FormularioPerfil({ usuario, mockErrorGuardar }: { usuario: Usuario; mockErrorGuardar: boolean }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [telefono, setTelefono] = useState(usuario.telefono);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cambios = nombre.trim() !== usuario.nombre || telefono.trim() !== usuario.telefono;

  function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || guardando) return;
    setGuardando(true);
    setErrorGuardar(false);
    setGuardado(false);
    // TODO backend: PATCH del perfil real. El mock solo actualiza la
    // sesión local — ?mockErrorGuardar=1 fuerza el camino de error.
    setTimeout(() => {
      if (mockErrorGuardar) {
        setGuardando(false);
        setErrorGuardar(true);
        return;
      }
      guardarUsuario({ ...usuario, nombre: nombre.trim(), telefono: telefono.trim() });
      setGuardando(false);
      setGuardado(true);
    }, 600);
  }

  return (
    <form onSubmit={guardar} className="rounded-card bg-white p-6 sm:p-8">
      <div>
        <label htmlFor="nombre" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-grafito">
          <User className="size-3.5" aria-hidden />
          Nombre
        </label>
        <input
          id="nombre"
          required
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setGuardado(false);
          }}
          className="w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="telefono" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-grafito">
          <Phone className="size-3.5" aria-hidden />
          Teléfono
        </label>
        <div className="flex items-center gap-2 rounded-input border border-borde bg-humo px-3 py-2.5 focus-within:border-azul">
          <span className="text-grafito">+54</span>
          <input
            id="telefono"
            type="tel"
            required
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value);
              setGuardado(false);
            }}
            className="w-full bg-transparent text-tinta focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-grafito">
          <Mail className="size-3.5" aria-hidden />
          Email
        </label>
        <div className="flex items-center justify-between gap-2 rounded-input border border-borde bg-humo px-3 py-2.5">
          <span className="text-grafito">{usuario.email}</span>
          {PERFIL_MOCK.emailVerificado && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-disponible-suave px-2 py-1 text-xs font-semibold text-disponible">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Verificado
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-grafito">El email no se cambia acá — es tu forma de identificarte al reservar.</p>
      </div>

      {errorGuardar && (
        <div className="mt-4 flex items-center gap-2 rounded-input bg-cancelado-suave px-3.5 py-2.5 text-sm text-cancelado">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          No pudimos guardar los cambios. Probá de nuevo.
        </div>
      )}

      <button
        type="submit"
        disabled={!cambios || guardando}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
      >
        {guardando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {guardando ? "Guardando..." : guardado ? "Guardado" : "Guardar cambios"}
      </button>
    </form>
  );
}

// El gate de sesión sigue el mismo criterio que A9: nunca redirige
// en un efecto sobre el "null" transitorio de useUsuario() (mismo
// bug que ya se corrigió en Zona E). Se lee después de que resuelve
// la carga simulada — tiempo de sobra para que ya esté sincronizado.
export default function Perfil() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usuario = useUsuario();

  const mockError = searchParams.get("mockError") === "1";
  const mockErrorGuardar = searchParams.get("mockErrorGuardar") === "1";

  const [reintento, setReintento] = useState(0);
  const [eliminando, setEliminando] = useState(false);

  const clave = `${mockError}|${reintento}`;
  const [resuelto, setResuelto] = useState<{ clave: string; error: boolean } | null>(null);
  const estadoCarga: EstadoCarga = resuelto?.clave !== clave ? "cargando" : resuelto.error ? "error" : "listo";

  useEffect(() => {
    const id = setTimeout(() => setResuelto({ clave, error: mockError }), 500);
    return () => clearTimeout(id);
  }, [clave, mockError]);

  const logout = useLogout();

  /**
   * Cierre de sesión real: POST /api/v1/auth/logout incrementa tokenVersion en
   * el backend, lo que invalida TODOS los JWT de este usuario al instante (no
   * sólo el de esta pestaña). Recién después se limpia el token local y el
   * cache de queries. Si la llamada falla igual se limpia del lado del
   * cliente — quedar "logueado" localmente contra un token muerto es peor.
   *
   * borrarUsuario() sigue acá para limpiar el usuario mock heredado; se va
   * cuando /perfil se migre entero a PerfilResponse.
   */
  async function cerrarSesion() {
    await logout.mutateAsync().catch(() => {});
    borrarUsuario();
    router.push("/");
  }

  function confirmarEliminar() {
    borrarUsuario();
    setEliminando(false);
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="flex-1 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-tinta">Mi perfil</h1>

          {estadoCarga === "cargando" && <div className="mt-6 h-96 animate-pulse rounded-card bg-white" />}

          {estadoCarga === "error" && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-card bg-white py-20 text-center">
              <AlertTriangle className="size-8 text-cancelado" aria-hidden />
              <p className="font-semibold text-tinta">No pudimos cargar tu perfil.</p>
              <button
                type="button"
                onClick={() => setReintento((r) => r + 1)}
                className="rounded-full bg-azul px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
              >
                Reintentar
              </button>
            </div>
          )}

          {estadoCarga === "listo" && !usuario && (
            <div className="mt-6">
              <EmptyState
                titulo="Iniciá sesión para ver tu perfil"
                descripcion="Ahí vas a poder editar tus datos y gestionar tu cuenta."
                salidas={[{ label: "Ingresar", href: "/ingresar" }]}
              />
            </div>
          )}

          {estadoCarga === "listo" && usuario && (
            <div className="mt-6 space-y-4">
              <FormularioPerfil usuario={usuario} mockErrorGuardar={mockErrorGuardar} />

              <div className="space-y-2.5">
                <Link
                  href="/mis-reservas"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-borde bg-white font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
                >
                  <CalendarClock className="size-4" aria-hidden />
                  Mis reservas
                </Link>
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-borde bg-white font-display text-sm font-bold text-tinta transition-colors hover:bg-humo"
                >
                  <LogOut className="size-4" aria-hidden />
                  Cerrar sesión
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEliminando(true)}
                  className="text-sm font-semibold text-cancelado transition-colors hover:text-cancelado/80"
                >
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterPublico />

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setEliminando(false)}
            className="absolute inset-0 bg-tinta/40"
          />
          <div className="relative z-10 w-full rounded-t-card bg-white p-6 sm:max-w-sm sm:rounded-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Trash2 className="size-5 shrink-0 text-cancelado" aria-hidden />
                <h2 className="font-display text-lg font-bold text-tinta">Eliminar cuenta</h2>
              </div>
              <button
                type="button"
                onClick={() => setEliminando(false)}
                aria-label="Cerrar"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-grafito transition-colors hover:bg-humo"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <p className="text-sm text-grafito">
              Vas a perder el acceso a tu historial de reservas y cualquier turno pendiente de pago se cancela. Esta
              acción no se puede deshacer.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEliminando(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90"
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
