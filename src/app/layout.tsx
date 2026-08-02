import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
