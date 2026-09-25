/**
 * Training Lab simulation: a population of runners plays the same level
 * at the same time, generation after generation, evolving with the same
 * neuroevolution code as the offline trainer. Pure logic: runs inside a
 * Web Worker (lab.worker.ts), or on the main thread as a fallback.
 */
import { TILE, DT } from '../game/constants.ts';
import { cloneLevel, generateLevel, type Level, type ThemeId } from '../game/level.ts';
import { createRunner, stepEnemies, stepRunner, type Action, type Runner } from '../game/physics.ts';
import { sense, N_SENSES } from '../game/senses.ts';
import { createRng, type Rng } from '../game/rng.ts';
import { createNetwork, DEFAULT_LAYERS, forward, type Network } from './network.ts';
import { outputsToAction, fitnessOf } from './policy.ts';
import { DEFAULT_GA, nextGeneration, randomPopulation, stats, type GaOptions } from './neuroevolution.ts';

export interface LabConfig {
  popSize: number;
  mutationRate: number;
  seed: number;
  theme: ThemeId;
  cols?: number;
}

export interface LabFrame {
  gen: number;
  step: number;
  alive: number;
  pop: number;
  /** Per runner: x, y, alive(0/1), onGround(0/1), vy. */
  runners: Float32Array;
  leader: number;
  leaderActs: number[][];
  leaderWeights: number[];
  /** Leader's enemies: x, y, alive per enemy. */
  enemies: Float32Array;
  /** Leader's coins taken (0/1). */
  coins: Uint8Array;
  champion: { x: number; y: number; alive: boolean; onGround: boolean } | null;
}

export interface GenResult {
  gen: number;
  best: number;
  mean: number;
  finished: number;
  history: { gen: number; best: number; mean: number }[];
  bestWeights: number[];
}

interface Agent {
  net: Network;
  runner: Runner;
  level: Level;
  done: boolean;
  lastX: number;
  stuck: number;
}

const STUCK_STEPS = 150;

export class LabSim {
  layers = [...DEFAULT_LAYERS];
  cfg: LabConfig;
  ga: GaOptions;
  rng: Rng;
  level!: Level;
  genomes: Float32Array[] = [];
  agents: Agent[] = [];
  gen = 0;
  step = 0;
  time = 0;
  limit = 0;
  history: { gen: number; best: number; mean: number }[] = [];
  bestWeights: Float32Array | null = null;
  champion: Agent | null = null;
  private championWeights: Float32Array | null = null;
  private input = new Float32Array(N_SENSES);
  private action: Action = { speed: 0, jump: false, doubleJump: false, dive: false, dash: false };

  constructor(cfg: LabConfig) {
    this.cfg = { ...cfg };
    this.ga = { ...DEFAULT_GA, populationSize: cfg.popSize, mutationRate: cfg.mutationRate, eliteCount: 3 };
    this.rng = createRng(cfg.seed ^ 0x5eed);
    this.setLevel(cfg.seed, cfg.theme);
    this.reset();
  }

  setLevel(seed: number, theme: ThemeId): void {
    this.cfg.seed = seed;
    this.cfg.theme = theme;
    this.level = generateLevel(seed, theme, this.cfg.cols ?? 150);
    this.limit = this.level.cols * 14;
    if (this.genomes.length) this.startGeneration();
  }

  /** Brand new random population. */
  reset(): void {
    this.gen = 0;
    this.history = [];
    this.bestWeights = null;
    this.genomes = randomPopulation(this.layers, this.cfg.popSize, this.rng);
    this.startGeneration();
  }

  configure(popSize: number, mutationRate: number): void {
    this.ga.mutationRate = mutationRate;
    if (popSize !== this.cfg.popSize) {
      this.cfg.popSize = popSize;
      this.ga.populationSize = popSize;
    }
    this.cfg.mutationRate = mutationRate;
  }

  setChampion(weights: ArrayLike<number> | null): void {
    this.championWeights = weights ? Float32Array.from(weights) : null;
    this.champion = this.championWeights ? this.makeAgent(this.championWeights) : null;
  }

  private makeAgent(genome: Float32Array): Agent {
    const level = cloneLevel(this.level);
    const runner = createRunner(3 * TILE, level);
    return { net: createNetwork(this.layers, genome), runner, level, done: false, lastX: runner.x, stuck: 0 };
  }

  private startGeneration(): void {
    this.step = 0;
    this.time = 0;
    this.agents = this.genomes.map((g) => this.makeAgent(g));
    if (this.championWeights) this.champion = this.makeAgent(this.championWeights);
  }

  private stepAgent(a: Agent): void {
    if (a.done) return;
    stepEnemies(a.level, this.time);
    sense(a.runner, a.level, this.input);
    outputsToAction(forward(a.net, this.input), this.action);
    stepRunner(a.runner, a.level, this.action);
    const r = a.runner;
    if (r.maxX > a.lastX + TILE) {
      a.lastX = r.maxX;
      a.stuck = 0;
    } else if (++a.stuck > STUCK_STEPS) {
      a.done = true;
    }
    if (r.dead || r.finished) a.done = true;
  }

  /** Advance `n` steps. Returns a generation result if one finished. */
  advance(n: number): GenResult | null {
    let result: GenResult | null = null;
    for (let k = 0; k < n; k++) {
      this.time += DT;
      this.step++;
      let alive = 0;
      for (const a of this.agents) {
        this.stepAgent(a);
        if (!a.done) alive++;
      }
      if (this.champion) this.stepAgent(this.champion);
      if (alive === 0 || this.step >= this.limit) {
        result = this.evolve();
        break;
      }
    }
    return result;
  }

  /** Run until the current generation ends. */
  runGeneration(): GenResult {
    for (;;) {
      const r = this.advance(1000);
      if (r) return r;
    }
  }

  private evolve(): GenResult {
    const fitness = this.agents.map((a) => fitnessOf(a.runner, a.level));
    const s = stats(this.gen, fitness);
    const finished = this.agents.filter((a) => a.runner.finished).length;
    this.history.push({ gen: this.gen, best: Math.round(s.best * 10) / 10, mean: Math.round(s.mean * 10) / 10 });
    if (this.history.length > 300) this.history.shift();
    this.bestWeights = this.genomes[s.bestIndex].slice();
    const res: GenResult = {
      gen: this.gen,
      best: s.best,
      mean: s.mean,
      finished,
      history: this.history.slice(),
      bestWeights: Array.from(this.bestWeights),
    };
    this.genomes = nextGeneration(this.layers, this.genomes, fitness, this.ga, this.rng, this.cfg.popSize);
    this.gen++;
    this.startGeneration();
    return res;
  }

  /** Index of the runner furthest ahead that is still alive (or furthest overall). */
  leader(): number {
    let best = 0;
    let bx = -Infinity;
    this.agents.forEach((a, i) => {
      const score = a.runner.x + (a.done ? -1e6 : 0);
      if (score > bx) {
        bx = score;
        best = i;
      }
    });
    return best;
  }

  frame(): LabFrame {
    const n = this.agents.length;
    const runners = new Float32Array(n * 5);
    let alive = 0;
    this.agents.forEach((a, i) => {
      const r = a.runner;
      runners[i * 5] = r.x;
      runners[i * 5 + 1] = r.y;
      runners[i * 5 + 2] = a.done ? 0 : 1;
      runners[i * 5 + 3] = r.onGround ? 1 : 0;
      runners[i * 5 + 4] = r.vy;
      if (!a.done) alive++;
    });
    const li = this.leader();
    const lead = this.agents[li];
    const enemies = new Float32Array(lead.level.enemies.length * 3);
    lead.level.enemies.forEach((e, i) => {
      enemies[i * 3] = e.x;
      enemies[i * 3 + 1] = e.y;
      enemies[i * 3 + 2] = e.alive ? 1 : 0;
    });
    const coins = Uint8Array.from(lead.level.coins, (c) => (c.taken ? 1 : 0));
    const ch = this.champion;
    return {
      gen: this.gen,
      step: this.step,
      alive,
      pop: n,
      runners,
      leader: li,
      leaderActs: lead.net.acts.map((a) => Array.from(a)),
      leaderWeights: Array.from(lead.net.weights),
      enemies,
      coins,
      champion: ch ? { x: ch.runner.x, y: ch.runner.y, alive: !ch.done, onGround: ch.runner.onGround } : null,
    };
  }
}
