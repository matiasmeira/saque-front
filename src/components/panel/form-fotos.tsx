"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { GripVertical, Star, Trash2, Upload, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ModalPanel } from "@/components/panel/modal-panel";
import { establecimientos as endpointEstablecimientos } from "@/lib/api/endpoints/establecimientos";
import { ApiError, mensajeVisible } from "@/lib/api/errores";
import { keys } from "@/lib/api/keys";
import { miniatura } from "@/lib/imagekit";
import type { FotoEstablecimiento } from "@/lib/api/tipos/establecimientos";

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

type ArchivoPendiente = {
  id: string;
  nombre: string;
  progreso: number;
  error: string | null;
};

function validar(archivo: File): string | null {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WEBP.";
  if (archivo.size > TAMANO_MAXIMO) return "El archivo no puede pesar más de 5MB.";
  return null;
}

/**
 * Cada acción (subir, borrar, reordenar) pega directo a su propio endpoint —
 * a diferencia de las otras secciones de Configuración, acá no hay un
 * "Guardar" que mande el establecimiento entero.
 *
 * Las fotos son un sub-recurso propio (`GET /establecimientos/{id}/fotos`):
 * NO vienen embebidas en `EstablecimientoResponse`, así que el componente
 * las trae por su cuenta en vez de recibirlas por props, y es dueño de su
 * propia query key para invalidarla después de cada mutación.
 *
 * Las subidas se procesan de a una desde una cola propia (no una por evento
 * de selección/drop): así dos tandas de archivos elegidas rápido una tras
 * otra igual se suben en serie, no en paralelo.
 */
export function FormFotos({ establecimientoId }: { establecimientoId: number }) {
  const queryClient = useQueryClient();
  const [pendientes, setPendientes] = useState<ArchivoPendiente[]>([]);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const [aBorrar, setABorrar] = useState<FotoEstablecimiento | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [ordenLocal, setOrdenLocal] = useState<FotoEstablecimiento[] | null>(null);

  const colaRef = useRef<{ id: string; archivo: File }[]>([]);
  const procesandoRef = useRef(false);
  const indiceArrastrado = useRef<number | null>(null);

  const consulta = useQuery({
    queryKey: keys.establecimientos.fotos(establecimientoId),
    queryFn: () => endpointEstablecimientos.listarFotos(establecimientoId),
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: keys.establecimientos.fotos(establecimientoId) });

  const borrar = useMutation({
    mutationFn: (foto: FotoEstablecimiento) => endpointEstablecimientos.borrarFoto(establecimientoId, foto.fileId),
    onSuccess: () => {
      invalidar();
      setABorrar(null);
    },
    onError: (e) => setErrorGeneral(e instanceof ApiError ? mensajeVisible(e) : "No pudimos borrar la foto."),
  });

  const reordenar = useMutation({
    mutationFn: (fileIds: string[]) => endpointEstablecimientos.ordenarFotos(establecimientoId, fileIds),
    onSuccess: () => {
      // La query recién invalidada ya trae el orden nuevo: soltar el
      // snapshot optimista para no taparle una subida o un borrado
      // posterior con una foto que ya no está en la lista real.
      setOrdenLocal(null);
      invalidar();
    },
    onError: (e) => {
      setOrdenLocal(null);
      setErrorGeneral(e instanceof ApiError ? mensajeVisible(e) : "No pudimos reordenar las fotos.");
    },
  });

  const fotos = consulta.data ?? [];
  const listado = ordenLocal ?? fotos;

  async function procesarCola() {
    if (procesandoRef.current) return;
    procesandoRef.current = true;

    while (colaRef.current.length > 0) {
      const item = colaRef.current.shift()!;
      try {
        await endpointEstablecimientos.subirFoto(establecimientoId, item.archivo, (fraccion) => {
          setPendientes((prev) => prev.map((p) => (p.id === item.id ? { ...p, progreso: fraccion } : p)));
        });
        setPendientes((prev) => prev.filter((p) => p.id !== item.id));
        invalidar();
      } catch (e) {
        const mensaje = e instanceof ApiError ? mensajeVisible(e) : "No pudimos subir la foto.";
        setPendientes((prev) => prev.map((p) => (p.id === item.id ? { ...p, error: mensaje } : p)));
      }
    }

    procesandoRef.current = false;
  }

  function encolarArchivos(archivos: File[]) {
    setErrorGeneral(null);
    for (const archivo of archivos) {
      const id = crypto.randomUUID();
      const error = validar(archivo);
      setPendientes((prev) => [...prev, { id, nombre: archivo.name, progreso: 0, error }]);
      if (!error) colaRef.current.push({ id, archivo });
    }
    procesarCola();
  }

  function onSeleccionar(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length) encolarArchivos(archivos);
  }

  function onDropArchivos(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setArrastrandoArchivo(false);
    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length) encolarArchivos(archivos);
  }

  function onDropFoto(e: DragEvent<HTMLDivElement>, indice: number) {
    e.preventDefault();
    const desde = indiceArrastrado.current;
    indiceArrastrado.current = null;
    if (desde === null || desde === indice) return;

    const copia = [...listado];
    const [movida] = copia.splice(desde, 1);
    copia.splice(indice, 0, movida);
    setOrdenLocal(copia);
    reordenar.mutate(copia.map((f) => f.fileId));
  }

  function descartarPendiente(id: string) {
    setPendientes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      {errorGeneral && (
        <p role="alert" className="text-sm text-cancelado">
          {errorGeneral}
        </p>
      )}

      {consulta.isPending && <p className="text-sm text-grafito">Cargando fotos...</p>}

      {consulta.isError && (
        <p role="alert" className="text-sm text-cancelado">
          {consulta.error instanceof ApiError ? mensajeVisible(consulta.error) : "No pudimos cargar las fotos."}
        </p>
      )}

      {listado.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {listado.map((foto, indice) => (
            <div
              key={foto.fileId}
              draggable
              onDragStart={() => (indiceArrastrado.current = indice)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropFoto(e, indice)}
              className="group relative aspect-[3/2] cursor-grab overflow-hidden rounded-input bg-humo active:cursor-grabbing"
            >
              <img src={miniatura(foto.url)} alt="Foto del complejo" className="size-full object-cover" draggable={false} />

              {indice === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-tinta/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Star className="size-3" aria-hidden />
                  Principal
                </span>
              )}

              <GripVertical
                className="absolute right-1.5 top-1.5 size-4 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
                aria-hidden
              />

              <button
                type="button"
                onClick={() => setABorrar(foto)}
                aria-label="Borrar foto"
                className="absolute bottom-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-tinta/70 text-white opacity-0 transition-opacity hover:bg-cancelado group-hover:opacity-100"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="space-y-2">
          {pendientes.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-input bg-humo px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-tinta">{p.nombre}</span>
              {p.error ? (
                <span className="text-xs font-semibold text-cancelado">{p.error}</span>
              ) : (
                <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-borde">
                  <div className="h-full bg-azul transition-all" style={{ width: `${Math.round(p.progreso * 100)}%` }} />
                </div>
              )}
              <button
                type="button"
                onClick={() => descartarPendiente(p.id)}
                aria-label="Descartar"
                className="shrink-0 text-grafito hover:text-tinta"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrandoArchivo(true);
        }}
        onDragLeave={() => setArrastrandoArchivo(false)}
        onDrop={onDropArchivos}
        className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed text-center transition-colors ${
          arrastrandoArchivo ? "border-azul bg-celeste-suave/40" : "border-borde bg-humo hover:border-azul"
        }`}
      >
        <Upload className="size-5 text-grafito" aria-hidden />
        <span className="text-sm font-semibold text-tinta">Arrastrá tus fotos acá o hacé click para elegir</span>
        <span className="text-xs text-grafito">JPG, PNG o WEBP. Hasta 5MB por foto.</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onSeleccionar}
        />
      </label>

      {aBorrar && (
        <ModalPanel titulo="Borrar foto" onClose={() => setABorrar(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tinta">Esta foto se va a borrar del complejo. La acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setABorrar(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-borde font-display text-sm font-bold text-grafito transition-colors hover:bg-humo focus:outline-none focus:ring-2 focus:ring-celeste"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => borrar.mutate(aBorrar)}
                disabled={borrar.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-cancelado font-display text-sm font-bold text-white transition-colors hover:bg-cancelado/90 focus:outline-none focus:ring-2 focus:ring-celeste disabled:opacity-60"
              >
                {borrar.isPending ? "Borrando..." : "Borrar"}
              </button>
            </div>
          </div>
        </ModalPanel>
      )}
    </div>
  );
}
