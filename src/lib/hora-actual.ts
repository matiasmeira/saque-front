import { useEffect, useState } from "react";

/**
 * Hora "actual" reactiva, para la línea de "ahora" de la agenda
 * (C2). Se actualiza cada minuto — más frecuencia no aporta nada a
 * una línea horizontal.
 */
export function useHoraActual(): Date {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return ahora;
}
