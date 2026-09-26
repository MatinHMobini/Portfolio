/**
 * Rare enemy one-liners. Every now and then an enemy just ahead of the
 * runner says something in a speech bubble. Kept rare on purpose.
 */
import type { Enemy, ThemeId } from './level.ts';

const GENERAL = [
  'WORKS ON MY MACHINE!',
  'NOT THE HEADSET!',
  'IS THIS PRODUCTION?',
  '404: DODGE NOT FOUND',
  'PLEASE, I HAVE A FAMILY',
  "I'M JUST A BUG, MAN",
  'JUST HIRE MATIN ALREADY',
  'THAT AI IS OVERFITTING',
  'I SHOULD HAVE STUDIED CS',
  "I'M ONLY HERE FOR THE COINS",
  'LAG!! THAT WAS LAG!!',
  'MY LAWYER WILL HEAR OF THIS',
  'GG NO RE',
];

const THEMED: Record<ThemeId, string[]> = {
  night: ['NICE NIGHT FOR A STOMP', 'WHO TURNED OFF THE SUN?'],
  sky: ["I'M AFRAID OF HEIGHTS", 'CLOUD COMPUTING, LITERALLY'],
  mine: ['I DIG THIS PLACE', 'THIS IS MY MINE. MINE!'],
  factory: ['I WORK HERE, BRO', 'CONVEYOR BELT TO NOWHERE'],
  circuit: ['SEGMENTATION FAULT!', 'SOMEONE UNPLUG ME'],
  castle: ["IT'S NOT LAVA, IT'S A FEATURE", 'THE BOSS IS ON LUNCH'],
};

/** Seconds before the first joke, then the minimum gap between jokes. */
export const QUIP_FIRST_DELAY = 12;
export const QUIP_COOLDOWN = 30;
/** After the cooldown, average extra wait (seconds) before the next joke. */
export const QUIP_MEAN_WAIT = 20;
export const QUIP_DURATION = 3;

export function pickQuip(theme: ThemeId, rand = Math.random): string {
  const pool = [...GENERAL, ...THEMED[theme], ...THEMED[theme]];
  return pool[Math.floor(rand() * pool.length)];
}

/** An enemy that is alive, on screen and a little ahead of the runner. */
export function pickSpeaker(enemies: Enemy[], runnerX: number, tile: number): Enemy | null {
  const near = enemies.filter((e) => e.alive && e.x - runnerX > 3 * tile && e.x - runnerX < 14 * tile);
  if (!near.length) return null;
  return near.reduce((a, b) => (a.x < b.x ? a : b));
}
