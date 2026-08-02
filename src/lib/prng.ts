/**
 * PRNG determinístico (mulberry32) sembrado por un hash simple de
 * texto — mismos inputs, siempre el mismo resultado. Lo usan los
 * generadores de mocks que necesitan variedad "real" sin escribir
 * cada fila a mano (turnos en agenda.ts, historial de reservas en
 * clientes.ts).
 */
export function hashSeed(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function crearRand(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
