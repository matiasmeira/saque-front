"use client";

import { useState } from "react";
import Link from "next/link";

import { DialogoConvertirEnDueno } from "@/components/perfil/convertir-en-dueno";
import { usePerfil } from "@/hooks/api/use-perfil";
import { accionCtaClub } from "@/lib/convertir-en-dueno";

/**
 * Botón principal de la landing de clubes. Mientras el perfil carga (o sin
 * sesión) muestra el destino de un anónimo: es el único que no depende del rol.
 * `className` trae el estilo (hero y cierre difieren en tamaño).
 */
export function BotonCuentaClub({ className }: { className: string }) {
  const { data: perfil } = usePerfil();
  const [dialogo, setDialogo] = useState(false);
  const accion = accionCtaClub(perfil?.rol);

  if (accion === "convertir") {
    return (
      <>
        <button type="button" onClick={() => setDialogo(true)} className={className}>
          Registrar mi complejo
        </button>
        {dialogo && <DialogoConvertirEnDueno onClose={() => setDialogo(false)} />}
      </>
    );
  }
  if (accion === "panel") {
    return (
      <Link href="/panel/agenda" className={className}>
        Ir a mi panel
      </Link>
    );
  }
  if (accion === "admin") {
    return (
      <Link href="/admin/ofertas" className={className}>
        Ir al panel de administración
      </Link>
    );
  }
  return (
    <Link href="/registro/dueno" className={className}>
      Crear cuenta para mi club
    </Link>
  );
}
