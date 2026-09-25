/**
 * Turns network outputs into game actions, and runs whole episodes
 * (one runner, one level) for training and evaluation.
 */
import { DT, TILE } from '../game/constants.ts';
import { cloneLevel, type Level } from '../game/level.ts';
import { createRunner, stepEnemies, stepRunner, type Action, type Runner } from '../game/physics.ts';
import { sense, N_SENSES } from '../game/senses.ts';
import { forward, type Network } from './network.ts';

export function outputsToAction(out: ArrayLike<number>, action: Action): Action {
  action.speed = 0.3 + 0.7 * out[0];
  action.jump = out[1] > 0.5;
  action.doubleJump = out[2] > 0.5;
  action.dive = out[3] > 0.5;
  action.dash = out[4] > 0.5;
  return action;
}

export interface EpisodeResult {
  distance: number;
  coins: number;
  stomps: number;
  died: boolean;
  finished: boolean;
  steps: number;
  fitness: number;
}

/** Fitness: distance (tiles) + coins + stomps, minus a death penalty, plus a finishing bonus. */
export function fitnessOf(r: Runner, level: Level): number {
  const dist = r.maxX / TILE;
  let f = dist + r.coins * 2 + r.stomps * 3;
  if (r.dead) f -= 15;
  if (r.finished) f += 100 + Math.max(0, (level.cols * 4 - r.steps * DT * 10) / 10);
  return Math.max(0, f);
}

/** Max number of steps an episode may take (about 1 minute for a 260 col level). */
export function stepLimit(level: Level): number {
  return Math.ceil(level.cols * 14);
}

/**
 * Run one runner on a fresh copy of `level` until it dies, finishes,
 * gets stuck or times out.
 */
export function runEpisode(net: Network, level: Level): EpisodeResult {
  const lv = cloneLevel(level);
  const r = createRunner(3 * TILE, lv);
  const input = new Float32Array(N_SENSES);
  const action: Action = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };
  const limit = stepLimit(lv);
  let lastProgressX = r.x;
  let stuckSteps = 0;
  let time = 0;
  while (!r.dead && !r.finished && r.steps < limit) {
    stepEnemies(lv, time);
    time += DT;
    sense(r, lv, input);
    outputsToAction(forward(net, input), action);
    stepRunner(r, lv, action);
    if (r.maxX > lastProgressX + TILE) {
      lastProgressX = r.maxX;
      stuckSteps = 0;
    } else if (++stuckSteps > 180) {
      break; // no progress for 3 seconds
    }
  }
  return {
    distance: r.maxX / TILE,
    coins: r.coins,
    stomps: r.stomps,
    died: r.dead,
    finished: r.finished,
    steps: r.steps,
    fitness: fitnessOf(r, lv),
  };
}
