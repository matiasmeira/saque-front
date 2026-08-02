"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Nunca se monta en el servidor (vive dentro de un modal que solo se
 * abre por un click) — no hace falta el cuidado de useSyncExternalStore
 * que sí necesita @/lib/sesion-caja. El SVG que arma "qrcode" es
 * confiable (librería, no input de usuario), por eso el
 * dangerouslySetInnerHTML de acá abajo es seguro.
 */
export function CodigoQR({ valor, tamano = 180 }: { valor: string; tamano?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    QRCode.toString(valor, { type: "svg", margin: 1, color: { dark: "#0A1F3D", light: "#FFFFFF" } })
      .then((resultado) => {
        if (!cancelado) setSvg(resultado);
      })
      .catch(() => {
        if (!cancelado) setSvg(null);
      });
    return () => {
      cancelado = true;
    };
  }, [valor]);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-card bg-white"
      style={{ width: tamano, height: tamano }}
    >
      {svg ? (
        <div className="size-full [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="size-2/3 animate-pulse rounded bg-humo" aria-hidden />
      )}
    </div>
  );
}
