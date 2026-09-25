import { describe, it, expect } from 'vitest';
import { generateLevel, cloneLevel, THEME_IDS, THEME_PARAMS } from '../src/game/level.ts';
import { createRng, mixSeed } from '../src/game/rng.ts';

describe('seeded level generation', () => {
  it('is deterministic for the same seed and theme', () => {
    for (const t of THEME_IDS) {
      const a = generateLevel(1234, t);
      const b = generateLevel(1234, t);
      expect(Array.from(a.heights)).toEqual(Array.from(b.heights));
      expect(Array.from(a.belts)).toEqual(Array.from(b.belts));
      expect(a.enemies).toEqual(b.enemies);
      expect(a.coins).toEqual(b.coins);
    }
  });

  it('differs for different seeds', () => {
    const a = generateLevel(1, 'mine');
    const b = generateLevel(2, 'mine');
    expect(Array.from(a.heights)).not.toEqual(Array.from(b.heights));
  });

  it('has a safe flat start, a runway to the finish, and heights within the theme limit', () => {
    for (const t of THEME_IDS) {
      for (let s = 0; s < 20; s++) {
        const lv = generateLevel(mixSeed(s, 77), t, 200);
        expect(lv.cols).toBe(200);
        for (let c = 0; c < 14; c++) expect(lv.heights[c]).toBe(2);
        for (let c = lv.finishCol; c < lv.cols; c++) expect(lv.heights[c]).toBeGreaterThan(0);
        for (const h of lv.heights) {
          expect(h).toBeGreaterThanOrEqual(0);
          expect(h).toBeLessThanOrEqual(THEME_PARAMS[t].maxH);
        }
        // Gaps are never wider than the theme allows.
        let run = 0;
        for (const h of lv.heights) {
          run = h === 0 ? run + 1 : 0;
          expect(run).toBeLessThanOrEqual(THEME_PARAMS[t].gapMax);
        }
      }
    }
  });

  it('only factory levels have conveyor belts', () => {
    expect(generateLevel(5, 'night').belts.some((b) => b !== 0)).toBe(false);
    const any = [1, 2, 3, 4, 5].some((s) => generateLevel(s, 'factory').belts.some((b) => b !== 0));
    expect(any).toBe(true);
  });

  it('clones mutable state so episodes cannot affect the template', () => {
    const lv = generateLevel(8, 'circuit');
    const copy = cloneLevel(lv);
    copy.enemies.forEach((e) => (e.alive = false));
    copy.coins.forEach((c) => (c.taken = true));
    expect(lv.enemies.every((e) => e.alive)).toBe(true);
    expect(lv.coins.every((c) => !c.taken)).toBe(true);
  });
});

describe('rng', () => {
  it('repeats sequences for a seed and stays in range', () => {
    const a = createRng(5);
    const b = createRng(5);
    for (let i = 0; i < 100; i++) {
      const v = a.next();
      expect(v).toBe(b.next());
      expect(v >= 0 && v < 1).toBe(true);
    }
    const r = createRng(9);
    for (let i = 0; i < 100; i++) {
      const n = r.int(3, 6);
      expect(n >= 3 && n <= 6).toBe(true);
    }
  });

  it('produces roughly standard normal samples', () => {
    const r = createRng(1);
    let sum = 0;
    let sq = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const g = r.gauss();
      sum += g;
      sq += g * g;
    }
    expect(Math.abs(sum / n)).toBeLessThan(0.08);
    expect(Math.abs(sq / n - 1)).toBeLessThan(0.1);
  });
});
