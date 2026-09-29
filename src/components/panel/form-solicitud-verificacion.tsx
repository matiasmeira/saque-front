"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import {
  normalizarCuit,
  validarSolicitudVerificacion,
  type DatosSolicitudVerificacion,
} from "@/lib/panel/verificacion";
import type { ErroresCampo } from "@/lib/panel/wizard-onboarding";

const campoClase = "w-full rounded-input bg-humo px-3 py-2.5 text-tinta focus:outline-none focus:ring-2 focus:ring-celeste";

/**
 * Los 4 campos de la solicitud de verificación, con useState manual como el
 * resto del proyecto. Se usa tanto para la primera solicitud (PENDIENTE,
 * `datosIniciales` vacío) como para la resolicitud (RECHAZADO,
 * `datosIniciales` precargado con lo que ya había mandado el dueño — no
 * vuelve a tipear los cuatro).
 *
 * Valida en el cliente sólo lo que el backend igual va a rechazar sin llamarlo
 * (obligatorios, forma del CUIT, dominio de la URL); el módulo 11 del CUIT
 * queda para el backend — `error`/`camposInvalidos` son su respuesta tal
 * cual, sin heurísticas.
 */
export function FormSolicitudVerificacion({
  datosIniciales,
  guardando,
  error,
  camposInvalidos,
  textoBoton = "Enviar a revisión",
  onGuardar,
  onBloqueoLocal,
}: {
  datosIniciales?: Partial<DatosSolicitudVerificacion> | null;
  guardando: boolean;
  error: string | null;
  camposInvalidos?: Record<string, string>;
  textoBoton?: string;
  onGuardar: (datos: DatosSolicitudVerificacion) => void;
  /**
   * Se dispara cuando la validación LOCAL bloquea el envío (nunca se llega a
   * llamar a `onGuardar`). El caller lo usa para resetear el estado de error
   * de su mutation (`mutation.reset()`): sin esto, un error de backend de un
   * intento anterior (ej. "El CUIT ingresado no es válido") queda pegado en
   * pantalla junto al error de campo nuevo, porque la mutation nunca se
   * vuelve a invocar y su estado de error no se limpia solo.
   */
  onBloqueoLocal?: () => void;
}) {
  const [cuit, setCuit] = useState(datosIniciales?.cuit ?? "");
  const [razonSocial, setRazonSocial] = useState(datosIniciales?.razonSocial ?? "");
  const [telefonoContacto, setTelefonoContacto] = useState(datosIniciales?.telefonoContacto ?? "");
  const [urlRedSocial, setUrlRedSocial] = useState(datosIniciales?.urlRedSocial ?? "");
  const [erroresLocales, setErroresLocales] = useState<ErroresCampo>({});

  function guardar(e: FormEvent) {
    e.preventDefault();

    const datos: DatosSolicitudVerificacion = {
      cuit: normalizarCuit(cuit),
      razonSocial: razonSocial.trim(),
      telefonoContacto: telefonoContacto.trim(),
      urlRedSocial: urlRedSocial.trim(),
    };

    const errores = validarSolicitudVerificacion(datos);
    if (Object.keys(errores).length > 0) {
      setErroresLocales(errores);
      onBloqueoLocal?.();
      return;
    }
    setErroresLocales({});
    onGuardar(datos);
  }

  const erroresCampo = { ...camposInvalidos, ...erroresLocales };

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-input bg-celeste-suave p-3.5 text-sm text-tinta">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-azul" aria-hidden />
        <p>
          Con estos datos confirmamos que sos un dueño real y que el complejo existe — evita publicaciones
          falsas en el marketplace. Los revisa una persona, no es automático.
        </p>
      </div>

      <div>
        <label htmlFor="verif-cuit" className="mb-1 block text-xs font-semibold text-grafito">
          CUIT
        </label>
        <input
          id="verif-cuit"
          inputMode="numeric"
          placeholder="20-12345678-6"
          value={cuit}
          onChange={(e) => setCuit(e.target.value)}
          className={campoClase}
        />
        {erroresCampo.cuit && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {erroresCampo.cuit}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="verif-razon-social" className="mb-1 block text-xs font-semibold text-grafito">
          Razón social
        </label>
        <input
          id="verif-razon-social"
          value={razonSocial}
          onChange={(e) => setRazonSocial(e.target.value)}
          className={campoClase}
        />
        {erroresCampo.razonSocial && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {erroresCampo.razonSocial}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="verif-telefono" className="mb-1 block text-xs font-semibold text-grafito">
          Teléfono de contacto
        </label>
        <input
          id="verif-telefono"
          type="tel"
          placeholder="11 2345 6789"
          value={telefonoContacto}
          onChange={(e) => setTelefonoContacto(e.target.value)}
          className={campoClase}
        />
        {erroresCampo.telefonoContacto && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {erroresCampo.telefonoContacto}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="verif-url" className="mb-1 block text-xs font-semibold text-grafito">
          Instagram o Facebook del complejo
        </label>
        <input
          id="verif-url"
          placeholder="https://instagram.com/tu-complejo"
          value={urlRedSocial}
          onChange={(e) => setUrlRedSocial(e.target.value)}
          className={campoClase}
        />
        {erroresCampo.urlRedSocial && (
          <p className="mt-1 text-xs text-cancelado" role="alert">
            {erroresCampo.urlRedSocial}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-cancelado" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="flex h-11 items-center justify-center rounded-full bg-azul px-6 font-display text-sm font-bold text-white transition-colors hover:bg-azul-oscuro focus:outline-none focus:ring-2 focus:ring-celeste disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? "Enviando..." : textoBoton}
      </button>
    </form>
  );
}
