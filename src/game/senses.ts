/**
 * The runner's "senses": the 8 numbers fed into the neural network
 * every step. All values are normalised to roughly [-1, 1].
 */
import { TILE, RUNNER_W, RUNNER_H, WORLD_H } from './constants.ts';
import { heightAt, type Level } from './level.ts';
import type { Runner } from './physics.ts';

export const SENSE_NAMES = [
  'GAP DIST',
  'GAP WIDTH',
  'ENEMY DIST',
  'ENEMY HEIGHT',
  'COIN ABOVE',
  'WALL AHEAD',
  'ON GROUND',
  'VEL Y',
] as const;

export const ACTION_NAMES = ['RUN', 'JUMP', 'DOUBLE JUMP', 'DIVE', 'DASH'] as const;

export const N_SENSES = SENSE_NAMES.length;
export const N_ACTIONS = ACTION_NAMES.length;

const LOOK = 10; // tiles of look-ahead

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function sense(r: Runner, level: Level, out: Float32Array = new Float32Array(N_SENSES)): Float32Array {
  const front = r.x + RUNNER_W;
  const feetCol = Math.floor((r.x + RUNNER_W / 2) / TILE);
  const feetY = r.y + RUNNER_H;
  const curH = r.onGround ? heightAt(level, feetCol) : Math.max(0, Math.round((WORLD_H - feetY) / TILE));

  // 1-2: next pit and its width.
  let gapDist = 1;
  let gapWidth = 0;
  for (let c = Math.floor(front / TILE); c <= feetCol + LOOK; c++) {
    if (heightAt(level, c) === 0 && c * TILE + TILE > front) {
      gapDist = clamp((c * TILE - front) / (LOOK * TILE), 0, 1);
      let w = 0;
      while (heightAt(level, c + w) === 0 && w < 8) w++;
      gapWidth = clamp(w / 6, 0, 1);
      break;
    }
  }

  // 3-4: nearest living enemy ahead.
  let enemyDist = 1;
  let enemyHeight = 0;
  let best = Infinity;
  for (const e of level.enemies) {
    if (!e.alive) continue;
    if (e.x + e.w < r.x - 2) continue;
    const d = e.x - front;
    if (d > LOOK * TILE) continue;
    if (d < best) {
      best = d;
      enemyDist = clamp(d / (LOOK * TILE), 0, 1);
      enemyHeight = clamp((feetY - (e.y + e.h)) / (4 * TILE), -1, 1);
    }
  }

  // 5: coin ahead and above (positive = above).
  let coin = 0;
  let coinBest = Infinity;
  for (const c of level.coins) {
    if (c.taken) continue;
    const d = c.x - r.x;
    if (d < -4 || d > 4 * TILE) continue;
    if (d < coinBest) {
      coinBest = d;
      coin = clamp((r.y - c.y) / (4 * TILE), -1, 1);
    }
  }

  // 6: how high the ground rises in the next 3 tiles.
  let rise = 0;
  const baseH = curH || heightAt(level, feetCol - 1);
  for (let c = feetCol + 1; c <= feetCol + 3; c++) rise = Math.max(rise, heightAt(level, c) - baseH);
  const wall = clamp(rise / 4, 0, 1);

  out[0] = gapDist;
  out[1] = gapWidth;
  out[2] = enemyDist;
  out[3] = enemyHeight;
  out[4] = coin;
  out[5] = wall;
  out[6] = r.onGround ? 1 : 0;
  out[7] = clamp(r.vy / 600, -1, 1);
  return out;
}

/** Compact labels for small screens. */
export const SENSE_SHORT = ['GAP', 'GAP W', 'ENEMY', 'EN. Y', 'COIN', 'WALL', 'GROUND', 'VEL Y'] as const;
export const ACTION_SHORT = ['RUN', 'JUMP', '2JUMP', 'DIVE', 'DASH'] as const;
