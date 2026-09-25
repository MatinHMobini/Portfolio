/**
 * Small, fast, seeded pseudo-random number generator (mulberry32).
 * Every part of the simulation that must be reproducible (level
 * generation, training) uses this instead of Math.random.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** Standard normal sample (mean 0, std 1). */
  gauss(): number;
  /** Pick a random element. */
  pick<T>(items: readonly T[]): T;
  /** Current internal state (lets a generator be resumed). */
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  let spare: number | null = null;

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    gauss: () => {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      // Box-Muller transform.
      let u = 0;
      while (u === 0) u = next();
      const v = next();
      const mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v);
      return mag * Math.cos(2 * Math.PI * v);
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    state: () => s,
  };
}

/** Hash two numbers into a new 32-bit seed (for deriving sub-seeds). */
export function mixSeed(a: number, b: number): number {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b >>> 0), 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
