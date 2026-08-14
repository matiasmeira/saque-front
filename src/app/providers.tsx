"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/lib/api/errores";

/**
 * Unico provider de la app. El layout raiz sigue siendo Server Component: solo
 * este componente cruza al cliente.
 *
 * El QueryClient se crea con useState y no a nivel de modulo: en el servidor,
 * un cliente a nivel de modulo se compartiria entre requests de usuarios
 * distintos y filtraria datos de uno a otro.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Los 4xx no mejoran reintentando: un 403 sigue siendo 403, un 400
            // de validacion tambien. Y el back tiene rate limit por identidad
            // (8 logins por email cada 5 min), asi que reintentar castiga.
            retry: (intentos, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return intentos < 2;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
