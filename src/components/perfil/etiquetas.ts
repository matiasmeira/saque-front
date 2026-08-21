import type { PlanSuscripcion, Role } from "@/lib/api/tipos/comunes";

export const PLANES: Record<PlanSuscripcion, string> = {
  TRIAL: "Prueba gratuita",
  FREE: "Gratuito",
  PREMIUM: "Premium",
};

export const ROLES: Record<Role, string> = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  PLAYER: "Jugador",
};
