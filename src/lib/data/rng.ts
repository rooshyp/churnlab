/**
 * Deterministic seeded RNG (mulberry32) so the synthetic dataset is stable
 * across server restarts and between server/client renders.
 */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof createRng>;

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function float(rng: Rng, min: number, max: number, decimals = 2): number {
  const v = rng() * (max - min) + min;
  const p = Math.pow(10, decimals);
  return Math.round(v * p) / p;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
