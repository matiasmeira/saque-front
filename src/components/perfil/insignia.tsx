import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function Insignia({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-disponible-suave px-2 py-0.5 text-xs font-semibold text-disponible">
      <CheckCircle2 className="size-3" aria-hidden />
      {children}
    </span>
  );
}
