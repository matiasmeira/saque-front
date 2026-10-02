"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { ModalPanel } from "@/components/panel/modal-panel";
import { useConvertirEnDueno } from "@/hooks/api/use-perfil";
import { mensajeVisible } from "@/lib/api/errores";
import { DESTINO_TRAS_CONVERTIR } from "@/lib/convertir-en-dueno";

/**
 * Confirmación para pasar la cuenta de jugador a dueño. La mutación vive acá
 * adentro: al cerrar el diálogo se desmonta y un error viejo no reaparece.
 * El push va después de que la mutación resolvió, o sea después del
 * setQueryData del perfil: el wizard monta ya con rol OWNER.
 */
export function DialogoConvertirEnDueno({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const convertir = useConvertirEnDueno();

  async function confirmar() {
    try {
      await convertir.mutateAsync();
    } catch {
      return; // el error se muestra desde convertir.error; el diálogo sigue abierto
    }
    router.push(DESTINO_TRAS_CONVERTIR);
  }

  return (
    <ModalPanel titulo="¿Convertir tu cuenta en cuenta de dueño?" onClose={onClose}>
      <div className="space-y-3 text-sm text-grafito">
        <p>
          Seguís entrando con el mismo email y la misma contraseña. Una cuenta de dueño no puede
          reservar canchas como jugador ni tiene la sección Mis reservas: tus reservas anteriores
          quedan guardadas, pero dejás de verlas desde la app.
        </p>
        <p>
          Después te llevamos a cargar tu complejo. Tu mes de prueba gratis arranca cuando aprobemos tu
          complejo.
        </p>
        <p>Desde la app no se puede volver a cuenta de jugador.</p>
      </div>

      {convertir.error && (
        <p role="alert" className="mt-3 text-sm text-cancelado">
          {mensajeVisible(convertir.error)}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-11 flex-1 rounded-full border border-borde text-sm font-semibold text-grafito transition-colors hover:border-azul hover:text-azul"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={convertir.isPending}
          className="h-11 flex-1 rounded-full bg-azul text-sm font-bold text-white transition-colors hover:bg-azul-oscuro disabled:opacity-50"
        >
          {convertir.isPending ? "Convirtiendo…" : "Convertir mi cuenta"}
        </button>
      </div>
    </ModalPanel>
  );
}

/** Tarjeta de /perfil para jugadores: abre el diálogo de conversión. */
export function ConvertirEnDueno() {
  const [abierto, setAbierto] = useState(false);

  return (
    <section className="mt-6 rounded-card bg-white p-6 sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-tinta">
        <Building2 className="size-[18px] text-azul" aria-hidden />
        ¿Tenés un complejo?
      </h2>
      <p className="mt-3 text-sm text-grafito">
        Convertí tu cuenta en cuenta de dueño y cargá tus canchas en Canche.ar.
      </p>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro"
      >
        Registrar mi complejo
      </button>

      {abierto && <DialogoConvertirEnDueno onClose={() => setAbierto(false)} />}
    </section>
  );
}
