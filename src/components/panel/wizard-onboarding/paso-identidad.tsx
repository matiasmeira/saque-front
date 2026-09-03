"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trash2, Upload } from "lucide-react";
import { SelectorUbicacion, type Ubicacion } from "@/components/canche/selector-ubicacion";
import { geocodificarDireccion } from "@/lib/api/georef";
import { SERVICIOS } from "@/lib/servicios";
import { calcularSlugPreview, validarPasoIdentidad, type DatosPasoIdentidad } from "@/lib/panel/wizard-onboarding";
import type { Servicio } from "@/lib/api/tipos/comunes";

const MapaUbicacion = dynamic(
  () => import("@/components/canche/mapa-ubicacion").then((mod) => mod.MapaUbicacion),
  { ssr: false },
);

const campoClase =
  "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

const MS_DEBOUNCE_DIRECCION = 400;
const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

type FotoEnCola = { id: string; archivo: File; previewUrl: string };

export function PasoIdentidad({
  datosIniciales,
  onContinuar,
}: {
  datosIniciales: DatosPasoIdentidad | null;
  onContinuar: (datos: DatosPasoIdentidad) => void;
}) {
  const [nombre, setNombre] = useState(datosIniciales?.nombre ?? "");
  const [direccion, setDireccion] = useState(datosIniciales?.direccion ?? "");
  const [servicios, setServicios] = useState<Servicio[]>(datosIniciales?.servicios ?? []);
  // Si el dueño vuelve "Atrás" desde el paso 2, las fotos que ya había
  // elegido se re-hidratan acá (con URLs de preview nuevas) en vez de
  // perderse — datosIniciales.fotos son los mismos File, sólo hace falta
  // volver a armarles la miniatura.
  const [fotos, setFotos] = useState<FotoEnCola[]>(() =>
    (datosIniciales?.fotos ?? []).map((archivo) => ({
      id: crypto.randomUUID(),
      archivo,
      previewUrl: URL.createObjectURL(archivo),
    })),
  );
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [pin, setPin] = useState<{
    lat: number;
    lng: number;
    direccion: string;
    provincia?: string;
    departamento?: string;
  } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [arrastrando, setArrastrando] = useState(false);

  const [direccionDebounced, setDireccionDebounced] = useState(direccion.trim());
  useEffect(() => {
    const id = setTimeout(() => setDireccionDebounced(direccion.trim()), MS_DEBOUNCE_DIRECCION);
    return () => clearTimeout(id);
  }, [direccion]);

  // Al desmontar (avanzar de paso o salir del wizard) se liberan los blob: URL
  // de las miniaturas — si no, quedan colgados hasta recargar la página.
  useEffect(() => {
    return () => {
      fotos.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pinVigente =
    pin && pin.direccion === direccionDebounced && pin.provincia === ubicacion?.provincia && pin.departamento === ubicacion?.departamento
      ? pin
      : null;

  function moverPin(coords: { lat: number; lng: number }) {
    setPin({ ...coords, direccion: direccionDebounced, provincia: ubicacion?.provincia, departamento: ubicacion?.departamento });
  }

  const direccionGeocodificada = useQuery({
    queryKey: ["georef", "direccion", direccionDebounced, ubicacion?.provincia, ubicacion?.departamento],
    queryFn: ({ signal }) =>
      geocodificarDireccion(direccionDebounced, { provincia: ubicacion!.provincia!, departamento: ubicacion?.departamento }, signal),
    enabled: direccionDebounced.length >= 5 && Boolean(ubicacion?.provincia),
    staleTime: 60 * 60_000,
    retry: false,
  });
  const geocodificado = direccionGeocodificada.data;

  const coords =
    pinVigente ??
    (geocodificado ? { lat: geocodificado.lat, lng: geocodificado.lng } : null) ??
    (ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : null);

  const slugPreview = calcularSlugPreview(nombre);

  function alternarServicio(valor: Servicio) {
    setServicios((prev) => (prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]));
  }

  function agregarFotos(archivos: File[]) {
    const nuevas = archivos
      .filter((a) => TIPOS_ACEPTADOS.includes(a.type) && a.size <= TAMANO_MAXIMO)
      .map((archivo) => ({ id: crypto.randomUUID(), archivo, previewUrl: URL.createObjectURL(archivo) }));
    setFotos((prev) => [...prev, ...nuevas]);
  }

  function quitarFoto(id: string) {
    setFotos((prev) => {
      const objetivo = prev.find((f) => f.id === id);
      if (objetivo) URL.revokeObjectURL(objetivo.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function onSeleccionarArchivos(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length) agregarFotos(archivos);
  }

  function onDropArchivos(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastrando(false);
    agregarFotos(Array.from(e.dataTransfer.files));
  }

  function continuar(e: FormEvent) {
    e.preventDefault();
    const erroresValidacion = validarPasoIdentidad({ nombre, direccion, coords });
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    onContinuar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud: coords!.lat,
      longitud: coords!.lng,
      servicios,
      fotos: fotos.map((f) => f.archivo),
    });
  }

  return (
    <form onSubmit={continuar} className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-tinta">Identidad del complejo</h2>
        <p className="mt-1 text-sm text-grafito">Contanos los datos básicos de tu establecimiento.</p>
      </div>

      <div>
        <label htmlFor="wizard-nombre" className="mb-1 block text-xs font-semibold text-grafito">
          Nombre del complejo
        </label>
        <input
          id="wizard-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Club Atlético Pilar"
          className={campoClase}
        />
        {errores.nombre && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.nombre}
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 block text-xs font-semibold text-grafito">Enlace de reserva</p>
        <p className="rounded-input bg-humo px-3 py-2.5 text-sm text-grafito">
          saque.app/complejo/<span className="font-semibold text-tinta">{slugPreview}</span>
        </p>
        <p className="mt-1 text-xs text-grafito">Se genera solo a partir del nombre — no se puede editar.</p>
      </div>

      <div>
        <label htmlFor="wizard-direccion" className="mb-1 block text-xs font-semibold text-grafito">
          Dirección
        </label>
        <input
          id="wizard-direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Calle Falsa 123, Pilar, Buenos Aires"
          className={campoClase}
        />
        {errores.direccion && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.direccion}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="wizard-ubicacion" className="mb-1 block text-xs font-semibold text-grafito">
          Localidad
        </label>
        <div className="rounded-input bg-humo px-3 py-1.5">
          <SelectorUbicacion id="wizard-ubicacion" value={ubicacion} onChange={setUbicacion} />
        </div>
        <p className="mt-1 text-xs text-grafito">
          {pinVigente
            ? `Ajustaste el pin a mano: se va a guardar ahí (${pinVigente.lat.toFixed(4)}, ${pinVigente.lng.toFixed(4)}).`
            : direccionGeocodificada.isFetching
              ? "Buscando la dirección exacta…"
              : geocodificado
                ? `Se va a guardar en ${geocodificado.etiqueta} (${geocodificado.lat.toFixed(4)}, ${geocodificado.lng.toFixed(4)}).`
                : ubicacion
                  ? `No encontramos esa calle: se va a guardar cerca del centro de ${ubicacion.etiqueta}. Arrastrá el pin para afinarlo.`
                  : "Buscá la localidad donde está el complejo."}
        </p>
        {errores.ubicacion && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {errores.ubicacion}
          </p>
        )}
        {coords && (
          <div className="mt-3 h-56 w-full overflow-hidden rounded-input">
            <MapaUbicacion lat={coords.lat} lng={coords.lng} onMover={moverPin} />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-grafito">Servicios disponibles</p>
        <div className="flex flex-wrap gap-2">
          {SERVICIOS.map(({ valor, etiqueta, Icono }) => {
            const activo = servicios.includes(valor);
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => alternarServicio(valor)}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-celeste ${
                  activo ? "bg-celeste-suave text-tinta" : "border border-borde bg-white text-grafito hover:border-azul hover:text-azul"
                }`}
              >
                <Icono className="size-4 shrink-0" aria-hidden />
                {etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-grafito">Fotos del complejo</p>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={onDropArchivos}
          className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed text-center transition-colors ${
            arrastrando ? "border-azul bg-celeste-suave/40" : "border-borde bg-humo hover:border-azul"
          }`}
        >
          <Upload className="size-5 text-grafito" aria-hidden />
          <span className="text-sm font-semibold text-tinta">Arrastrá tus fotos acá o hacé click para elegir</span>
          <span className="text-xs text-grafito">JPG, PNG o WEBP. Hasta 5MB por foto.</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onSeleccionarArchivos} />
        </label>
        <p className="mt-1 text-xs text-grafito">
          Se suben apenas se crea el complejo, al confirmar el paso 2 — no hace falta esperar acá.
        </p>

        {fotos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fotos.map((f) => (
              <div key={f.id} className="group relative aspect-[4/3] overflow-hidden rounded-input border border-borde">
                <img src={f.previewUrl} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFoto(f.id)}
                  aria-label="Quitar foto"
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-tinta/70 text-white opacity-0 transition-opacity hover:bg-cancelado group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste"
        >
          Continuar
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
