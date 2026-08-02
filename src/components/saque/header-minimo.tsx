import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Isotipo } from "@/components/saque/logo";

/**
 * Header liviano para el flujo de registro (A4). HeaderPublico no
 * aplica acá: "Ingresar" no tiene sentido mientras el jugador está
 * literalmente ingresando, y "Software para negocios" es ruido en
 * medio de un formulario de tres pasos.
 */
export function HeaderMinimo({ volver }: { volver?: string }) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-borde bg-white px-4">
      {volver && (
        <Link
          href={volver}
          aria-label="Volver"
          className="absolute left-2 flex size-10 items-center justify-center rounded-full text-tinta transition-colors hover:bg-humo"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      )}
      <Link href="/" className="flex items-center gap-1.5">
        <Isotipo className="h-5 w-auto" />
        <span className="font-display text-sm font-extrabold tracking-tight text-tinta">saque</span>
      </Link>
    </header>
  );
}
