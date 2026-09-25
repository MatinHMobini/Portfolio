/**
 * Neuroevolution: a genetic algorithm over neural network weights.
 *
 * Each generation:
 *   1. every genome (a flat weight vector) is scored by a fitness function,
 *   2. the best few are copied unchanged (elitism),
 *   3. the rest are bred: parents are picked by tournament selection,
 *      combined with neuron-level crossover, then mutated with gaussian noise.
 *
 * Used offline by scripts/train.ts and live by the Training Lab worker.
 */
import type { Rng } from '../game/rng.ts';
import { paramCount } from './network.ts';

export interface GaOptions {
  populationSize: number;
  eliteCount: number;
  tournamentSize: number;
  crossoverRate: number;
  /** Probability that each weight is perturbed. */
  mutationRate: number;
  /** Standard deviation of the gaussian perturbation. */
  mutationStd: number;
  /** Probability that a weight is replaced by a fresh random value. */
  resetRate: number;
}

export const DEFAULT_GA: GaOptions = {
  populationSize: 100,
  eliteCount: 4,
  tournamentSize: 3,
  crossoverRate: 0.6,
  mutationRate: 0.1,
  mutationStd: 0.35,
  resetRate: 0.01,
};

export function randomGenome(layers: readonly number[], rng: Rng): Float32Array {
  const g = new Float32Array(paramCount(layers));
  let off = 0;
  for (let l = 1; l < layers.length; l++) {
    const nIn = layers[l - 1];
    const scale = 1 / Math.sqrt(nIn); // Xavier-style init
    for (let j = 0; j < layers[l]; j++) {
      for (let i = 0; i <= nIn; i++) g[off++] = rng.gauss() * scale * (i === nIn ? 0.5 : 1.4);
    }
  }
  return g;
}

export function randomPopulation(layers: readonly number[], size: number, rng: Rng): Float32Array[] {
  return Array.from({ length: size }, () => randomGenome(layers, rng));
}

function tournament(fitness: ArrayLike<number>, k: number, rng: Rng): number {
  let best = rng.int(0, fitness.length - 1);
  for (let i = 1; i < k; i++) {
    const c = rng.int(0, fitness.length - 1);
    if (fitness[c] > fitness[best]) best = c;
  }
  return best;
}

/**
 * Neuron-level crossover: for each neuron, copy its incoming weights and
 * bias from one parent or the other. Keeps useful feature detectors intact.
 */
export function crossover(layers: readonly number[], a: Float32Array, b: Float32Array, rng: Rng): Float32Array {
  const child = new Float32Array(a.length);
  let off = 0;
  for (let l = 1; l < layers.length; l++) {
    const span = layers[l - 1] + 1;
    for (let j = 0; j < layers[l]; j++) {
      const src = rng.chance(0.5) ? a : b;
      child.set(src.subarray(off, off + span), off);
      off += span;
    }
  }
  return child;
}

export function mutate(g: Float32Array, opts: GaOptions, rng: Rng): void {
  for (let i = 0; i < g.length; i++) {
    if (rng.chance(opts.resetRate)) g[i] = rng.gauss() * 0.8;
    else if (rng.chance(opts.mutationRate)) g[i] += rng.gauss() * opts.mutationStd;
  }
}

/** Indices of the population sorted by fitness, best first. */
export function rank(fitness: ArrayLike<number>): number[] {
  return Array.from({ length: fitness.length }, (_, i) => i).sort((x, y) => fitness[y] - fitness[x]);
}

/** Breed the next generation. `size` may differ from the current population size. */
export function nextGeneration(
  layers: readonly number[],
  pop: Float32Array[],
  fitness: ArrayLike<number>,
  opts: GaOptions,
  rng: Rng,
  size = opts.populationSize,
): Float32Array[] {
  const order = rank(fitness);
  const next: Float32Array[] = [];
  for (let i = 0; i < Math.min(opts.eliteCount, size, order.length); i++) next.push(pop[order[i]].slice());
  while (next.length < size) {
    const pa = pop[tournament(fitness, opts.tournamentSize, rng)];
    let child: Float32Array;
    if (rng.chance(opts.crossoverRate)) {
      const pb = pop[tournament(fitness, opts.tournamentSize, rng)];
      child = crossover(layers, pa, pb, rng);
    } else {
      child = pa.slice();
    }
    mutate(child, opts, rng);
    next.push(child);
  }
  return next;
}

export interface GenerationStats {
  generation: number;
  best: number;
  mean: number;
  bestIndex: number;
}

export function stats(generation: number, fitness: ArrayLike<number>): GenerationStats {
  let best = -Infinity;
  let bestIndex = 0;
  let sum = 0;
  for (let i = 0; i < fitness.length; i++) {
    sum += fitness[i];
    if (fitness[i] > best) {
      best = fitness[i];
      bestIndex = i;
    }
  }
  return { generation, best, mean: sum / fitness.length, bestIndex };
}
