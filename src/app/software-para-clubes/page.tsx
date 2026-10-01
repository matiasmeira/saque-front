import type { Metadata } from "next";
import { FooterPublico } from "@/components/canche/footer-publico";
import { HeroClubes } from "@/components/landing-clubes/hero-clubes";
import { ModulosClubes } from "@/components/landing-clubes/modulos-clubes";
import { BloqueControl } from "@/components/landing-clubes/bloque-control";
import { PasosAlta } from "@/components/landing-clubes/pasos-alta";
import { FaqClubes } from "@/components/landing-clubes/faq-clubes";
import { CtaClubes } from "@/components/landing-clubes/cta-clubes";

const TITULO = "Software para clubes — Canche.ar";
const DESCRIPCION =
  "Organizá las reservas, canchas, caja y equipo de tu complejo en un solo lugar. Creá tu cuenta, configurá tu complejo y empezá a recibir reservas.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  openGraph: { title: TITULO, description: DESCRIPCION, type: "website" },
};

export default function SoftwareParaClubes() {
  return (
    <div className="flex min-h-dvh flex-col">
      <HeroClubes />
      <ModulosClubes />
      <BloqueControl />
      <PasosAlta />
      <FaqClubes />
      <CtaClubes />
      <FooterPublico ancho="7xl" />
    </div>
  );
}
