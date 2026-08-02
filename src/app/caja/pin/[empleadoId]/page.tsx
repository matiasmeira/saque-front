"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PantallaKiosco } from "@/components/caja/pantalla-kiosco";
import { TecladoNumerico } from "@/components/caja/teclado-numerico";
import { iniciarSesionEmpleado, useEmparejado } from "@/lib/sesion-caja";
import { MAX_INTENTOS_PIN, BLOQUEO_PIN_SEGUNDOS } from "@/mocks/dispositivos";
import { PANEL_EMPLEADOS, type Empleado, type Permiso } from "@/mocks/empleados";

// A qué pantalla del panel entra según lo primero que pueda ver —
// mismo espíritu que el fallback de C2/C5 (agenda.tsx, clientes/
// page.tsx), pero acá elegido una sola vez, al loguearse, no en cada
// pantalla.
const RUTA_POR_PERMISO: { permiso: Permiso; ruta: string }[] = [
  { permiso: "ver_agenda", ruta: "/panel/agenda" },
  { permiso: "ver_clientes", ruta: "/panel/clientes" },
  { permiso: "vender_buffet", ruta: "/panel/buffet/vender" },
  { permiso: "ver_stock_buffet", ruta: "/panel/buffet/productos" },
];

function primeraRutaPermitida(empleado: Empleado): string {
  return RUTA_POR_PERMISO.find((r) => empleado.permisos.includes(r.permiso))?.ruta ?? "/panel/agenda";
}

// El PIN se valida contra el empleado ya elegido en /caja (nombres) —
// por eso un PIN incorrecto solo dice "incorrecto", nunca distingue
// "esta persona no existe" de "existe pero el PIN está mal": mismo
// mensaje neutro para las dos, y entrar directo con un id inválido
// (o sin la PC emparejada) redirige en silencio, sin pistas.
// TODO backend: validar el PIN y el rate limit vienen de la API —
// acá el bloqueo tras varios intentos es una simulación de 20s fija.
export default function PinCaja({ params }: { params: Promise<{ empleadoId: string }> }) {
  const { empleadoId } = use(params);
  const router = useRouter();
  const emparejado = useEmparejado();
  const empleado = PANEL_EMPLEADOS.find((e) => e.id === empleadoId && e.estado === "activo") ?? null;

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  // Ojo acá: "!emparejado" NUNCA dispara una navegación por su cuenta
  // — solo decide qué se renderiza más abajo. useEmparejado() lee
  // localStorage con useSyncExternalStore, que en una navegación dura
  // (recarga, o entrar directo por URL) puede devolver el valor
  // neutro "false" en el primer render antes de reconciliar con el
  // real; si esa lectura transitoria disparara un router.replace acá,
  // la redirección ya salió y no hay reconciliación que la deshaga.
  // "!empleado" sí puede navegar: sale de PANEL_EMPLEADOS, nunca del
  // navegador, así que no tiene ese problema.
  useEffect(() => {
    if (!empleado) router.replace("/caja");
  }, [empleado, router]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const id = setTimeout(() => {
      setSegundosRestantes(segundosRestantes - 1);
      if (segundosRestantes === 1) setIntentos(0);
    }, 1000);
    return () => clearTimeout(id);
  }, [segundosRestantes]);

  const bloqueado = segundosRestantes > 0;

  function verificar(intento: string, empleadoActual: Empleado) {
    if (intento === empleadoActual.pin) {
      iniciarSesionEmpleado(empleadoActual.id);
      router.push(primeraRutaPermitida(empleadoActual));
      return;
    }
    const nuevosIntentos = intentos + 1;
    setIntentos(nuevosIntentos);
    setError(true);
    setPin("");
    if (nuevosIntentos >= MAX_INTENTOS_PIN) setSegundosRestantes(BLOQUEO_PIN_SEGUNDOS);
  }

  function agregarDigito(digito: string) {
    if (bloqueado || !empleado || pin.length >= 4) return;
    const nuevo = pin + digito;
    setPin(nuevo);
    setError(false);
    if (nuevo.length === 4) verificar(nuevo, empleado);
  }

  function borrarDigito() {
    if (bloqueado) return;
    setPin((p) => p.slice(0, -1));
    setError(false);
  }

  if (!emparejado || !empleado) return <div className="min-h-dvh bg-tinta" />;

  return (
    <PantallaKiosco>
      <button
        type="button"
        onClick={() => router.push("/caja")}
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-[#9DB6D6] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        No soy {empleado.nombre.split(" ")[0]}
      </button>

      <h1 className="mb-1 text-center font-display text-2xl font-bold text-white">Hola, {empleado.nombre.split(" ")[0]}</h1>
      <p className="mb-8 text-center text-sm text-[#9DB6D6]">Ingresá tu PIN</p>

      {bloqueado ? (
        <div className="rounded-card bg-white/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-white">Demasiados intentos</p>
          <p className="mt-1 text-sm text-[#9DB6D6]">Probá en unos minutos — quedan {segundosRestantes}s.</p>
        </div>
      ) : (
        <>
          {error && (
            <p className="mb-4 text-center text-sm font-semibold text-cancelado" role="alert">
              PIN incorrecto. Probá de nuevo.
            </p>
          )}
          <TecladoNumerico valor={pin} onDigito={agregarDigito} onBorrar={borrarDigito} />
        </>
      )}
    </PantallaKiosco>
  );
}
