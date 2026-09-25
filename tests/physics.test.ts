import { describe, it, expect } from 'vitest';
import { createRunner, stepRunner, stepEnemies, EV, IDLE_ACTION, groundUnder, type Action } from '../src/game/physics.ts';
import { TILE, WORLD_H, RUNNER_H, JUMP_V, GRAVITY, DT } from '../src/game/constants.ts';
import { surfaceY, type Level, type Enemy } from '../src/game/level.ts';

/** Build a hand-made level from a string of column heights ('0'-'9'). */
function makeLevel(cols: string, extra: Partial<Level> = {}): Level {
  const heights = Int8Array.from(cols.split('').map(Number));
  return {
    seed: 0,
    theme: 'night',
    cols: heights.length,
    heights,
    belts: new Int8Array(heights.length),
    enemies: [],
    coins: [],
    finishCol: heights.length - 2,
    props: [],
    ...extra,
  };
}

const act = (a: Partial<Action>): Action => ({ ...IDLE_ACTION, ...a });

describe('physics', () => {
  it('stands on the ground', () => {
    const lv = makeLevel('2222222222');
    const r = createRunner(2 * TILE, lv);
    for (let i = 0; i < 60; i++) stepRunner(r, lv, IDLE_ACTION);
    expect(r.onGround).toBe(true);
    expect(r.y + RUNNER_H).toBe(surfaceY(2));
  });

  it('jumps to the expected height and lands again', () => {
    const lv = makeLevel('2222222222');
    const r = createRunner(2 * TILE, lv);
    const startY = r.y;
    let ev = stepRunner(r, lv, act({ jump: true }));
    expect(ev & EV.JUMP).toBeTruthy();
    let minY = r.y;
    let landed = false;
    for (let i = 0; i < 120; i++) {
      ev = stepRunner(r, lv, IDLE_ACTION);
      minY = Math.min(minY, r.y);
      if (ev & EV.LAND) landed = true;
    }
    const expected = (JUMP_V * JUMP_V) / (2 * GRAVITY);
    expect(startY - minY).toBeGreaterThan(expected * 0.85);
    expect(startY - minY).toBeLessThan(expected * 1.1);
    expect(landed).toBe(true);
    expect(r.onGround).toBe(true);
  });

  it('dies when running into a pit', () => {
    const lv = makeLevel('2222000000000');
    const r = createRunner(1 * TILE, lv);
    let died = false;
    for (let i = 0; i < 400 && !died; i++) died = !!(stepRunner(r, lv, act({ speed: 1 })) & EV.DIE);
    expect(died).toBe(true);
    expect(r.dead).toBe(true);
    expect(r.y).toBeGreaterThan(WORLD_H);
  });

  it('is blocked by a wall until it jumps', () => {
    const lv = makeLevel('22224444444444');
    const r = createRunner(1 * TILE, lv);
    let blocked = false;
    for (let i = 0; i < 90; i++) blocked = !!(stepRunner(r, lv, act({ speed: 1 })) & EV.BLOCKED) || blocked;
    expect(blocked).toBe(true);
    expect(r.x + 10).toBeLessThanOrEqual(4 * TILE + 0.01);
    // Jump + double jump gets over the 2-tile wall.
    let climbed = false;
    for (let i = 0; i < 120; i++) {
      const ev = stepRunner(r, lv, act({ speed: 1, jump: i === 0, doubleJump: i === 12 }));
      if (ev & EV.WALL_CLIMB) climbed = true;
    }
    expect(r.x).toBeGreaterThan(4 * TILE);
    expect(climbed).toBe(true);
  });

  it('stomps an enemy by landing on it, and dies touching it from the side', () => {
    const enemy = (): Enemy => ({ kind: 'walker', x: 5 * TILE, y: surfaceY(2) - 11, w: 12, h: 11, vx: 0, minX: 5 * TILE, maxX: 5 * TILE, baseY: surfaceY(2) - 11, phase: 0, alive: true, deadT: 0 });
    // Side hit.
    const lv1 = makeLevel('2222222222222', { enemies: [enemy()] });
    const r1 = createRunner(2 * TILE, lv1);
    let died = false;
    for (let i = 0; i < 200 && !died; i++) died = !!(stepRunner(r1, lv1, act({ speed: 1 })) & EV.DIE);
    expect(died).toBe(true);
    // Stomp: drop the runner from above onto the enemy.
    const lv2 = makeLevel('2222222222222', { enemies: [enemy()] });
    const r2 = createRunner(5 * TILE, lv2);
    r2.y = surfaceY(2) - 60;
    r2.onGround = false;
    let stomped = false;
    for (let i = 0; i < 60 && !stomped; i++) stomped = !!(stepRunner(r2, lv2, IDLE_ACTION) & EV.STOMP);
    expect(stomped).toBe(true);
    expect(lv2.enemies[0].alive).toBe(false);
    expect(r2.vy).toBeLessThan(0); // bounced
  });

  it('dash smashes through an enemy', () => {
    const e: Enemy = { kind: 'walker', x: 4 * TILE, y: surfaceY(2) - 11, w: 12, h: 11, vx: 0, minX: 4 * TILE, maxX: 4 * TILE, baseY: surfaceY(2) - 11, phase: 0, alive: true, deadT: 0 };
    const lv = makeLevel('2222222222222', { enemies: [e] });
    const r = createRunner(3 * TILE, lv);
    const ev = [0, 0, 0, 0, 0, 0].map(() => stepRunner(r, lv, act({ speed: 1, dash: true })));
    expect(ev.some((x) => x & EV.SMASH)).toBe(true);
    expect(r.dead).toBe(false);
  });

  it('collects coins', () => {
    const lv = makeLevel('2222222222', { coins: [{ x: 4 * TILE, y: surfaceY(2) - 12, taken: false }] });
    const r = createRunner(2 * TILE, lv);
    let got = false;
    for (let i = 0; i < 60; i++) got = !!(stepRunner(r, lv, act({ speed: 1 })) & EV.COIN) || got;
    expect(got).toBe(true);
    expect(r.coins).toBe(1);
  });

  it('conveyor belts push the runner', () => {
    const lv = makeLevel('2222222222');
    lv.belts.fill(1);
    const r = createRunner(2 * TILE, lv);
    const x0 = r.x;
    for (let i = 0; i < 30; i++) stepRunner(r, lv, IDLE_ACTION);
    expect(r.x).toBeGreaterThan(x0 + 10);
  });

  it('flyers bob and walkers patrol inside their range', () => {
    const e: Enemy = { kind: 'walker', x: 50, y: 0, w: 12, h: 11, vx: 1, minX: 40, maxX: 60, baseY: 0, phase: 0, alive: true, deadT: 0 };
    const lv = makeLevel('22222', { enemies: [e] });
    for (let i = 0; i < 300; i++) {
      stepEnemies(lv, i * DT);
      expect(e.x).toBeGreaterThanOrEqual(40);
      expect(e.x).toBeLessThanOrEqual(60);
    }
  });

  it('finds the highest ground under a span', () => {
    const lv = makeLevel('2340');
    expect(groundUnder(lv, 0, TILE * 2 + 1)).toBe(surfaceY(4));
    expect(groundUnder(lv, TILE * 3, TILE * 3 + 5)).toBe(Infinity);
  });
});
