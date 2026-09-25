/**
 * Runner physics and collisions. Pure functions over plain data so
 * the exact same code runs in the browser, in the Training Lab worker
 * and in the headless trainer (scripts/train.ts).
 */
import {
  TILE, WORLD_H, DT, GRAVITY, MAX_FALL, RUN_MAX, RUN_ACCEL, JUMP_V, DOUBLE_JUMP_V,
  DIVE_V, DASH_V, DASH_TIME, DASH_COOLDOWN, STOMP_BOUNCE, DOUBLE_JUMP_DELAY,
  BELT_SPEED, RUNNER_W, RUNNER_H, ENEMY_SPEED,
} from './constants.ts';
import { heightAt, surfaceY, type Level } from './level.ts';

export interface Action {
  /** -1..1, fraction of max run speed (the AI only uses 0.3..1). */
  speed: number;
  jump: boolean;
  doubleJump: boolean;
  dive: boolean;
  dash: boolean;
}

export const IDLE_ACTION: Action = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };

/** Bit flags describing what happened during one physics step. */
export const EV = {
  JUMP: 1,
  DOUBLE_JUMP: 2,
  DIVE: 4,
  DASH: 8,
  LAND: 16,
  STOMP: 32,
  COIN: 64,
  DIE: 128,
  FINISH: 256,
  GAP_CLEARED: 512,
  WALL_CLIMB: 1024,
  BLOCKED: 2048,
  SMASH: 4096,
} as const;

export interface Runner {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  jumpsUsed: number;
  airTime: number;
  dashT: number;
  dashCd: number;
  diving: boolean;
  dead: boolean;
  finished: boolean;
  /** Furthest x reached (fitness). */
  maxX: number;
  coins: number;
  stomps: number;
  steps: number;
  /** Ground height (tiles) at take-off, for wall-climb detection. */
  takeoffH: number;
  /** Whether the current jump passed over a pit. */
  overPit: boolean;
  /** Facing direction for rendering. */
  face: 1 | -1;
  /** Events raised in the last step (EV flags). */
  events: number;
}

export function createRunner(x = 3 * TILE, level?: Level): Runner {
  const col = Math.floor((x + RUNNER_W / 2) / TILE);
  const h = level ? heightAt(level, col) || 2 : 2;
  return {
    x,
    y: surfaceY(h) - RUNNER_H,
    vx: 0,
    vy: 0,
    onGround: true,
    jumpsUsed: 0,
    airTime: 0,
    dashT: 0,
    dashCd: 0,
    diving: false,
    dead: false,
    finished: false,
    maxX: x,
    coins: 0,
    stomps: 0,
    steps: 0,
    takeoffH: h,
    overPit: false,
    face: 1,
    events: 0,
  };
}

/** Highest ground (smallest y) under the horizontal span [x0, x1). */
export function groundUnder(level: Level, x0: number, x1: number): number {
  const c0 = Math.floor(x0 / TILE);
  const c1 = Math.floor((x1 - 0.001) / TILE);
  let best = Infinity;
  for (let c = c0; c <= c1; c++) best = Math.min(best, surfaceY(heightAt(level, c)));
  return best;
}

/** Advance enemies by one step (patrol / bob). */
export function stepEnemies(level: Level, time: number): void {
  for (const e of level.enemies) {
    if (!e.alive) {
      e.deadT += DT;
      continue;
    }
    e.x += e.vx * ENEMY_SPEED * DT;
    if (e.x < e.minX) {
      e.x = e.minX;
      e.vx = 1;
    } else if (e.x > e.maxX) {
      e.x = e.maxX;
      e.vx = -1;
    }
    if (e.kind === 'flyer') e.y = e.baseY + Math.sin(time * 2.2 + e.phase) * 7;
  }
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * Advance the runner one fixed step. Enemies should be stepped
 * separately (once per step, shared by all runners in a population).
 * When `invulnerable` is true, enemy contact does not kill (used for
 * the respawn blink on the site).
 */
export function stepRunner(r: Runner, level: Level, a: Action, invulnerable = false): number {
  let ev = 0;
  if (r.dead || r.finished) {
    r.events = 0;
    return 0;
  }
  r.steps++;

  // Horizontal speed.
  const target = Math.max(-1, Math.min(1, a.speed)) * RUN_MAX;
  if (r.dashCd > 0) r.dashCd -= DT;
  if (a.dash && r.dashCd <= 0 && r.dashT <= 0) {
    r.dashT = DASH_TIME;
    r.dashCd = DASH_COOLDOWN;
    ev |= EV.DASH;
  }
  if (r.dashT > 0) {
    r.dashT -= DT;
    r.vx = DASH_V * (a.speed < 0 ? -1 : 1);
  } else if (r.vx < target) {
    r.vx = Math.min(target, r.vx + RUN_ACCEL * DT);
  } else if (r.vx > target) {
    r.vx = Math.max(target, r.vx - RUN_ACCEL * DT);
  }
  if (r.vx > 1) r.face = 1;
  else if (r.vx < -1) r.face = -1;

  // Jumps.
  if (r.onGround && a.jump) {
    r.vy = -JUMP_V;
    r.onGround = false;
    r.jumpsUsed = 1;
    r.airTime = 0;
    r.takeoffH = Math.round((WORLD_H - (r.y + RUNNER_H)) / TILE);
    r.overPit = false;
    r.diving = false;
    ev |= EV.JUMP;
  } else if (!r.onGround && a.doubleJump && r.jumpsUsed < 2 && r.airTime > DOUBLE_JUMP_DELAY) {
    if (r.jumpsUsed === 0) r.takeoffH = Math.round((WORLD_H - (r.y + RUNNER_H)) / TILE);
    r.vy = -DOUBLE_JUMP_V;
    r.jumpsUsed = 2;
    r.diving = false;
    ev |= EV.DOUBLE_JUMP;
  }
  if (!r.onGround && a.dive && !r.diving && r.vy > -120) {
    r.diving = true;
    ev |= EV.DIVE;
  }

  // Gravity.
  if (!r.onGround) r.airTime += DT;
  r.vy += GRAVITY * DT;
  if (r.diving) r.vy = Math.max(r.vy, DIVE_V);
  r.vy = Math.min(r.vy, r.diving ? DIVE_V + 60 : MAX_FALL);

  // Conveyor belts push the runner while standing on them.
  let beltPush = 0;
  if (r.onGround) {
    const col = Math.floor((r.x + RUNNER_W / 2) / TILE);
    if (col >= 0 && col < level.cols) beltPush = level.belts[col] * BELT_SPEED;
  }

  // Move X with wall collision.
  let nx = r.x + (r.vx + beltPush) * DT;
  if (nx < 0) {
    nx = 0;
    r.vx = 0;
  }
  const feet = r.y + RUNNER_H;
  if (r.vx + beltPush > 0) {
    const col = Math.floor((nx + RUNNER_W - 0.001) / TILE);
    if (surfaceY(heightAt(level, col)) < feet - 0.5) {
      nx = col * TILE - RUNNER_W;
      r.vx = 0;
      r.dashT = 0;
      ev |= EV.BLOCKED;
    }
  } else if (r.vx + beltPush < 0) {
    const col = Math.floor(nx / TILE);
    if (surfaceY(heightAt(level, col)) < feet - 0.5) {
      nx = (col + 1) * TILE;
      r.vx = 0;
      r.dashT = 0;
    }
  }
  r.x = nx;

  // Move Y with ground collision.
  const ny = r.y + r.vy * DT;
  const ground = groundUnder(level, r.x, r.x + RUNNER_W);
  if (!Number.isFinite(ground) && !r.onGround) r.overPit = true;
  if (r.vy >= 0 && feet <= ground + 0.5 && ny + RUNNER_H >= ground) {
    r.y = ground - RUNNER_H;
    if (!r.onGround) {
      ev |= EV.LAND;
      const landH = Math.round((WORLD_H - ground) / TILE);
      if (r.overPit) ev |= EV.GAP_CLEARED;
      if (landH - r.takeoffH >= 2) ev |= EV.WALL_CLIMB;
    }
    r.vy = 0;
    r.onGround = true;
    r.jumpsUsed = 0;
    r.airTime = 0;
    r.diving = false;
    r.overPit = false;
  } else {
    if (r.onGround) {
      // Walked off an edge: counts as airborne without using a jump.
      r.takeoffH = Math.round((WORLD_H - feet) / TILE);
      r.airTime = 0;
    }
    r.y = ny;
    r.onGround = false;
  }

  // Fell into a pit.
  if (r.y > WORLD_H + 24) {
    r.dead = true;
    ev |= EV.DIE;
  }

  // Enemies.
  if (!r.dead) {
    for (const e of level.enemies) {
      if (!e.alive) continue;
      if (!overlaps(r.x, r.y, RUNNER_W, RUNNER_H, e.x, e.y, e.w, e.h)) continue;
      const prevFeet = feet;
      if (r.dashT > 0) {
        // A dash smashes straight through enemies.
        e.alive = false;
        e.deadT = 0;
        r.stomps++;
        ev |= EV.SMASH;
      } else if (r.vy > 0 && prevFeet <= e.y + 7) {
        e.alive = false;
        e.deadT = 0;
        r.vy = -STOMP_BOUNCE;
        r.onGround = false;
        r.diving = false;
        r.jumpsUsed = 1;
        r.airTime = DOUBLE_JUMP_DELAY;
        r.stomps++;
        ev |= EV.STOMP;
      } else if (r.vy < 0 && r.y - r.vy * DT >= e.y + e.h - 6) {
        // Head-bonk from below knocks the enemy out.
        e.alive = false;
        e.deadT = 0;
        r.vy = 60;
        r.stomps++;
        ev |= EV.STOMP;
      } else if (!invulnerable) {
        r.dead = true;
        ev |= EV.DIE;
        break;
      }
    }
  }

  // Coins.
  for (const c of level.coins) {
    if (c.taken) continue;
    if (overlaps(r.x - 2, r.y - 2, RUNNER_W + 4, RUNNER_H + 4, c.x, c.y, 8, 8)) {
      c.taken = true;
      r.coins++;
      ev |= EV.COIN;
    }
  }

  if (r.x > r.maxX) r.maxX = r.x;
  if (!r.dead && r.x >= level.finishCol * TILE) {
    r.finished = true;
    ev |= EV.FINISH;
  }
  r.events = ev;
  return ev;
}
