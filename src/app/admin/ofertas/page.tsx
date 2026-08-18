"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Mail, Send, ShieldAlert } from "lucide-react";
import { HeaderMinimo } from "@/components/saque/header-minimo";
import { ModalPanel } from "@/components/panel/modal-panel";
import { adminMails } from "@/lib/api/endpoints/mails";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { usePerfil } from "@/hooks/api/use-perfil";
import { useHaySesion } from "@/hooks/api/use-sesion";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Broadcast de una oferta de marketing. Herramienta de la PLATAFORMA, no del
 * complejo — por eso vive en /admin y ya no en /panel/configuracion/ofertas.
 *
 * El motivo es el alcance del endpoint, no una preferencia de menú:
 * `POST /api/v1/admin/mails/oferta` le manda el mail a TODOS los usuarios de
 * Saque con opt-in de marketing, sin filtrar por establecimiento. Un dueño que
 * lo disparara le estaría escribiendo a los clientes de los demás complejos.
 * El backend lo sabe y valida rol ADMIN dentro de OfertaMarketingService: a un
 * OWNER le contesta 403. La pantalla estaba gateada por `esDueno`, así que
 * prometía algo que siempre iba a fallar (B5).
 *
 * No hay link a esta pantalla desde ningún lado: se entra por URL. Son un
 * puñado de administradores y no justifica un menú propio.
 *
 * Dos recortes contra lo que mostraba el mock:
 *   - El campo es `cuerpoHtml` y el template lo inserta con `th:utext`, o sea
 *     SIN escapar: lo que se escriba acá llega tal cual al mail. Es HTML, no
 *     texto — un salto de línea no es un párrafo.
 *   - El backend responde 202 con body vacío porque manda en lotes de 50 de
 *     forma asíncrona. No se puede decir "se envió a 412 personas": ese número
 *     no existe del lado del front.
 */
export default function AdminOfertas() {
  const router = useRouter();
  const haySesion = useHaySesion();
  const { data: perfil, isPending } = usePerfil();

  const [asunto, setAsunto] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const esAdmin = perfil?.rol === "ADMIN";

  useEffect(() => {
    if (!haySesion) router.replace("/ingresar");
  }, [haySesion, router]);

  const enviar = useMutation({
    mutationFn: () => adminMails.enviarOferta({ asunto: asunto.trim(), cuerpoHtml }),
    onSuccess: () => {
      setConfirmando(false);
      setAsunto("");
      setCuerpoHtml("");
    },
  });

  if (!haySesion || (isPending && !perfil)) return <div className="min-h-dvh bg-humo" />;

  // Sin redirección: quien llegó acá sabiendo la URL merece saber por qué no
  // puede usarla. Redirigirlo al panel parecería un bug.
  if (!esAdmin) {
    return (
      <div className="flex min-h-dvh flex-col bg-humo">
        <HeaderMinimo />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-sm rounded-card bg-white p-8 text-center shadow-card">
            <ShieldAlert className="mx-auto size-8 text-grafito" aria-hidden />
            <h1 className="mt-3 font-display text-lg font-bold text-tinta">Esto es de administración</h1>
            <p className="mt-2 text-sm text-grafito">
              El envío de ofertas alcanza a todos los usuarios de Saque, no a los clientes de un complejo. Sólo un
              administrador de la plataforma puede dispararlo.
            </p>
          </div>
        </main>
      </div>
    );
  }

  function pedirConfirmacion(e: FormEvent) {
    e.preventDefault();
    if (!asunto.trim() || !cuerpoHtml.trim()) return;
    enviar.reset();
    setConfirmando(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-humo">
      <HeaderMinimo />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-tinta">Enviar oferta</h1>
        <p className="mt-1 text-sm text-grafito">
          Va a todos los usuarios de Saque con opt-in de marketing, de cualquier complejo. No se puede deshacer.
        </p>

        <section className="mt-6 rounded-card bg-white p-6 shadow-card">
          <div className="mb-4 flex items-start gap-2.5">
            <Mail className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
            <div>
              <h2 className="font-display text-lg font-bold text-tinta">Nuevo mail</h2>
              <p className="text-sm text-grafito">Cada destinatario recibe además su link de baja.</p>
            </div>
          </div>

          <form onSubmit={pedirConfirmacion} className="space-y-4">
            <div>
              <label htmlFor="oferta-asunto" className="mb-1 block text-xs font-semibold text-grafito">
                Asunto
              </label>
              <input
                id="oferta-asunto"
                required
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="2x1 en turnos de la tarde este finde"
                className={campoClase}
              />
            </div>

            <div>
              <label htmlFor="oferta-cuerpo" className="mb-1 block text-xs font-semibold text-grafito">
                Cuerpo (HTML)
              </label>
              <textarea
                id="oferta-cuerpo"
                required
                rows={10}
                value={cuerpoHtml}
                onChange={(e) => setCuerpoHtml(e.target.value)}
                placeholder="<p>Este finde, 2x1 en los turnos de la tarde.</p>"
                aria-describedby="oferta-cuerpo-ayuda"
                className={`${campoClase} font-mono text-sm`}
              />
              <p id="oferta-cuerpo-ayuda" className="mt-1 text-xs text-grafito">
                Se inserta tal cual en el mail, sin escapar. Un salto de línea no arma un párrafo: usá
                {" "}<code className="rounded bg-humo px-1">&lt;p&gt;</code>.
              </p>
            </div>

            {cuerpoHtml.trim() !== "" && (
              <div>
                <p className="mb-1 text-xs font-semibold text-grafito">Preview</p>
                {/* En un iframe con sandbox: el preview tiene que renderizar el HTML
                    de verdad para servir de algo, y aislado no puede tocar la página. */}
                <iframe
                  title="Preview del mail"
                  sandbox=""
                  srcDoc={cuerpoHtml}
                  className="h-48 w-full rounded-input border border-borde bg-white"
                />
              </div>
            )}

            {enviar.isError && (
              <div className="flex items-start gap-2 text-sm text-cancelado" role="alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {enviar.error instanceof ApiError ? mensajeVisible(enviar.error) : "No pudimos enviar el mail. Probá de nuevo."}
              </div>
            )}

            {enviar.isSuccess && (
              <p className="text-sm font-semibold text-disponible">
                Encolado. El envío sale en lotes y termina en unos minutos — el backend no informa a cuántos llegó.
              </p>
            )}

            <button
              type="submit"
              disabled={enviar.isPending || !asunto.trim() || !cuerpoHtml.trim()}
              className="flex h-11 items-center gap-1.5 rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
            >
              <Send className="size-4" aria-hidden />
              {enviar.isPending ? "Enviando…" : "Enviar"}
            </button>
          </form>
        </section>
      </main>

      {confirmando && (
        <ModalPanel titulo="Confirmar envío" subtitulo={asunto} onClose={() => setConfirmando(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">
              Este mail sale a todos los usuarios de Saque con opt-in de marketing. No hay forma de frenarlo una vez
              encolado.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => enviar.mutate()}
                disabled={enviar.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-50"
              >
                <Send className="size-4" aria-hidden />
                {enviar.isPending ? "Enviando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
