import type { ReactNode } from "react";

export function Dato({
  icono,
  etiqueta,
  children,
}: {
  icono?: ReactNode;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-grafito">
        {icono}
        {etiqueta}
      </p>
      <p className="text-tinta">{children}</p>
    </div>
  );
}
