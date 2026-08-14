import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

// Archivo: titulares. Public Sans: interfaz y cuerpo.
// Next descarga y auto-hospeda las fuentes, asi que no hay
// pedido a Google en runtime ni salto de texto al cargar.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saque — Reservá tu cancha en 30 segundos",
  description:
    "Encontrá canchas de fútbol, pádel y tenis cerca tuyo y reservá al instante. Sin llamadas ni WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body className={`${archivo.variable} ${publicSans.variable}`}>
        <Providers>
          {/*
            17 de las 20 páginas que usan useSearchParams() no tienen boundary
            propio — todas las de /panel lo usan de forma transitiva a través de
            useRolPanel()/usePermisos(). Sin un Suspense por encima, el
            prerender estático de `next build` falla con
            "missing-suspense-with-csr-bailout" y corta el build entero.

            Este boundary raíz es deliberadamente amplio: desbloquea el build
            sin tocar pantallas que se migran en fases posteriores. A medida
            que cada pantalla se conecte, conviene bajarle el boundary a su
            propio subárbol para no perder el HTML estático de toda la página.
          */}
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
