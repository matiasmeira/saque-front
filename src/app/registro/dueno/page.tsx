"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeaderPublico } from "@/components/canche/header-publico";
import { usePerfil, useRegistrarDueno } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { destinoTrasLogin } from "@/lib/destino-login";
import { POLITICA_PASSWORD_DESCRIPCION } from "@/lib/password";
import {
  armarBodyRegistroDueno,
  validarRegistroDueno,
  type ErroresRegistroDueno,
} from "@/lib/registro-dueno";

/**
 * Alta de dueño. Pública. POST /auth/register/owner crea un OWNER y devuelve
 * el JWT; no verifica el mail (decisión de producto, pendiente aparte). Un
 * dueño nuevo no tiene complejos, así que va directo al wizard de onboarding.
 *
 * Si ya hay sesión no tiene sentido registrarse: se lo manda a su destino por
 * rol, como después de ingresar.
 */
export default function RegistroDueno() {
  const router = useRouter();
  const haySesion = useHaySesion();
  const perfil = usePerfil();
  const registrar = useRegistrarDueno();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<ErroresRegistroDueno>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  // Mientras se registra, la sesión que aparece es la del alta misma: no hay
  // que mandarla a destinoTrasLogin porque su destino es el wizard.
  const [registrando, setRegistrando] = useState(false);

  const perfilData = perfil.data;
  useEffect(() => {
    if (registrando || !perfilData) return;
    router.replace(destinoTrasLogin({ rol: perfilData.rol }));
  }, [registrando, perfilData, router]);

  const yaLogueado = haySesion && !registrando && !perfil.isError;
  if (yaLogueado) return <div className="min-h-dvh bg-humo" />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErrorServidor(null);
    const datos = { nombre, email, password };
    const invalidos = validarRegistroDueno(datos);
    setErrores(invalidos);
    if (Object.keys(invalidos).length > 0) return;

    setRegistrando(true);
    try {
      await registrar.mutateAsync(armarBodyRegistroDueno(datos));
      router.push("/panel/bienvenida");
    } catch (err) {
      setRegistrando(false);
      setErrorServidor(
        err instanceof ApiError ? mensajeVisible(err) : "No pudimos crear tu cuenta. Intentá de nuevo.",
      );
    }
  }

  const claseInput =
    "w-full rounded-input border border-borde bg-humo px-3 py-2.5 text-tinta focus:border-azul focus:outline-none";
  const claseLabel = "mb-1 block text-xs font-semibold text-grafito";
  const claseError = "mt-1 text-xs text-cancelado";

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderPublico variant="claro" />

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-card bg-white p-8">
          <h1 className="text-center font-display text-xl font-bold text-tinta">
            Creá tu cuenta de dueño
          </h1>
          <p className="mt-1 text-center text-sm text-grafito">
            Después te ayudamos a cargar tu complejo.
          </p>

          <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="nombre" className={claseLabel}>
                Tu nombre
              </label>
              <input
                id="nombre"
                autoComplete="name"
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                aria-invalid={errores.nombre ? true : undefined}
                className={claseInput}
              />
              {errores.nombre && <p className={claseError}>{errores.nombre}</p>}
            </div>

            <div>
              <label htmlFor="email" className={claseLabel}>
                Tu email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                aria-invalid={errores.email ? true : undefined}
                className={claseInput}
              />
              {errores.email && <p className={claseError}>{errores.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className={claseLabel}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errores.password ? true : undefined}
                aria-describedby="password-ayuda"
                className={claseInput}
              />
              <p
                id="password-ayuda"
                className={errores.password ? claseError : "mt-1 text-xs text-grafito"}
              >
                {POLITICA_PASSWORD_DESCRIPCION}.
              </p>
            </div>

            {errorServidor && (
              <p role="alert" className="text-center text-sm text-cancelado">
                {errorServidor}
              </p>
            )}

            <button
              type="submit"
              disabled={registrando}
              className="flex h-12 w-full items-center justify-center rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
            >
              {registrando ? "Creando tu cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-grafito">
            ¿Ya tenés cuenta?{" "}
            <Link href="/ingresar" className="text-azul hover:underline">
              Ingresá
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-grafito">
            ¿Querés reservar como jugador?{" "}
            <Link href="/ingresar" className="text-azul hover:underline">
              Creá tu cuenta acá
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
