import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";

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
        {/*
          Sin Suspense acá a propósito. Un boundary en la raíz arranca el
          streaming en TODAS las rutas, y una vez que el shell salió con 200 ya
          no se puede cambiar el status: notFound() renderiza la pantalla de
          404 pero responde 200, que para la zona pública es un problema de SEO
          (Google indexaría complejos inexistentes).

          Las rutas que sí necesitan boundary — las que usan useSearchParams()
          sin uno propio — lo declaran en su layout: ver app/panel/layout.tsx y
          sus pares en /caja, /ingresar, /mis-reservas, /perfil y /reservar.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
