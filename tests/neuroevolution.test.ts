import { describe, it, expect } from 'vitest';
import { createRng } from '../src/game/rng.ts';
import {
  DEFAULT_GA, crossover, mutate, nextGeneration, randomPopulation, rank, stats,
} from '../src/ai/neuroevolution.ts';
import { createNetwork, forward, DEFAULT_LAYERS } from '../src/ai/network.ts';
import { generateLevel } from '../src/game/level.ts';
import { runEpisode } from '../src/ai/policy.ts';

describe('genetic algorithm', () => {
  it('improves fitness over generations on a fixed seed (toy task)', () => {
    // Task: make the tiny network output ~1 for input [1, 0] and ~0 for [0, 1].
    const layers = [2, 3, 1];
    const rng = createRng(42);
    const fitnessOf = (g: Float32Array) => {
      const net = createNetwork(layers, g);
      const a = forward(net, [1, 0])[0];
      const b = forward(net, [0, 1])[0];
      return 2 - (1 - a) - b;
    };
    let pop = randomPopulation(layers, 40, rng);
    const opts = { ...DEFAULT_GA, populationSize: 40 };
    const first = stats(0, pop.map(fitnessOf));
    let last = first;
    for (let g = 1; g <= 40; g++) {
      const fit = pop.map(fitnessOf);
      pop = nextGeneration(layers, pop, fit, opts, rng);
      last = stats(g, pop.map(fitnessOf));
    }
    expect(last.best).toBeGreaterThan(first.best);
    expect(last.mean).toBeGreaterThan(first.mean);
    expect(last.best).toBeGreaterThan(1.8);
  });

  it('is deterministic for the same seed', () => {
    const run = () => {
      const rng = createRng(7);
      const pop = randomPopulation([2, 2, 1], 10, rng);
      const next = nextGeneration([2, 2, 1], pop, pop.map((g) => g[0]), { ...DEFAULT_GA, populationSize: 10 }, rng);
      return next.map((g) => Array.from(g)).flat();
    };
    expect(run()).toEqual(run());
  });

  it('keeps the elite unchanged', () => {
    const rng = createRng(3);
    const layers = [2, 2, 1];
    const pop = randomPopulation(layers, 12, rng);
    const fit = pop.map((_, i) => i);
    const next = nextGeneration(layers, pop, fit, { ...DEFAULT_GA, populationSize: 12, eliteCount: 2 }, rng);
    expect(Array.from(next[0])).toEqual(Array.from(pop[11]));
    expect(Array.from(next[1])).toEqual(Array.from(pop[10]));
    expect(next).toHaveLength(12);
  });

  it('crossover copies whole neurons from either parent', () => {
    const layers = [2, 2, 1];
    const a = new Float32Array(9).fill(1);
    const b = new Float32Array(9).fill(2);
    const child = crossover(layers, a, b, createRng(5));
    // Neurons are blocks of 3 weights (2 inputs + bias) then 1 block of 3.
    for (const [s, e] of [[0, 3], [3, 6], [6, 9]]) {
      const block = Array.from(child.slice(s, e));
      expect(block.every((v) => v === block[0])).toBe(true);
    }
  });

  it('mutation changes some weights', () => {
    const g = new Float32Array(200);
    mutate(g, { ...DEFAULT_GA, mutationRate: 0.5 }, createRng(9));
    expect(g.some((v) => v !== 0)).toBe(true);
  });

  it('ranks best first', () => {
    expect(rank([1, 5, 3])).toEqual([1, 2, 0]);
  });

  it('evolves real runners that go further on a real level', () => {
    const rng = createRng(11);
    const level = generateLevel(99, 'night', 90);
    const layers = [...DEFAULT_LAYERS];
    let pop = randomPopulation(layers, 30, rng);
    const evalPop = () => pop.map((g) => runEpisode(createNetwork(layers, g), level).fitness);
    const firstBest = Math.max(...evalPop());
    let best = firstBest;
    for (let gen = 0; gen < 12; gen++) {
      const fit = evalPop();
      best = Math.max(best, ...fit);
      pop = nextGeneration(layers, pop, fit, { ...DEFAULT_GA, populationSize: 30 }, rng);
    }
    best = Math.max(best, ...evalPop());
    expect(best).toBeGreaterThanOrEqual(firstBest);
    expect(best).toBeGreaterThan(20);
  });
});
