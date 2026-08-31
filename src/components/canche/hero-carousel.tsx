"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MS_ROTACION = 5000;

const IMAGENES = [
  "/hero/futbol.png",
  "/hero/padel.png",
  "/hero/basket.png",
  "/hero/tenis.png",
  "/hero/basket2.png",
];

/**
 * Fondo fotográfico del hero de la home: rota entre canchas reales.
 * Puramente decorativo (alt="", aria-hidden en el contenedor) — el
 * h1/p de al lado ya dicen todo lo que hace falta.
 */
export function HeroCarousel() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndice((i) => (i + 1) % IMAGENES.length), MS_ROTACION);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden>
      {IMAGENES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === indice ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
