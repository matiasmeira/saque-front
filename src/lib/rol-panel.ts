import { useSearchParams } from "next/navigation";
import { useEmparejado, useEmpleadoIdSesion } from "@/lib/sesion-caja";

export type RolPanel = "dueno" | "empleado";

// TODO backend: el rol viene de la sesión real del panel (JWT/cookie).
// Mientras tanto se resuelve, en orden: ?rol=... en la URL (atajo de
// prueba, manda si está presente), la sesión de caja persistida en
// este navegador (@/lib/sesion-caja — el login real por PIN en /caja),
// o si el dispositivo está emparejado como caja sin nadie logueado.
//
// ESE ÚLTIMO CASO ES A PROPÓSITO "empleado", NUNCA "dueño": activar
// un dispositivo como caja (C9 → Dispositivos, o completar un
// emparejamiento por link) es precisamente lo que cierra el acceso
// implícito de dueño en esa PC — ver la Parte de seguridad de la
// zona E en la spec. Sin esto, cualquiera frente a una caja recién
// emparejada y sin nadie logueado heredaba dueño por default, que es
// el agujero de seguridad que esto cierra.
export function useRolPanel(): RolPanel {
  const searchParams = useSearchParams();
  const empleadoIdSesion = useEmpleadoIdSesion();
  const emparejado = useEmparejado();

  const rolParam = searchParams.get("rol");
  if (rolParam === "empleado") return "empleado";
  if (rolParam === "dueno") return "dueno";
  if (empleadoIdSesion) return "empleado";
  if (emparejado) return "empleado";
  return "dueno";
}
