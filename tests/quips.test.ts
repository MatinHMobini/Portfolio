import { describe, it, expect } from 'vitest';
import { pickQuip, pickSpeaker, QUIP_COOLDOWN, QUIP_FIRST_DELAY } from '../src/game/quips.ts';
import { THEME_IDS, type Enemy } from '../src/game/level.ts';

const enemy = (x: number, alive = true): Enemy => ({ kind: 'walker', x, y: 0, w: 12, h: 11, vx: 1, minX: 0, maxX: 999, baseY: 0, phase: 0, alive, deadT: 0 });

describe('enemy quips', () => {
  it('always returns a short line for every theme', () => {
    for (const t of THEME_IDS) {
      for (let i = 0; i < 20; i++) {
        const q = pickQuip(t);
        expect(q.length).toBeGreaterThan(3);
        expect(q.length).toBeLessThanOrEqual(30);
      }
    }
  });

  it('picks the nearest living enemy a little ahead of the runner', () => {
    const e = [enemy(40), enemy(200), enemy(120), enemy(130, false)];
    expect(pickSpeaker(e, 50, 16)).toBe(e[2]);
    expect(pickSpeaker([enemy(10)], 50, 16)).toBeNull();
  });

  it('comes up often, with a short gap between jokes', () => {
    expect(QUIP_FIRST_DELAY).toBeGreaterThanOrEqual(5);
    expect(QUIP_COOLDOWN).toBeGreaterThanOrEqual(10);
  });
});
