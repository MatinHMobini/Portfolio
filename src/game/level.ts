/**
 * Deterministic, seeded level generation. A level is a row of tile
 * columns, each with a ground height (0 means a pit), plus enemies,
 * coins and optional conveyor belts. The same code generates levels
 * for the browser and for the offline trainer.
 */
import { TILE, ROWS, WORLD_H } from './constants.ts';
import { createRng, type Rng } from './rng.ts';

export type ThemeId = 'night' | 'sky' | 'mine' | 'factory' | 'circuit' | 'castle';

export const THEME_IDS: readonly ThemeId[] = ['night', 'sky', 'mine', 'factory', 'circuit', 'castle'];

export type EnemyKind = 'walker' | 'flyer';

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  /** For flyers: the centre height they bob around. */
  baseY: number;
  phase: number;
  alive: boolean;
  /** Seconds since death (for the squash animation). */
  deadT: number;
}

export interface Coin {
  x: number;
  y: number;
  taken: boolean;
}

export interface Level {
  seed: number;
  theme: ThemeId;
  cols: number;
  /** Ground height in tiles per column; 0 = pit. */
  heights: Int8Array;
  /** Conveyor belt direction per column (-1, 0, 1). */
  belts: Int8Array;
  enemies: Enemy[];
  coins: Coin[];
  /** Column where the goal flag stands. */
  finishCol: number;
  /** Tiles where decorative props can go (torches, ore, gears...). */
  props: { col: number; kind: number }[];
}

export interface ThemeParams {
  gapChance: number;
  gapMin: number;
  gapMax: number;
  stepChance: number;
  stepMax: number;
  pillarChance: number;
  enemyChance: number;
  flyerShare: number;
  coinChance: number;
  beltChance: number;
}

export const THEME_PARAMS: Record<ThemeId, ThemeParams> = {
  night: { gapChance: 0.22, gapMin: 2, gapMax: 3, stepChance: 0.25, stepMax: 1, pillarChance: 0.08, enemyChance: 0.25, flyerShare: 0, coinChance: 0.45, beltChance: 0 },
  sky: { gapChance: 0.38, gapMin: 2, gapMax: 5, stepChance: 0.25, stepMax: 2, pillarChance: 0.05, enemyChance: 0.2, flyerShare: 0.6, coinChance: 0.55, beltChance: 0 },
  mine: { gapChance: 0.18, gapMin: 2, gapMax: 3, stepChance: 0.4, stepMax: 2, pillarChance: 0.2, enemyChance: 0.35, flyerShare: 0.4, coinChance: 0.45, beltChance: 0 },
  factory: { gapChance: 0.25, gapMin: 2, gapMax: 4, stepChance: 0.25, stepMax: 2, pillarChance: 0.15, enemyChance: 0.3, flyerShare: 0.2, coinChance: 0.4, beltChance: 0.45 },
  circuit: { gapChance: 0.26, gapMin: 2, gapMax: 4, stepChance: 0.3, stepMax: 2, pillarChance: 0.15, enemyChance: 0.45, flyerShare: 0.45, coinChance: 0.45, beltChance: 0 },
  castle: { gapChance: 0.32, gapMin: 2, gapMax: 5, stepChance: 0.3, stepMax: 2, pillarChance: 0.18, enemyChance: 0.35, flyerShare: 0.3, coinChance: 0.4, beltChance: 0 },
};

/** Y coordinate (game px, downward) of the top of ground with height h tiles. */
export function surfaceY(h: number): number {
  return h <= 0 ? Infinity : WORLD_H - h * TILE;
}

/** Ground height at a column; outside the level the edge heights continue. */
export function heightAt(level: Level, col: number): number {
  if (col < 0) return level.heights[0];
  if (col >= level.cols) return level.heights[level.cols - 1];
  return level.heights[col];
}

function makeEnemy(kind: EnemyKind, x: number, groundY: number, minX: number, maxX: number, rng: Rng): Enemy {
  const w = kind === 'walker' ? 12 : 12;
  const h = kind === 'walker' ? 11 : 9;
  const baseY = kind === 'walker' ? groundY - h : groundY - h - TILE * rng.range(1.7, 2.6);
  return {
    kind,
    x,
    y: baseY,
    w,
    h,
    vx: rng.chance(0.5) ? -1 : 1,
    minX,
    maxX,
    baseY,
    phase: rng.range(0, Math.PI * 2),
    alive: true,
    deadT: 0,
  };
}

/**
 * Generate a level. `cols` is the length in tiles. The generator lays
 * down "features" (flat runs, gaps, steps, pillars, belts) and then
 * decorates flat stretches with enemies and coins. Difficulty ramps up
 * slightly along the level.
 */
export function generateLevel(seed: number, theme: ThemeId, cols = 260): Level {
  const rng = createRng(seed);
  const p = THEME_PARAMS[theme];
  const heights = new Int8Array(cols);
  const belts = new Int8Array(cols);
  const baseH = 2;
  let h = baseH;
  let c = 0;

  const fill = (n: number, height: number) => {
    for (let i = 0; i < n && c < cols; i++, c++) heights[c] = height;
  };

  // Safe start.
  fill(14, h);

  const finishCol = cols - 8;
  while (c < finishCol - 6) {
    const progress = c / cols;
    const roll = rng.next();
    if (roll < p.gapChance) {
      const maxW = Math.min(p.gapMax, p.gapMin + Math.floor(progress * (p.gapMax - p.gapMin + 1)) + 1);
      const w = rng.int(p.gapMin, Math.max(p.gapMin, maxW));
      fill(w, 0);
      // Landing platform height can shift a little.
      if (rng.chance(0.35)) h = clampH(h + rng.int(-1, 1));
      fill(rng.int(3, 6), h);
    } else if (roll < p.gapChance + p.stepChance) {
      const d = rng.int(1, p.stepMax) * (rng.chance(h <= baseH ? 0.75 : 0.45) ? 1 : -1);
      h = clampH(h + d);
      fill(rng.int(4, 8), h);
    } else if (roll < p.gapChance + p.stepChance + p.pillarChance) {
      const ph = clampH(h + rng.int(1, 2 + (progress > 0.5 ? 1 : 0)));
      fill(rng.int(1, 2), ph);
      fill(rng.int(4, 6), h);
    } else {
      const n = rng.int(4, 9);
      const start = c;
      fill(n, h);
      if (p.beltChance > 0 && rng.chance(p.beltChance)) {
        const dir = rng.chance(0.6) ? 1 : -1;
        for (let i = start + 1; i < c - 1; i++) belts[i] = dir;
      }
    }
  }
  // Flat finish runway.
  while (c < cols) {
    heights[c] = h;
    c++;
  }

  const level: Level = {
    seed,
    theme,
    cols,
    heights,
    belts,
    enemies: [],
    coins: [],
    finishCol,
    props: [],
  };

  // Decorate: find flat runs (same height, no pits) and place enemies/coins.
  let runStart = 0;
  for (let i = 1; i <= cols; i++) {
    if (i === cols || heights[i] !== heights[runStart]) {
      const runLen = i - runStart;
      const rh = heights[runStart];
      if (rh > 0 && runStart > 16 && runStart < finishCol - 4) {
        const gy = surfaceY(rh);
        if (runLen >= 5 && rng.chance(p.enemyChance)) {
          const kind: EnemyKind = rng.chance(p.flyerShare) ? 'flyer' : 'walker';
          const minX = (runStart + 1) * TILE;
          const maxX = (i - 1) * TILE - 12;
          const x = rng.range(minX, Math.max(minX, maxX));
          level.enemies.push(makeEnemy(kind, x, gy, minX, maxX, rng));
        }
        if (runLen >= 3 && rng.chance(p.coinChance)) {
          const n = Math.min(runLen - 1, rng.int(2, 4));
          const lift = rng.chance(0.5) ? 1.2 : 2.6;
          for (let k = 0; k < n; k++) {
            level.coins.push({ x: (runStart + 1 + k) * TILE + 4, y: gy - TILE * lift - 8, taken: false });
          }
        }
        if (rng.chance(0.5)) level.props.push({ col: runStart + rng.int(0, runLen - 1), kind: rng.int(0, 3) });
      } else if (rh === 0 && runLen >= 2 && runStart > 14 && rng.chance(p.coinChance * 0.8)) {
        // Coin arc over a gap rewards jumping.
        const prevH = heights[runStart - 1] || 2;
        const gy = surfaceY(prevH);
        for (let k = 0; k < runLen; k++) {
          const t = (k + 0.5) / runLen;
          const arc = Math.sin(t * Math.PI) * TILE * 1.6;
          level.coins.push({ x: (runStart + k) * TILE + 4, y: gy - TILE * 1.4 - arc, taken: false });
        }
      }
      runStart = i;
    }
  }
  return level;
}

function clampH(h: number): number {
  return Math.max(1, Math.min(6, h));
}

/** Deep-copy the mutable parts of a level so an episode can run on a fresh copy. */
export function cloneLevel(level: Level): Level {
  return {
    ...level,
    enemies: level.enemies.map((e) => ({ ...e })),
    coins: level.coins.map((c) => ({ ...c })),
  };
}

/** Row count re-exported for renderers. */
export const LEVEL_ROWS = ROWS;
