"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, Mail, Send } from "lucide-react";
import { SidebarPanel } from "@/components/panel/sidebar-panel";
import { HeaderPanel } from "@/components/panel/header-panel";
import { ModalPanel } from "@/components/panel/modal-panel";
import { useRolPanel } from "@/lib/rol-panel";
import { useBloqueadoPorCaja } from "@/lib/permisos";
import { simularLlamada } from "@/lib/mock-api";
import { PANEL_COMPLEJO } from "@/mocks/agenda";

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

type Resultado = { ok: true; cantidad: number } | { ok: false };

function Seccion({ icono: Icono, titulo, descripcion, children }: { icono: typeof Mail; titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-white p-6 shadow-card">
      <div className="mb-4 flex items-start gap-2.5">
        <Icono className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
        <div>
          <h2 className="font-display text-lg font-bold text-tinta">{titulo}</h2>
          <p className="text-sm text-grafito">{descripcion}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// Solo dueño — mismo guard que el resto de Configuración.
export default function PanelOfertas() {
  const router = useRouter();
  const rol = useRolPanel();
  const bloqueadoPorCaja = useBloqueadoPorCaja();

  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!bloqueadoPorCaja && rol === "empleado") router.replace("/panel/agenda");
  }, [bloqueadoPorCaja, rol, router]);

  if (bloqueadoPorCaja || rol === "empleado") return <div className="min-h-dvh bg-humo" />;

  function pedirConfirmacion(e: FormEvent) {
    e.preventDefault();
    if (!asunto.trim() || !cuerpo.trim()) return;
    setConfirmando(true);
  }

  function confirmarEnvio() {
    setConfirmando(false);
    setEnviando(true);
    setResultado(null);
    // TODO backend: POST /admin/mails/oferta { asunto, cuerpo } → cantidad enviada
    simularLlamada<Resultado>({ ok: true, cantidad: 412 }, 700).then((res) => {
      setResultado(res);
      setEnviando(false);
    });
  }

  return (
    <div className="flex h-dvh bg-humo">
      <SidebarPanel />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPanel nombre={PANEL_COMPLEJO.nombre} estado={PANEL_COMPLEJO.estado} diasRestantesTrial={PANEL_COMPLEJO.diasRestantesTrial} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
          <Link href="/panel/configuracion" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-grafito hover:text-tinta">
            <ChevronLeft className="size-4" aria-hidden />
            Configuración
          </Link>

          <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-tinta">Enviar ofertas</h1>

          <div className="max-w-2xl space-y-6">
            <Seccion icono={Mail} titulo="Nuevo mail" descripcion="Se manda a todos los que no se dieron de baja de mails de ofertas.">
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
                    Cuerpo
                  </label>
                  <textarea
                    id="oferta-cuerpo"
                    required
                    rows={8}
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    className={campoClase}
                  />
                </div>

                {(asunto.trim() || cuerpo.trim()) && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-grafito">Preview</p>
                    <div className="rounded-input bg-humo p-4">
                      <p className="font-display font-bold text-tinta">{asunto || "(sin asunto)"}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-grafito">{cuerpo || "(sin cuerpo)"}</p>
                    </div>
                  </div>
                )}

                {resultado?.ok === false && (
                  <div className="flex items-center gap-2 text-sm text-cancelado" role="alert">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden />
                    No pudimos enviar el mail. Probá de nuevo.
                  </div>
                )}

                {resultado?.ok === true && (
                  <p className="text-sm font-semibold text-disponible">Se envió a {resultado.cantidad} suscriptos.</p>
                )}

                <button
                  type="submit"
                  disabled={enviando || !asunto.trim() || !cuerpo.trim()}
                  className="flex h-11 items-center gap-1.5 rounded-full bg-azul px-5 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-grafito"
                >
                  <Send className="size-4" aria-hidden />
                  {enviando ? "Enviando..." : resultado?.ok === false ? "Reintentar" : "Enviar"}
                </button>
              </form>
            </Seccion>
          </div>
        </main>
      </div>

      {confirmando && (
        <ModalPanel titulo="Confirmar envío" onClose={() => setConfirmando(false)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">Vas a enviar este mail a todos los suscriptos. ¿Confirmás?</p>
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
                onClick={confirmarEnvio}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-azul font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                <Send className="size-4" aria-hidden />
                Confirmar
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
